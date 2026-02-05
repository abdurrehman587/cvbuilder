# Production deployment

## What’s configured for production

- **Console stripping** – `console.log` / `warn` / `info` / `debug` are removed in production builds (Craco + Terser `drop_console`).
- **Environment** – Use `.env` (or Vercel/host env vars). Copy `.env.example` to `.env` and set:
  - `REACT_APP_SUPABASE_URL`
  - `REACT_APP_SUPABASE_ANON_KEY`
  - `REACT_APP_SITE_URL` (e.g. `https://getglory.pk`)
- **Secrets** – `.env` is in `.gitignore`; do not commit it.
- **Security headers** (Vercel) – `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` are set in `vercel.json`.

## Build and deploy

```bash
npm install
npm run build
```

- **Vercel** – Connect the repo; set env vars in the dashboard; deploy. Build command: `npm run build`.
- **Other hosts** – Serve the `build/` folder as a static site and use the same env vars.

If `npm run build` fails with `spawn EPERM` on Windows, run it in WSL, in CI (e.g. Vercel), or from a different terminal. It’s often an environment/permission issue, not the app code.

## Pre-deploy checklist

- [ ] Set production env vars (Supabase URL, anon key, site URL).
- [ ] Run `npm run build` successfully.
- [ ] Test production build locally: `npx serve -s build` then open the URL.
- [ ] Confirm OAuth redirect URL in Supabase matches `REACT_APP_SITE_URL` (e.g. `https://getglory.pk/oauth-callback`).
