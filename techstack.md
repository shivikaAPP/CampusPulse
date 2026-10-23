# CampusPlus techstack.md

Defines every technology choice, the rules for using it, the SEO and hosting setup, and the performance budget.
Read with `design.md` and `architecture.md`.

---

## 1. Decisions at a glance

| Layer | Choice | Why | Not used |
|---|---|---|---|
| Language | TypeScript, `strict: true` | Shared types between frontend and backend remove a whole class of mistakes | Plain JavaScript (the blueprint allows it, but types are safer when two different AI agents write the two halves) |
| Frontend framework | React (current stable) with Vite | Matches the blueprint, fast builds, good code splitting | Next.js (more moving parts than the MVP needs) |
| Routing | React Router with lazy routes | Per route chunks keep the first load small | Hash routing (bad for SEO and sharing) |
| Styling | Plain CSS with CSS custom properties and CSS Modules | Zero runtime, tiny output, tokens in one file | Tailwind, CSS in JS (extra build config and runtime) |
| Icons | `lucide-react`, named imports only | Matches the blueprint, tree shakeable | Icon fonts, emoji, full icon packs |
| Font | `@fontsource-variable/inter`, latin subset, self hosted | No third party font request, one small file | Google Fonts link |
| State | React context plus `useReducer`, a small `useLocalStorage` hook | No library needed for this scope | Redux, Zustand, React Query for the MVP |
| Dates | Native `Intl.DateTimeFormat` and `Date` helpers in `shared/` | No library in the bundle | moment, dayjs, date-fns for the MVP |
| Persistence (student data) | Browser `localStorage`, versioned keys | Blueprint requirement, no accounts | IndexedDB, server accounts |
| Backend runtime | Node.js (current LTS) | One language across the stack | |
| Backend framework | Fastify | Fast, schema friendly, good plugin set | Express (fewer built in safeguards) |
| Validation | Zod on the backend, shared schemas in `packages/shared` | One schema per payload | Hand written checks |
| Database | SQLite through `better-sqlite3` and Drizzle ORM | Zero setup for the MVP, single file | Postgres for the first release (listed as the upgrade path) |
| Admin auth | Single admin password hash, signed httpOnly cookie | No user accounts needed | OAuth, JWT in localStorage |
| Frontend hosting | Any static host with `_redirects` and `_headers` support (Cloudflare Pages or Netlify). Vercel needs a `vercel.json` instead | Static files, free custom domains with HTTPS on most hosts | |
| Backend hosting | A Node host with a persistent disk for the SQLite file (Render, Railway or Fly.io) | SQLite needs a disk that survives deploys | Serverless functions with SQLite |
| Monorepo | npm workspaces: `apps/web`, `apps/api`, `packages/shared` | One install, shared types | Separate repos |

Version rule: install the current stable version of each package at project start, commit the lockfile, and never copy version numbers from documents (including this one). Check that the major versions of `vite`, `@vitejs/plugin-react`, `react`, `react-router-dom` and `typescript` are compatible with each other by running a build before writing features.

---

## 2. Packages

### apps/web (allowed)
`react`, `react-dom`, `react-router-dom`, `lucide-react`, `@fontsource-variable/inter`.
Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `eslint` with `typescript-eslint` and `eslint-plugin-jsx-a11y`, `prettier`, `rollup-plugin-visualizer`, `size-limit` with `@size-limit/file`, `@playwright/test` (one smoke test of the student journey).

### apps/web (forbidden without written approval)
Any UI kit (MUI, Chakra, Ant), animation libraries (framer-motion, GSAP, AOS, lottie), carousel libraries, charting libraries, lodash, moment, axios (use `fetch`), `react-helmet` (React has native document metadata, see section 5), cursor effect packages, and any package over 20 kB gzipped that has not been checked in the visualizer.

### apps/api
`fastify`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/cookie`, `zod`, `drizzle-orm`, `better-sqlite3`, an argon2id or bcrypt library for the admin password hash, `pino` (comes with Fastify).
Dev: `typescript`, `tsx`, `drizzle-kit`, `vitest`, `eslint`, `prettier`.

### packages/shared
Types, controlled vocabularies (skills, topics, categories), the match score function, the eligibility function and the deadline helpers. No runtime dependencies except `zod` for payload schemas. Both apps import from here, so the score the student sees and the score tests check come from the same code.

---

## 3. Environment variables

| Variable | App | Example | Notes |
|---|---|---|---|
| `VITE_SITE_URL` | web | `https://YOUR_DOMAIN` | Used for canonical links, sitemap and Open Graph. Build fails if it still contains `YOUR_DOMAIN` in production mode |
| `VITE_DATA_SOURCE` | web | `local` or `api` | `local` reads bundled JSON, `api` calls the backend |
| `VITE_API_URL` | web | `https://api.YOUR_DOMAIN` | Only used when `VITE_DATA_SOURCE=api` |
| `VITE_CONTACT_EMAIL` | web | set by owners | Shown on legal pages and used for the mailto report fallback |
| `PORT` | api | `8787` | |
| `DATABASE_PATH` | api | `/data/campusplus.sqlite` | Must be on the persistent disk |
| `ALLOWED_ORIGINS` | api | `https://YOUR_DOMAIN,https://www.YOUR_DOMAIN` | Exact origins only, no wildcard |
| `ADMIN_PASSWORD_HASH` | api | output of the hash script | Never the plain password |
| `SESSION_SECRET` | api | 32 or more random bytes | |
| `NODE_ENV` | api | `production` | |

Commit `.env.example` with empty or placeholder values. Never commit real secrets. Add `.env*` (except `.env.example`) to `.gitignore`.

---

## 4. Bundle size: rules and budgets

Budgets (gzip, checked by `size-limit` in CI):

| Item | Budget |
|---|---|
| Initial JavaScript (entry plus the React vendor chunk) | 150 kB |
| Each lazy route chunk | 50 kB |
| Total CSS | 30 kB |
| Inter font file (latin) | one file, preloaded |
| Largest Contentful Paint (mobile, throttled) | 2.5 s or less |
| Cumulative Layout Shift | 0.1 or less |
| Lighthouse Performance, Accessibility, Best Practices, SEO | 90 or more each |

Treat the numbers as starting targets. Run the first real build, record the actual sizes in the README, then set the `size-limit` values to slightly above that baseline and never raise them without a reason in the PR.

Rules:
1. Lazy load every route with `React.lazy` and `Suspense`: Explore, Detail, Saved, Applications, Profile, Submit, Terms, Privacy, Admin, NotFound. Only the Home route and the shell are in the entry chunk.
2. The Admin route and everything it imports must live in their own chunk and must never be imported by public code.
3. Import icons one by one by name. Never `import * as Icons`.
4. No heavy dependencies (section 2). Use the visualizer to check any new package before adding it.
5. Bundled opportunity data (`listings.json`) is loaded with a dynamic `import()` by the repository, not statically in the entry file.
6. Do not use `React.StrictMode`-only tricks or dev libraries in production code. Remove `console.log` calls (`lint` rule `no-console`).
7. Build target `es2022`. No polyfill bundles.
8. Disable source maps in the production deploy, or upload them privately.
9. Fonts: latin subset, one weight axis file, `font-display: swap`.
10. No images in the first release (see design.md), so no image weight.

`apps/web/vite.config.ts` baseline (verify it builds before adding features):

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' && visualizer({ filename: 'stats.html', gzipSize: true }),
  ].filter(Boolean),
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
              return 'react';
            }
          }
        },
      },
    },
  },
}));
```

`size-limit` section for the root `package.json` (confirm the file names after the first build, since the hashed names come from Vite):

```json
{
  "size-limit": [
    { "name": "entry", "path": "apps/web/dist/assets/index-*.js", "limit": "150 kB", "gzip": true },
    { "name": "css", "path": "apps/web/dist/assets/*.css", "limit": "30 kB", "gzip": true }
  ]
}
```

Scripts in the root `package.json`:

```json
{
  "scripts": {
    "dev:web": "npm run dev -w apps/web",
    "dev:api": "npm run dev -w apps/api",
    "build": "npm run build -w packages/shared && npm run build -w apps/web && npm run build -w apps/api",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present && npm run lint:copy",
    "lint:copy": "node scripts/lint-copy.mjs",
    "analyze": "npm run build -w apps/web -- --mode analyze",
    "size": "size-limit"
  }
}
```

---

## 5. SEO and metadata implementation

### Per page metadata
React supports rendering `<title>`, `<meta>` and `<link>` inside components and places them in the document head. Create one `Seo` component and use it on every route:

```tsx
type SeoProps = {
  title: string;
  description: string;
  path: string;          // for example "/explore"
  noindex?: boolean;
};

export function Seo({ title, description, path, noindex }: SeoProps) {
  const base = import.meta.env.VITE_SITE_URL;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${base}${path}`} />
      {noindex && <meta name="robots" content="noindex" />}
    </>
  );
}
```

Rules:
- Titles, descriptions and H1 text come from the table in design.md section 9. Store them in one file, `apps/web/src/seo/pages.ts`, so a test can check uniqueness.
- A unit test asserts that all titles are unique, all descriptions are unique and between 110 and 160 characters, and that every route has exactly one H1.
- Search engines render JavaScript, but social previews do not, so Open Graph tags stay in `index.html` (see design.md section 8).
- Optional later improvement: prerender public routes at build time. Not part of the MVP.

### Static files in `apps/web/public/`

`robots.txt`:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://YOUR_DOMAIN/sitemap.xml
```

`sitemap.xml` lists only indexable public routes: `/`, `/explore`, `/submit`, `/terms`, `/privacy`, plus real (non demo, non expired) listing URLs once real data exists. Generate it in a build script from `VITE_SITE_URL`, with `lastmod` set to the build date. Do not list `noindex` pages.

A script `scripts/check-dist.mjs` runs after the build and fails if any of these is true:
- `dist/robots.txt`, `dist/sitemap.xml`, `dist/favicon.svg`, `dist/favicon.ico`, `dist/apple-touch-icon.png`, `dist/manifest.webmanifest` or `dist/og-image.png` is missing.
- Any file in `dist/` contains the text `YOUR_DOMAIN`.
- `dist/index.html` has no `<meta name="description"`.

Robots.txt is a request to crawlers, not security. `/admin` is protected by authentication on the API, not by robots.txt.

### Host files

`apps/web/public/_redirects` (Netlify and Cloudflare Pages):

```
/*    /index.html   200
```

`apps/web/public/_headers` (replace `YOUR_DOMAIN` through the build step, never ship the literal text):

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.YOUR_DOMAIN; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

If the dev build needs inline styles or scripts, relax the CSP only in the dev server, never in production. Test the production build with the CSP active and fix any violation instead of loosening the policy.

HSTS (`Strict-Transport-Security`) is added only after HTTPS works on the final domain and every subdomain.

---

## 6. Custom domain

Owners decide and buy the domain. Availability and price are not checked here.

Steps:
1. Buy the domain from a registrar. Use the apex (`YOUR_DOMAIN`) for the site and a subdomain (`api.YOUR_DOMAIN`) for the backend. Keeping both on the same registrable domain lets the admin cookie be sent as a same site cookie.
2. In the frontend host, add `YOUR_DOMAIN` and `www.YOUR_DOMAIN` as custom domains. Follow the host's DNS instructions (an ALIAS, ANAME or CNAME flattening record for the apex, a CNAME for `www`).
3. Redirect `www` to the apex (or the reverse) with a single permanent redirect so there is one canonical host.
4. In the backend host, add `api.YOUR_DOMAIN` and create the CNAME record the host gives you.
5. Wait for HTTPS certificates to be issued on both. Confirm both load over HTTPS.
6. Set `VITE_SITE_URL=https://YOUR_DOMAIN`, `VITE_API_URL=https://api.YOUR_DOMAIN` and `ALLOWED_ORIGINS` to the exact site origins. Rebuild and redeploy.
7. Replace `YOUR_DOMAIN` in `robots.txt`, the CSP and the sitemap through the build step. `check-dist.mjs` confirms nothing is left.
8. Submit the sitemap in Google Search Console and verify the domain there.
9. After everything works, enable HSTS.

Before the domain exists, deploy on the host's default address, keep `VITE_SITE_URL` set to that address, and mark the whole site `noindex` through a host header (`X-Robots-Tag: noindex`) so a temporary address does not get indexed. Remove that header when the real domain goes live.

---

## 7. Copy and design lint (`scripts/lint-copy.mjs`)

Runs in `npm run lint` and in CI. It scans the web app source and public files and exits with an error if a banned item is found.

```js
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const roots = ['apps/web/src', 'apps/web/index.html', 'apps/web/public'];
const exts = new Set(['.ts', '.tsx', '.css', '.html', '.json', '.md', '.txt', '.xml', '.svg', '.webmanifest']);
const skipDirs = new Set(['node_modules', 'dist', '.git']);

const rules = [
  { name: 'em-dash', re: /\u2014/, message: 'Em dashes are banned. Use a period, comma, colon or parentheses.' },
  { name: 'emoji', re: /[\p{Emoji_Presentation}\uFE0F]/u, message: 'Emoji are banned. Use Lucide icons.' },
  { name: 'gradient', re: /gradient\s*\(/i, message: 'Gradients are banned. Use solid colors.' },
  { name: 'pill-radius', re: /border-radius\s*:\s*(\d{3,}px|100%)|rounded-full/i, message: 'Pill shapes are banned. Use the 6px radius token.' },
  { name: 'custom-cursor', re: /cursor\s*:\s*url\(|addEventListener\(\s*['"]mousemove['"]/i, message: 'Cursor effects are banned.' },
  { name: 'scroll-animation', re: /IntersectionObserver|animation-timeline/, message: 'Scroll triggered animation is banned.' },
  { name: 'ai-credit', re: /made with|generated by|powered by ai|ai[- ]generated/i, message: 'No builder or AI credit lines.' },
  { name: 'testimonial', re: /testimonial/i, message: 'No reviews or testimonials.' },
  { name: 'fake-metric', re: /\b\d[\d,]*\+?\s*(students|users|events|listings|colleges|members)\b/i, message: 'Counts must be computed from data, not typed in copy.' },
  { name: 'lorem', re: /lorem ipsum/i, message: 'No placeholder text.' },
  {
    name: 'banned-word',
    re: /\b(seamless(ly)?|unlock|elevate|supercharge|empower(s|ing)?|revolutioni[sz]e|cutting-edge|game-changing|leverage|delve|journey|tapestry|ecosystem|next-generation|unleash)\b/i,
    message: 'Banned marketing word. Rewrite in plain language.',
  },
];

function* walk(path) {
  const stats = statSync(path);
  if (stats.isFile()) {
    yield path;
    return;
  }
  for (const entry of readdirSync(path)) {
    if (skipDirs.has(entry)) continue;
    yield* walk(join(path, entry));
  }
}

let failures = 0;
for (const root of roots) {
  let files;
  try {
    files = [...walk(root)];
  } catch {
    continue;
  }
  for (const file of files) {
    if (!exts.has(extname(file))) continue;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (rule.re.test(line)) {
          console.error(`${file}:${index + 1} [${rule.name}] ${rule.message}`);
          failures += 1;
        }
      }
    });
  }
}

if (failures > 0) {
  console.error(`\nlint:copy found ${failures} problem(s).`);
  process.exit(1);
}
console.log('lint:copy passed.');
```

The script is a safety net, not a replacement for review. It cannot judge vague copy, fake numbers written as words, or AI generated images.

---

## 8. Testing tools

- `packages/shared`: Vitest unit tests for match score, eligibility, deadline status, vocabulary integrity, with hand calculated expected values.
- `apps/web`: Vitest and Testing Library for filters, search, bookmarks, status changes, checklist persistence, profile form, SEO uniqueness test. One Playwright test of the full journey: set profile, filter free only, open a listing, save it, mark as applied, reload, confirm persistence.
- `apps/api`: Vitest using Fastify's `inject` against a temporary SQLite file: validation errors, rate limit, CORS rejection, admin login, report and submission flow.
- Lighthouse run against the production build on mobile settings before every release.
- Manual keyboard and screen size pass from design.md section 14.

---

## 9. Deployment pipeline

1. CI on every push: install, `lint`, `test`, `build`, `check-dist`, `size`.
2. Frontend: build `apps/web`, publish `apps/web/dist` to the static host.
3. Backend: build `apps/api`, run with `node dist/server.js` on the Node host with `DATABASE_PATH` on the persistent disk, run migrations at startup or as a release command, health check at `GET /api/v1/health`.
4. Backups: copy the SQLite file on a schedule (host snapshot or a cron job to object storage). Test a restore once.
5. Upgrade path: if traffic or write volume grows, move to Postgres by switching the Drizzle driver and schema dialect. Keep all queries inside `apps/api/src/db/` so this is a contained change.
