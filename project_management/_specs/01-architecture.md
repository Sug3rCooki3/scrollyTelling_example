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
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
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
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;
  --color-bg: #ffffff;
  --color-text: #111111;
  --color-accent: #0070f3;   /* used by ProgressBar */
  --color-muted: #666666;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body { height: 100%; }

body {
  font-family: var(--font-sans);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}
```

## next.config.ts

See **spec 05** for the full `next.config.ts` content. It sets `output: "export"` and the `basePath` for GitHub Pages.

## eslint.config.mjs

Required for `npm run lint`. ESLint 9 uses flat config — there is no `.eslintrc`.

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals"),
];
```

Add `@eslint/eslintrc` to `devDependencies`:

```json
"@eslint/eslintrc": "^3.0.0"
```
