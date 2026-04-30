# 00 — Overview

## What we are building

A static Next.js scrollytelling site that tells the story of **different operating systems** — Linux, macOS, Windows, and mobile — through scroll-driven animations and sticky slide sections.

The site has two modes:
- **Standard pages** — long-form article with scroll-reveal animations.
- **Presentation pages** — sticky-slide decks where content animates in as you scroll through each section.

## Topic

Operating systems. Each major OS gets its own page or section: history, philosophy, strengths, and who it is for. Content lives in Markdown files.

## Goals

1. Ship a fast, static, deployable Next.js site.
2. Tell the OS story through scroll animations, not walls of text.
3. Keep the codebase small enough for one person (or one AI session) to understand in full.

## Non-goals

- No CMS, no database, no server runtime.
- No search, no comments, no dark mode (v1).
- No GSAP, no react-scrollama, no locomotive-scroll.
- No Tailwind — CSS Modules only.

## Success criteria

- `npm run build` produces a clean `out/` with zero errors.
- A new OS page can be added by dropping one `.md` file under `content/pages/`.
- Scroll animations run at 60fps and drop to instant transitions under `prefers-reduced-motion`.
- Site deploys to GitHub Pages via one `git push`.
