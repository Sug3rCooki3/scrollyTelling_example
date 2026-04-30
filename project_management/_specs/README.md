# Specs

Specification for the OS scrollytelling site. Read in order.

| # | File | What it covers |
|---|---|---|
| 00 | [00-overview.md](./00-overview.md) | What we're building, goals, non-goals, success criteria |
| 01 | [01-architecture.md](./01-architecture.md) | Tech stack, directory layout, data flow |
| 02 | [02-content-model.md](./02-content-model.md) | Markdown schema, routing, slide splitting, example pages |
| 03 | [03-motion-system.md](./03-motion-system.md) | Scrollytelling animations — `Reveal`, `PresentationSlide`, `SlideContext` |
| 04 | [04-layouts.md](./04-layouts.md) | `StandardLayout`, `PresentationLayout`, `MarkdownRenderer` |
| 05 | [05-deployment.md](./05-deployment.md) | GitHub Pages, `next.config.ts`, CI workflow |

## How to use these specs with an AI coder

Give the AI the spec file(s) relevant to the task, then give the instruction. Keep each session focused on one spec. Example prompts:

- *"Read spec 03 and implement the three motion components exactly as described."*
- *"Read spec 02 and create the ContentRepository and Zod schema."*
- *"Read spec 04 and implement StandardLayout and PresentationLayout."*

Always end a session with: *"Run `npm run lint && npm run test && npm run build`. Fix any errors."*
