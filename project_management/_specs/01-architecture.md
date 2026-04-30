# 01 — Architecture

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 App Router, `output: "export"` |
| Language | TypeScript (strict) |
| UI | React 19 |
| Animation | `framer-motion` ^12 |
| Markdown | `gray-matter` |
| Validation | `zod` ^4 |
| Styling | CSS Modules + CSS custom properties |
| Unit tests | `vitest` + jsdom |
| E2E tests | `@playwright/test` (Chromium) |
| Deploy | GitHub Pages via GitHub Actions |

## Implementation status

Status as of 2026-04-30 after implementing **spec 00**:

- Implemented: static Next.js app scaffold, content loading, standard and presentation layouts, motion primitives, markdown renderer, sample OS content, unit test, browser smoke tests, and GitHub Pages workflow.
- Verified locally: `npm run lint`, `npm run test`, `npm run test:e2e`, and `npm run build` all pass.
- Export status: `next build` generates static routes for `/`, `/linux`, `/macos`, `/windows`, and `/mobile`.
- Remaining QA gap: 60fps animation performance has not been benchmarked yet. Browser coverage currently consists of route-level smoke tests, not detailed interaction or accessibility assertions.

## Notable implementation changes

- `eslint.config.mjs` uses Next 16's native flat-config export (`eslint-config-next/core-web-vitals`) instead of `FlatCompat`, because the compat-based version failed under the installed ESLint 9 / Next 16 toolchain.
- `tsconfig.json` was adjusted by Next 16 during the first production build: `jsx` is now `react-jsx`, and `.next/dev/types/**/*.ts` is included.
- `next-env.d.ts` now includes the generated route type import from `.next/types/routes.d.ts`; this is tool-managed by Next and should not be hand-edited.

## Directory layout

```
scrolly-os/
├── content/
│   ├── home.md                  # → /
│   └── pages/
│       ├── linux.md             # → /linux
│       ├── macos.md             # → /macos
│       ├── windows.md           # → /windows
│       └── mobile.md            # → /mobile
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout: metadata, global CSS
│   │   ├── page.tsx             # Homepage
│   │   ├── [...slug]/page.tsx   # All other pages
│   │   └── globals.css          # CSS tokens + resets
│   ├── components/
│   │   ├── motion/
│   │   │   ├── Reveal.tsx           # Viewport fade-in (standard pages)
│   │   │   ├── PresentationSlide.tsx # Sticky-stage section
│   │   │   └── SlideContext.tsx     # Context: scrollYProgress for slide mode
│   │   ├── layouts/
│   │   │   ├── PageLayoutFactory.tsx
│   │   │   ├── StandardLayout.tsx
│   │   │   ├── StandardLayout.module.css
│   │   │   ├── PresentationLayout.tsx
│   │   │   ├── PresentationLayout.module.css
│   │   │   └── ProgressBar.tsx          # Fixed scroll-progress bar for presentation pages
│   │   ├── markdown/
│   │   │   └── MarkdownRenderer.tsx  # Renders markdown string to React
│   │   └── ui/
│   │       └── ContextualLink.tsx    # Internal Next/Link vs external <a>
│   └── lib/
│       ├── content/
│       │   ├── schema.ts        # Zod frontmatter schema
│       │   └── repository.ts    # File loader + validation
│       └── site-config.ts       # basePath-aware URL helper
├── public/images/               # Static image assets
├── tests/
│   ├── unit/                    # Vitest
│   └── browser/                 # Playwright
│       └── routes.spec.ts       # Smoke tests for homepage and OS routes
├── .github/workflows/deploy.yml
├── next.config.ts
├── tsconfig.json              # sets "@/*": ["./src/*"]
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.mjs
└── package.json
```

## Data flow

```
content/*.md
    → ContentRepository (gray-matter + Zod)
        → PageData { slug, frontmatter, content }
            → PageLayoutFactory (picks layout by frontmatter.layout)
                → StandardLayout   → MarkdownRenderer → Reveal wraps each block
                → PresentationLayout → splitSlides → PresentationSlide × N → MarkdownRenderer
```

## Key rules

- All imports use `@/` alias (`tsconfig.json`: `"@/*": ["./src/*"]`).
- `output: "export"` is set in `next.config.ts`. No server-side features.
- `NEXT_PUBLIC_BASE_PATH` is set by CI for GitHub Pages subpath deploys. Empty string in local dev.

## package.json

Full file. Run `npm install` after creating it.

```json
{
  "name": "scrolly-os",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev":        "next dev",
    "build":      "next build",
    "start":      "next start",
    "lint":       "eslint src",
    "test":       "vitest run",
    "test:watch": "vitest",
    "test:e2e":   "playwright test"
  },
  "dependencies": {
    "framer-motion": "^12.0.0",
    "gray-matter": "^4.0.3",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0",
    "jsdom": "^25.0.0",
    "serve": "^14.0.0",
    "typescript": "^5.0.0",
    "vitest": "^4.0.0"
  }
}
```

> Exit check after every implementation session: `npm run lint && npm run test && npm run build`

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> Note: these two changes were made automatically by Next.js 16 during the first build and are now part of the working project baseline.

## next-env.d.ts

Generated by Next.js. Current file:

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

## vitest.config.ts

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

## playwright.config.ts

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  webServer: {
    command: "npm run build && npx serve out -l 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
});
```

## src/app/layout.tsx

Root layout. Applies global CSS and sets default metadata.

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OS Stories",
  description: "The story of operating systems, told through scroll.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## src/app/globals.css

CSS custom properties used across all components. Define them here and nowhere else.

```css
:root {
  --font-sans: "Avenir Next", "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", "Consolas", monospace;
  --color-bg: #f4efe6;
  --color-surface: rgba(255, 252, 247, 0.84);
  --color-text: #1f1b17;
  --color-accent: #d76a2f;
  --color-muted: #73665b;
  --color-line: rgba(31, 27, 23, 0.14);
  --shadow-soft: 0 24px 60px rgba(64, 42, 24, 0.12);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  min-height: 100%;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  background:
    radial-gradient(circle at top, rgba(215, 106, 47, 0.12), transparent 30%),
    linear-gradient(180deg, #fbf6ef 0%, var(--color-bg) 45%, #efe7da 100%);
  color: var(--color-text);
  line-height: 1.6;
}

a {
  color: inherit;
  text-decoration-color: rgba(215, 106, 47, 0.5);
  text-underline-offset: 0.15em;
}

img {
  max-width: 100%;
  display: block;
}

::selection {
  background: rgba(215, 106, 47, 0.2);
}
```

## next.config.ts

See **spec 05** for the full `next.config.ts` content. It sets `output: "export"` and the `basePath` for GitHub Pages.

## eslint.config.mjs

Required for `npm run lint`. ESLint 9 uses flat config — there is no `.eslintrc`.

```js
import nextVitals from "eslint-config-next/core-web-vitals";

export default [...nextVitals];
```

`@eslint/eslintrc` remains in `devDependencies` from the initial scaffold, but the active config no longer depends on `FlatCompat`.

It is still present in `package.json` today:

```json
"@eslint/eslintrc": "^3.0.0"
```
