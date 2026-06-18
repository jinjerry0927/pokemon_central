# Cloudflare Pages Setup

## Deployment Target

- Platform: Cloudflare Pages
- Repository: `jinjerry0927/pokemon_central`
- Production branch: `main`
- Domain policy: use the default `*.pages.dev` domain for MVP
- Custom domain: defer until after MVP launch

## Build Settings

Use these values when creating the Pages project from the Cloudflare dashboard:

```text
Framework preset: Next.js (Static HTML Export)
Root directory: /
Build command: npm run build
Build output directory: out
Production branch: main
```

The app is configured for static export in `next.config.ts`, so `npm run build`
generates the deployable site in `out/`.

## First Deploy Checklist

1. Open Cloudflare dashboard.
2. Go to Workers & Pages.
3. Select Create application > Pages > Connect to Git.
4. Authorize GitHub and select `jinjerry0927/pokemon_central`.
5. Set the production branch to `main`.
6. Apply the build settings above.
7. Save and deploy.
8. Confirm the build log exits successfully.
9. Open the generated `*.pages.dev` URL and verify the home page loads.

## Local Preflight

Run this before pushing a deploy-triggering commit:

```powershell
npm run lint
npm run build
```

## Phase D Status

Local deployment configuration is ready. Phase D is complete only after the
Cloudflare Pages project is connected and the generated deployment URL is
verified in a browser.
