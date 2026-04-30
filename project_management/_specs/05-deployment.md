# 05 — Deployment

## Target

GitHub Pages static export. The site builds to `out/` and deploys via GitHub Actions on every push to `main`.

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
          path: out/

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
npm run build       # produces out/
npm run lint
npm run test        # vitest unit tests
npm run test:e2e    # playwright (builds first)
```

## GitHub Pages setup (one-time)

1. Push the repo to GitHub.
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main`. The workflow deploys automatically.
4. Live URL: `https://<user>.github.io/<repo-name>/`
