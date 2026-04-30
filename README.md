# scrollyTelling_example

Static Next.js scrollytelling site about operating systems, built for GitHub Pages export.

## Local development

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Deployment

The site is configured for static export via GitHub Pages.

- `next.config.ts` enables `output: "export"`
- `.github/workflows/deploy.yml` builds and deploys on pushes to `main`
- `NEXT_PUBLIC_BASE_PATH` is set in CI to `/<repo-name>`

One-time GitHub setup:

1. Push the repository to GitHub.
2. In repository settings, open Pages.
3. Set Source to `GitHub Actions`.
4. Push to `main` to trigger deployment.