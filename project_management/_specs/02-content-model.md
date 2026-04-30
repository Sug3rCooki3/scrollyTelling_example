# 02 — Content model

## Markdown files

All content lives in `content/`. Two locations:

| Path | Route |
|---|---|
| `content/home.md` | `/` |
| `content/pages/<slug>.md` | `/<slug>` |

## Implementation status

Status as of 2026-04-30 after QA on **spec 01**:

- Implemented: frontmatter schema validation, file-backed content repository, static route generation, explicit slug validation in `[...slug]`, slide splitting for presentation pages, and seeded content for `home`, `linux`, `macos`, `windows`, and `mobile`.
- Verified locally: `npm run test` covers `splitSlides`, repository validation failures, missing-file behavior, and slug filtering; `npm run test:e2e` covers the generated routes; and `npm run build` succeeds with the current content set.
- Current seeded content mix: `home` and `windows` use `standard`; `linux`, `macos`, and `mobile` use `presentation`.
- Remaining QA gap: repository behavior is unit-tested, but there is still no browser-level scenario for bad content files because invalid frontmatter is designed to fail at build time.

## Notable implementation details

- The catch-all route in `src/app/[...slug]/page.tsx` performs a second explicit kebab-case validation check before loading content and returns `notFound()` for invalid slugs.
- The repository still filters `getAllSlugs()` to kebab-case names, so invalid markdown filenames are excluded from static generation.
- Image-directive slide parsing is implemented and tested, but the seeded content currently uses text-only slides.

## Frontmatter schema (Zod)

```ts
// src/lib/content/schema.ts
import { z } from "zod";

export const PageFrontmatterSchema = z.object({
  title: z.string().min(1),
  layout: z.enum(["standard", "presentation"]),
  summary: z.string().optional(),
  heroImage: z.string().optional(),   // path under public/images/
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

export type PageFrontmatter = z.infer<typeof PageFrontmatterSchema>;
```

Invalid frontmatter throws at build time — not in the browser.

## ContentRepository

```ts
// src/lib/content/repository.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { PageFrontmatterSchema, type PageFrontmatter } from "./schema";

export interface PageData {
  slug: string;
  frontmatter: PageFrontmatter;
  content: string;        // raw markdown body (no frontmatter)
}

export class ContentRepository {
  constructor(private readonly baseDir: string) {}

  async getPageBySlug(slug: string): Promise<PageData> {
    const filePath = path.join(this.baseDir, `${slug}.md`);
    const source = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(source);
    const result = PageFrontmatterSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid frontmatter in ${filePath}: ${result.error.message}`);
    }
    return { slug, frontmatter: result.data, content };
  }

  async getAllSlugs(): Promise<string[]> {
    const files = await fs.readdir(this.baseDir);
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .filter((s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s));
  }
}

export const getHomeRepo  = () => new ContentRepository(path.join(process.cwd(), "content"));
export const getPagesRepo = () => new ContentRepository(path.join(process.cwd(), "content/pages"));
```

Slug validation: kebab-case only (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`). Any other slug returns 404.

## App Router pages

Two files wire content to the screen. Implement both exactly as shown.

```tsx
// src/app/page.tsx
import type { Metadata } from "next";
import { getHomeRepo } from "@/lib/content/repository";
import { PageLayoutFactory } from "@/components/layouts/PageLayoutFactory"; // defined in spec 04

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomeRepo().getPageBySlug("home");
  return { title: page.frontmatter.seo?.title ?? page.frontmatter.title };
}

export default async function Home() {
  const page = await getHomeRepo().getPageBySlug("home");
  return <PageLayoutFactory page={page} />;
}
```

```tsx
// src/app/[...slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPagesRepo } from "@/lib/content/repository";
import { PageLayoutFactory } from "@/components/layouts/PageLayoutFactory"; // defined in spec 04

export const dynamicParams = false;   // unknown slugs → 404, not 500

export async function generateStaticParams() {
  const slugs = await getPagesRepo().getAllSlugs();
  return slugs.map((slug) => ({ slug: [slug] }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string[] }> }
): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPagesRepo().getPageBySlug(slug.join("/"));
  return { title: page.frontmatter.seo?.title ?? page.frontmatter.title };
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  if (!slug?.length) {
    notFound();
  }

  const joinedSlug = slug.join("/");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(joinedSlug)) {
    notFound();
  }

  const page = await getPagesRepo().getPageBySlug(joinedSlug);
  return <PageLayoutFactory page={page} />;
}
```

## Presentation slide splitting

Presentation pages split their body on `---` (horizontal rule on its own line).

```markdown
---
title: "Linux"
layout: "presentation"
---

## Slide one content here

---

## Slide two content here
```

> **Note:** The `---` that splits slides is in the markdown body only, after the YAML frontmatter block. The frontmatter `---` delimiters are processed by `gray-matter` before the body ever reaches `splitSlides`.

Each fragment becomes one `PresentationSlide`. Image directives on the first line of a fragment set the slide kind:

| Directive | Kind | Effect |
|---|---|---|
| `![bg](/images/x.jpg)` | `bg` | Full-bleed background image |
| `![split](/images/x.jpg)` | `split` | Image left, text right |
| `![split-reverse](/images/x.jpg)` | `split-reverse` | Text left, image right |
| *(none)* | `plain` | Text only |

Export `splitSlides` and `ParsedSlide` from `src/lib/content/repository.ts` alongside the `ContentRepository` class.

```ts
export interface ParsedSlide {
  kind: "plain" | "bg" | "split" | "split-reverse";
  imageUrl?: string;   // only for bg, split, split-reverse
  markdown: string;    // body with image directive line removed
}

export function splitSlides(body: string): ParsedSlide[] {
  return body
    .split(/^---$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const imageMatch = raw.match(/^!\[([^\]]+)\]\(([^)]+)\)/);
      if (!imageMatch) return { kind: "plain", markdown: raw };
      const [fullMatch, alt, src] = imageMatch;
      const markdown = raw.replace(fullMatch, "").trim();
      if (alt === "bg") return { kind: "bg", imageUrl: src, markdown };
      if (alt === "split") return { kind: "split", imageUrl: src, markdown };
      if (alt === "split-reverse") return { kind: "split-reverse", imageUrl: src, markdown };
      return { kind: "plain", markdown: raw };
    });
}
```

## Seeded content files

The following five markdown files are already created in the repo and are the current build baseline.

```markdown
<!-- content/home.md -->
---
title: "OS Stories"
layout: "standard"
summary: "A scrolling history of operating systems."
seo:
  title: "OS Stories"
  description: "The story of operating systems, told through animated scroll-driven pages."
---

Welcome to OS Stories. Explore the operating systems that shaped computing.

- [Linux](/linux)
- [macOS](/macos)
- [Windows](/windows)
- [Mobile](/mobile)

## Why these systems matter

Operating systems decide who gets power, how software reaches people, and what kinds of computing feel natural.

## How to read this site

Some pages read like essays. Others lock into sticky slides and animate as you move through the story.
```

```markdown
<!-- content/pages/macos.md -->
---
title: "macOS"
layout: "presentation"
summary: "Elegant, closed, and deeply integrated."
seo:
  title: "macOS | OS Stories"
  description: "A presentation-style history of macOS."
---

## The desktop Apple built

macOS turned interface polish into strategy. Hardware and software moved together, which made the whole product feel more coherent.

---

## From System 1 to Apple silicon

Over decades, Apple kept rebuilding the platform without giving up the feeling that the machine should disappear behind the work.

---

## Who it is for

macOS works best for people who value integration, industrial design, and a platform that narrows choice in exchange for consistency.
```

```markdown
<!-- content/pages/windows.md -->
---
title: "Windows"
layout: "standard"
summary: "The mainstream operating system that turned compatibility into scale."
seo:
  title: "Windows | OS Stories"
  description: "A long-form look at Windows and its role in mass-market computing."
---

## The default desktop for most people

Windows became dominant not because it was pure, but because it adapted to enormous hardware variety and decades of software expectations.

## Its real strength was compatibility

Businesses, schools, OEMs, and game developers all converged on Windows because the platform kept old workflows alive while still moving forward.

## Who it is for

Windows is for the broad middle of computing: users who need reach, peripheral support, enterprise software, and the least surprise when sharing files with everyone else.
```

```markdown
<!-- content/pages/mobile.md -->
---
title: "Mobile"
layout: "presentation"
summary: "The operating system leaves the desk and becomes the world in your pocket."
seo:
  title: "Mobile | OS Stories"
  description: "A scroll-driven look at the rise of mobile operating systems."
---

## Computing shrank and intensified

Mobile operating systems changed the center of gravity from files and windows to gestures, apps, sensors, and constant connection.

---

## iOS and Android split the market

One model prized control and vertical integration. The other scaled through manufacturer diversity and broad distribution.

---

## Who it is for

Mobile is for everyone, which is why its operating systems are defined less by power features and more by reach, safety, battery life, and habit.
```

## Example page: Linux

```markdown
---
title: "Linux"
layout: "presentation"
summary: "Open systems, portable kernels, and a culture built around control."
seo:
  title: "Linux | OS Stories"
  description: "The Linux story told through scroll-driven presentation slides."
---

## Linux became the operating system of builders

It won servers, containers, embedded devices, and the imagination of people who want to understand the machine they use.

---

## A kernel, not a single product

Linux spread because distributions turned one kernel into many philosophies: stable, experimental, corporate, minimalist.

---

## Who it is for

Linux rewards people who want leverage, automation, and systems they can reshape instead of merely consume.
```

## Current QA coverage

- Unit coverage: `tests/unit/repository.test.ts` verifies `splitSlides()` for plain slides, supported image directives, unsupported directives, invalid frontmatter errors, missing-file behavior, and slug filtering.
- Browser coverage: `tests/browser/routes.spec.ts` verifies the homepage and each seeded route render successfully.
- Build coverage: `generateStaticParams()` and page metadata execute successfully during `npm run build` with the current content set.
