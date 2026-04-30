# 04 — Layouts

## Two layouts only

| Layout | Frontmatter value | Use |
|---|---|---|
| Standard | `layout: "standard"` | Long-form article, content flows top to bottom, each block reveals on scroll |
| Presentation | `layout: "presentation"` | Body split into sticky slides; content animates in as you scroll through each section |

## PageLayoutFactory

```tsx
// src/components/layouts/PageLayoutFactory.tsx
import type { PageData } from "@/lib/content/repository";
import { StandardLayout } from "./StandardLayout";
import { PresentationLayout } from "./PresentationLayout";

export function PageLayoutFactory({ page }: { page: PageData }) {
  if (page.frontmatter.layout === "presentation") {
    return <PresentationLayout page={page} />;
  }
  return <StandardLayout page={page} />;
}
```

Used identically in both `src/app/page.tsx` and `src/app/[...slug]/page.tsx`.

## StandardLayout

Responsibilities:
- Render a full-width hero image if `frontmatter.heroImage` is set.
- Render the page title and summary.
- Pass the markdown body to `<MarkdownRenderer />`, which wraps each block in `<Reveal>`.
- Apply a max-width reading column (~68ch) centered on screen.
- Simple `<nav>` with site title and links at the top.

```tsx
// src/components/layouts/StandardLayout.tsx
import Link from "next/link";
import Image from "next/image";
import type { PageData } from "@/lib/content/repository";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import styles from "./StandardLayout.module.css";

export function StandardLayout({ page }: { page: PageData }) {
  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <Link href="/">OS Stories</Link>
      </nav>
      <main>
        {page.frontmatter.heroImage && (
          <div className={styles.hero}>
            <Image src={page.frontmatter.heroImage} alt="" fill style={{ objectFit: "cover" }} />
          </div>
        )}
        <article className={styles.body}>
          <h1>{page.frontmatter.title}</h1>
          {page.frontmatter.summary && <p className={styles.summary}>{page.frontmatter.summary}</p>}
          <MarkdownRenderer>{page.content}</MarkdownRenderer>
        </article>
      </main>
    </div>
  );
}
```

```css
/* src/components/layouts/StandardLayout.module.css */
.root {
  min-height: 100vh;
}

.nav {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--color-muted);
}

.hero {
  position: relative;  /* required for Image fill */
  width: 100%;
  height: 60vh;
  overflow: hidden;
}

.body {
  max-width: 68ch;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.summary {
  color: var(--color-muted);
  font-size: 1.125rem;
  margin-bottom: 2rem;
}
```

## PresentationLayout

Responsibilities:
- Parse the markdown body into slides using `splitSlides(body)`.
- Render each slide inside `<PresentationSlide index={i}>`.
- For each slide, render the right visual based on the slide's `kind`:
  - `plain` — full-width text content, centered
  - `bg` — full-bleed background image with text overlay
  - `split` — image left 50%, text right 50%
  - `split-reverse` — text left 50%, image right 50%
- Render a fixed progress bar at the top (a thin line whose width tracks overall scroll position).

```tsx
// src/components/layouts/PresentationLayout.tsx
import Image from "next/image";
import type { PageData } from "@/lib/content/repository";
import type { ParsedSlide } from "@/lib/content/repository";
import { PresentationSlide } from "@/components/motion/PresentationSlide";
import { MarkdownRenderer } from "@/components/markdown/MarkdownRenderer";
import { splitSlides } from "@/lib/content/repository";
import { ProgressBar } from "./ProgressBar";
import styles from "./PresentationLayout.module.css";

export function PresentationLayout({ page }: { page: PageData }) {
  const slides = splitSlides(page.content);
  return (
    <div className={styles.root}>
      <ProgressBar />
      {slides.map((slide, i) => (
        <PresentationSlide key={i} index={i}>
          <SlideStage slide={slide} />
        </PresentationSlide>
      ))}
    </div>
  );
}

// Renders one slide's visual based on its kind
function SlideStage({ slide }: { slide: ParsedSlide }) {
  if (slide.kind === "bg") {
    return (
      <div className={styles.slideBg} style={{ backgroundImage: `url(${slide.imageUrl})` }}>
        <div className={styles.slideBgContent}>
          <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
        </div>
      </div>
    );
  }
  if (slide.kind === "split" || slide.kind === "split-reverse") {
    return (
      <div className={slide.kind === "split" ? styles.slideSplit : styles.slideSplitReverse}>
        <div className={styles.splitImageWrapper}>
          <Image src={slide.imageUrl!} alt="" fill style={{ objectFit: "cover" }} />
        </div>
        <div className={styles.slideContent}>
          <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
        </div>
      </div>
    );
  }
  // plain
  return (
    <div className={styles.slidePlain}>
      <MarkdownRenderer>{slide.markdown}</MarkdownRenderer>
    </div>
  );
}
```

```css
/* src/components/layouts/PresentationLayout.module.css */
.root {
  /* slides stack vertically; each PresentationSlide is 170vh tall */
}

/* bg kind: full-bleed image behind text */
.slideBg {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* bg kind only: white text over dark background image */
.slideBgContent {
  max-width: 60ch;
  padding: 2rem;
  color: var(--color-bg);
}

/* split/split-reverse kind: text on page background — inherits --color-text */
.slideContent {
  flex: 1;          /* fills remaining 50% in split/split-reverse flex row */
  min-width: 0;     /* prevents flex blowout */
  padding: 2rem;
  display: flex;
  align-items: center;
}

/* split kind: image left, text right */
.slideSplit {
  display: flex;
  width: 100%;
  height: 100%;
}

/* split-reverse kind: text left, image right */
.slideSplitReverse {
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
  height: 100%;
}

/* wrapper required for Image fill */
.splitImageWrapper {
  position: relative;
  width: 50%;
  height: 100%;
}

/* plain kind: centered text */
.slidePlain {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
}
```

`ProgressBar` (`src/components/layouts/ProgressBar.tsx`) is a `"use client"` component. It calls `useScroll()` with no target (tracks the whole document) and drives a `<motion.div>` `scaleX` from 0 → 1. Fixed at top of viewport, `height: 3px`, `transform-origin: left`.

## MarkdownRenderer

Renders a markdown string to React. Wraps each top-level block in `<Reveal>` automatically.

```tsx
// src/components/markdown/MarkdownRenderer.tsx
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { ContextualLink } from "@/components/ui/ContextualLink";

export function MarkdownRenderer({ children }: { children: string }) {
  // Split on one or more blank lines; discard empty fragments
  const blocks = children.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  return (
    <div>
      {blocks.map((block, i) => (
        <Reveal key={i} delay={i * 0.04}>
          {renderBlock(block)}
        </Reveal>
      ))}
    </div>
  );
}

function renderBlock(block: string): ReactNode {
  if (block.startsWith("### ")) return <h3>{renderInline(block.slice(4))}</h3>;
  if (block.startsWith("## "))  return <h2>{renderInline(block.slice(3))}</h2>;
  if (block.startsWith("# "))   return <h1>{renderInline(block.slice(2))}</h1>;

  // List: every line starts with "- "
  const lines = block.split("\n");
  if (lines.every((l) => l.startsWith("- "))) {
    return <ul>{lines.map((l, i) => <li key={i}>{renderInline(l.slice(2))}</li>)}</ul>;
  }

  return <p>{renderInline(block)}</p>;
}

// Converts [text](href) to <ContextualLink> inline; returns plain text otherwise
function renderInline(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return <>{parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return m ? <ContextualLink key={i} href={m[2]}>{m[1]}</ContextualLink> : part;
  })}</>;
}
```

No `next-mdx-remote` or MDX pipeline needed. This hand-rolled parser covers all content used in the OS pages.

## ContextualLink

Used by `MarkdownRenderer` for all inline links. Routes internal links through the basePath helper, opens external links in a new tab.

`url()` is defined in `src/lib/site-config.ts` — see **spec 05** for the full implementation.

```tsx
// src/components/ui/ContextualLink.tsx
import Link from "next/link";
import { url } from "@/lib/site-config"; // defined in spec 05

export function ContextualLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={url(href)}>{children}</Link>;
}
```

## ProgressBar

Fixed thin bar at the top of the viewport that fills left-to-right as the user scrolls the page. Only visible on presentation pages.

```tsx
// src/components/layouts/ProgressBar.tsx
"use client";
import { motion, useScroll } from "framer-motion";

export function ProgressBar() {
  const { scrollYProgress } = useScroll(); // no target = whole document
  return (
    <motion.div
      style={{
        scaleX: scrollYProgress,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--color-accent, #0070f3)",
        transformOrigin: "left",
        zIndex: 100,
      }}
    />
  );
}
```

## Do not

- Do not add a third layout type without a new spec.
- Do not nest `PresentationSlide` inside `PresentationSlide`.
- Do not render `MarkdownRenderer` twice for the same content.
- Do not use Tailwind classes — CSS Modules only.
