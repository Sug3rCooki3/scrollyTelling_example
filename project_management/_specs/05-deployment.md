# 05 — Deployment

## Target

GitHub Pages static export. Next still generates `out/`, but the build pipeline syncs the publishable output into `docs/` for GitHub Pages deployment.

## Implementation status

Status as of 2026-04-30 after implementing **spec 05**:

- Implemented: `next.config.ts`, `site-config.ts`, GitHub Pages workflow, and README deployment instructions are all in place.
- Verified locally: `npm run build` passes with an empty base path and also with `NEXT_PUBLIC_BASE_PATH=/scrollyTelling_example`, and it now produces a publishable `docs/` folder.
- Content-driven assets in `StandardLayout` and `PresentationLayout` now run through the shared `url()` helper so exported image and background-image URLs resolve under a GitHub Pages project-site subpath.
- Remaining QA gap: there is no automated test that inspects the exported `docs/` files for base-path-prefixed assets; that check is currently manual.

## Notable implementation details

- `ContextualLink` is not the only consumer of `url()` anymore; layout components also use it for `heroImage`, split-slide images, and background-slide image URLs.
- The workflow intentionally runs `lint`, `test`, and `build` before publishing the `docs/` Pages artifact.
- The top-level `README.md` now includes both local development commands and GitHub Pages setup steps.
- The build pipeline now copies the export from `out/` to `docs/`, which supports either GitHub Actions deployment or branch-based `/docs` publishing.

## next.config.ts

```ts
import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

`basePath` is empty in local dev. In CI it is set to `/<repo-name>` for GitHub Pages project sites.

## site-config.ts

```ts
// src/lib/site-config.ts
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function url(pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${basePath}${clean}`;
}
```

Use `url("/linux")` anywhere you build an internal href manually. `<ContextualLink>` uses this automatically.

Current deployment-sensitive call sites also use `url()` for asset paths:

- `src/components/layouts/StandardLayout.tsx` for `frontmatter.heroImage`
- `src/components/layouts/PresentationLayout.tsx` for `bg`, `split`, and `split-reverse` image URLs

## GitHub Actions workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
        env:
          NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Local commands

```bash
npm install
npm run dev         # http://localhost:3000 — no basePath
npm run build       # produces out/ and syncs docs/
npm run lint
npm run test        # vitest unit tests
npm run test:e2e    # playwright (builds first)
```

## GitHub Pages setup (one-time)

1. Push the repo to GitHub.
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`. The workflow deploys automatically.
4. Live URL: `https://<user>.github.io/<repo-name>/`

Alternative: Settings → Pages → Deploy from a branch → `main` / `docs` if you want to publish committed static output instead of the GitHub Actions artifact.
