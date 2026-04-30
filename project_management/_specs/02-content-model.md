# 02 — Content model

## Markdown files

All content lives in `content/`. Two locations:

| Path | Route |
|---|---|
| `content/home.md` | `/` |
| `content/pages/<slug>.md` | `/<slug>` |

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
  if (!slug?.length) notFound();
  const page = await getPagesRepo().getPageBySlug(slug.join("/"));
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

## Content files to create

Create all five files before running `npm run build`. Without them `generateStaticParams` returns an empty array and the homepage 404s. The `linux.md` full example is at the bottom of this spec — copy it to `content/pages/linux.md`.

```markdown
<!-- content/home.md -->
---
title: "OS Stories"
layout: "standard"
summary: "A scrolling history of operating systems."
---

Welcome to OS Stories. Explore the operating systems that shaped computing.

- [Linux](/linux)
- [macOS](/macos)
- [Windows](/windows)
- [Mobile](/mobile)
```

```markdown
<!-- content/pages/macos.md -->
---
title: "macOS"
layout: "presentation"
summary: "Elegant, closed, and deeply integrated."
---

## The desktop Apple built

macOS set the standard for consumer operating systems.

---

## From System 1 to Sequoia

Over 40 years of refinement.
```

```markdown
<!-- content/pages/windows.md -->
---
title: "Windows"
layout: "presentation"
summary: "The OS that runs the world's offices."
---

## Ubiquity by default

Windows ships on most of the world's PCs.

---

## From MS-DOS to 11

A 40-year journey of backward compatibility.
```

```markdown
<!-- content/pages/mobile.md -->
---
title: "Mobile OS"
layout: "presentation"
summary: "The computer in your pocket."
---

## iOS and Android

Two ecosystems, billions of devices.

---

## The smartphone revolution

2007 changed everything.
```

## Example page: Linux

```markdown
---
title: "Linux"
layout: "presentation"
summary: "Free, open, and built for everyone."
---

![bg](/images/linux-dark.jpg)

## The kernel that runs the world

Linux powers everything from your router to the cloud.

---

![split](/images/linus.jpg)

## One person, one idea

Linus Torvalds posted a message in 1991. The rest is history.

---

## Why Linux?

- Free and open source
- Runs on any hardware
- Maintained by thousands of contributors
```
