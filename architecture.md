# CampusPlus architecture.md

How the system is structured, the data model, the exact scoring rules, the API contract, the build plan and the instructions for the two AI agents.
Read with `design.md` (look, copy, pages) and `techstack.md` (tools, budgets, SEO files, domain).

---

## 1. Overview

```
Student browser
  React app (apps/web)
    pages, filters, match score, eligibility, checklist, bookmarks
    localStorage: profile, saved, applications, checklists   (never leaves the device)
        |
        |  Repository interface
        |    LocalRepository: bundled listings.json   (phase 1)
        |    HttpRepository:  fetch from the API      (phase 2)
        v
API (apps/api, Fastify)  ->  SQLite (Drizzle)
  public:  listings, reports, submissions, health
  admin:   moderation (cookie session)

packages/shared: types, vocabularies, zod schemas, match score, eligibility, deadline helpers
```

Key decisions:
1. The frontend works fully on its own with bundled data (phase 1). The backend is added later behind the same Repository interface, so the frontend never needs rewriting.
2. The student profile never goes to the server. Match scores and eligibility are computed in the browser from the profile and the listing. This keeps the privacy policy short and honest.
3. Expired is derived from the deadline at read time. It is never a stored value.
4. The shared package is the single source of truth for scoring so the UI and the tests cannot disagree.

---

## 2. Repository layout

```
campusplus/
  package.json                  npm workspaces, scripts from techstack.md
  .env.example
  scripts/
    lint-copy.mjs
    check-dist.mjs
    generate-sitemap.mjs
  design.md  techstack.md  architecture.md
  packages/shared/src/
    types.ts                    Opportunity, Profile, enums
    vocab.ts                    skills, topics, categories with display labels
    schemas.ts                  zod schemas for API payloads
    deadline.ts                 status helpers (IST aware)
    score.ts                    match score
    eligibility.ts              eligibility checker
    shortlist.ts                daily shortlist
  apps/web/
    index.html
    public/                     robots.txt, sitemap.xml (generated), icons, manifest, _redirects, _headers
    src/
      main.tsx  App.tsx  routes.tsx
      seo/Seo.tsx  seo/pages.ts
      data/Repository.ts  data/LocalRepository.ts  data/HttpRepository.ts  data/listings.demo.json  data/listings.real.json
      state/ProfileContext.tsx  state/useLocalStorage.ts  state/saved.ts  state/applications.ts  state/checklists.ts
      components/               Header, Footer, OpportunityCard, MatchScore, Badges, FilterBar, Checklist, EligibilityPanel, ReportDialog, EmptyState
      pages/                    Home, Explore, Detail, Saved, Applications, Profile, Submit, Terms, Privacy, Admin, NotFound
      styles/                   tokens.css, base.css, *.module.css
  apps/api/src/
    server.ts  app.ts  config.ts
    db/                         schema.ts, client.ts, migrations, queries
    routes/                     listings.ts, reports.ts, submissions.ts, admin.ts, health.ts
    plugins/                    security.ts, rateLimit.ts, auth.ts
    seed/                       seed.ts
```

---

## 3. Data model (`packages/shared/src/types.ts`)

Changes from the blueprint: `fee` is a number, `topics` and structured `eligibility` are added so the score and checker can run on real fields, `applicationUrl` and `sourceUrl` can be null, and `createdAt` is added for "Recently added". Verification stored values are only three. Expired is derived.

```ts
export type Category = 'hackathon' | 'internship' | 'workshop' | 'competition' | 'meetup';
export type Mode = 'online' | 'offline' | 'hybrid';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Verification = 'verified' | 'community' | 'unverified';
export type TravelInfo = 'required' | 'not_required' | 'unknown';

export interface Eligibility {
  minYear: number | null;            // year of study, 1 to 5
  maxYear: number | null;
  allowedColleges: string[] | null;  // null means open to all colleges
  manualChecks: string[];            // requirements the app cannot compare, shown as "Confirm on the official page"
}

export interface Opportunity {
  id: string;
  title: string;
  category: Category;
  organizer: string;
  description: string;
  benefits: string[];
  fee: number;                       // INR whole rupees, 0 means free
  additionalCostsNote: string | null;
  travelInfo: TravelInfo;
  mode: Mode;
  city: string | null;               // null for online
  skills: string[];                  // slugs from vocab.ts, skills the listing needs or uses
  topics: string[];                  // slugs from vocab.ts
  level: Level;
  eligibility: Eligibility;
  deadline: string;                  // ISO 8601 with offset, for example 2026-11-20T23:59:00+05:30
  eventDate: string | null;          // YYYY-MM-DD
  applicationUrl: string | null;     // official link supplied by the source, never invented
  sourceUrl: string | null;
  verification: Verification;
  lastCheckedAt: string | null;      // ISO 8601
  isDemo: boolean;
  createdAt: string;                 // ISO 8601
}

export interface Profile {
  displayName: string;
  college: string;
  city: string;
  year: number | null;               // 1 to 5
  skills: string[];
  interests: string[];               // topic slugs
  level: Level | null;
  preferredMode: 'online' | 'offline' | 'any' | null;
  maxBudget: number | null;          // INR, 0 means free only, null means not set
}
```

Validation rules (enforced in the zod schema and in a data test over every JSON record):
- `id` is unique and URL safe (lowercase letters, digits, hyphens).
- `isDemo === true` implies `verification !== 'verified'`, `applicationUrl === null`, `sourceUrl === null`, `lastCheckedAt === null`.
- `verification === 'verified'` requires a non null `sourceUrl` and `lastCheckedAt`.
- `mode === 'online'` implies `city === null`. `mode` of `offline` or `hybrid` requires a city.
- `deadline` parses as a valid date and has an offset. `eventDate`, when set, is on or after the deadline date.
- Every slug in `skills` and `topics` exists in `vocab.ts`.
- URLs, when present, start with `https://`.
- `fee` is an integer of 0 or more.

Vocabulary (`vocab.ts`), initial lists. Slugs are lowercase and hyphenated, each with a display label:
- Skills: `python`, `java`, `javascript`, `html-css`, `react`, `web-development`, `ai-ml`, `data-analysis`, `sql`, `git`, `cloud`, `cybersecurity`.
- Topics: `ai-ml`, `web-development`, `cybersecurity`, `cloud`, `data-science`, `open-source`, `product`.

The blueprint filter list (Python, Java, Web Development, AI/ML, Cybersecurity) maps onto these slugs.

---

## 4. Derived values (`deadline.ts`)

All comparisons use the deadline instant as stored (it carries the IST offset) against the current time.

- `isExpired(opp, now)`: `now > deadline`.
- `daysLeft(opp, now)`: `Math.ceil((deadline - now) / 86400000)` for non expired listings, shown as "Closes in N days", "Closes today" when the deadline is later today, and a date next to it.
- `isClosingSoon(opp, now)`: not expired and deadline within 3 days.
- `inDeadlineRescue(opp, now)`: not expired and deadline within 7 days.
- `displayVerification(opp, now)`: returns `'expired'` if expired, otherwise the stored value.
- Pass `now` as an argument everywhere so tests can fix the time. Never call `Date.now()` inside scoring or filtering functions.
- Format dates for display with `Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ... })`.

Expired listings are excluded from Recommended, Closing soon, Shortlist and the default Explore list. Explore has a "Show expired" toggle (off by default).

---

## 5. Match score (`score.ts`)

Pure function: `computeMatch(profile, opportunity): MatchResult`. No randomness, no network, no AI call.

```ts
export interface FactorResult { factor: 'skills' | 'interests' | 'budget' | 'location' | 'experience'; points: number; max: number; reason: string; neutral: boolean }
export interface MatchResult { total: number; label: 'Strong' | 'Good' | 'Fair' | 'Low'; factors: FactorResult[]; summary: string; estimated: boolean }
```

Maximums: skills 30, interests 25, budget 20, location 15, experience 10. Total is the sum of integer factor points, 0 to 100.

Neutral values are used when the profile lacks the data for that factor. They are fixed: skills 15, interests 12, budget 10, location 8, experience 5. A neutral factor sets `neutral: true` and `estimated` becomes true on the result.

| Factor | Rule |
|---|---|
| Skills (30) | Profile skills empty: neutral 15. Listing skills empty (nothing required): 30. Otherwise `Math.round(30 * overlap / listing.skills.length)` where `overlap` is the count of listing skills the profile has |
| Interests (25) | Profile interests empty: neutral 12. Listing topics empty: neutral 12. Otherwise overlap count of 0 gives 0, 1 gives 18, 2 or more gives 25 |
| Budget (20) | `fee === 0`: 20. `maxBudget === null` and `fee > 0`: neutral 10. `fee <= maxBudget`: 20. `fee > maxBudget`: 0 |
| Location and mode (15) | Profile mode and city both missing: neutral 8. Online listing: 15 if preferred mode is `online` or `any`, else 8. Offline listing in the profile city (case insensitive, trimmed): 15 if preferred is `offline` or `any`, 9 if `online`. Offline listing in another city: 0. Hybrid listing in the profile city: 15. Hybrid in another city: 10 (can join online). Online listings are never reduced because of distance |
| Experience (10) | Profile level missing: neutral 5. With levels mapped beginner 0, intermediate 1, advanced 2 and `diff = listing - profile`: diff 0 gives 10, diff +1 gives 5, diff +2 gives 0, diff -1 gives 7, diff -2 gives 5 |

Labels: 80 to 100 Strong, 60 to 79 Good, 40 to 59 Fair, below 40 Low.

Explanation text is built from templates per factor, not written by a model. Examples: "Matches 2 of 3 skills for this listing", "Free, within your budget", "Held online, so distance does not matter", "Aimed at beginners, one level below your experience". The summary sentence joins the two highest scoring factors, for example: "Strong match because it fits your skills and is free."

Display rules:
- If the profile has no skills and no interests (`profileIsEmpty`), do not show a score. Show the prompt from design.md section 5.
- If `estimated` is true, show "Estimated. Add the missing details in your profile for a more accurate score."
- A score is never an eligibility result. The two are shown in separate blocks.
- Expired listings show no score.

Required tests: one hand calculated fixture per factor and per branch above, one full example (compute the expected total by hand from the table, do not copy the blueprint's 94 example, which was illustrative), a test that two identical calls return identical results, a test that an online listing in another city has the same location points as one in the profile city, and a test that `maxBudget = 0` gives 0 budget points to a paid listing.

---

## 6. Eligibility checker (`eligibility.ts`)

`checkEligibility(profile, opportunity): EligibilityResult` with `status`, `reasons[]` and `needsInfo[]`.

Structured checks:
1. Year: if `minYear` or `maxYear` is set. Profile year missing: add to `needsInfo`. Outside the range: a failed requirement.
2. College: if `allowedColleges` is not null. Profile college empty: `needsInfo`. College not in the list (case insensitive, trimmed): a failed requirement.

Result:
- Any failed requirement: `likely_not_eligible`, with the failed requirement named in `reasons`.
- Else if `needsInfo` is not empty: `possibly_eligible`, listing the missing profile fields.
- Else: `eligible`.

`manualChecks` are always listed under "Confirm on the official page" and never change the status. The status label wording is exact: "Eligible based on provided information", "Possibly eligible, more information needed", "Likely not eligible, a stated requirement is not met". No invented rules. No guarantee wording.

---

## 7. Your shortlist today (`shortlist.ts`)

Deterministic, no randomness:
1. Remove expired listings, listings the student marked Applied, Shortlisted or Completed, and listings with `likely_not_eligible`.
2. Remove paid listings above `maxBudget` when `maxBudget` is set.
3. Sort by match total descending, then by nearest deadline, then by `id`.
4. Take the first 5. If fewer than 3 remain, show what exists and a note ("Fewer than 3 listings fit your profile right now").
5. Each item shows a reason built from the top two factor reasons plus the deadline ("Closes in 2 days").

If the profile is empty, sort by nearest deadline among non expired listings and show a prompt to complete the profile.

---

## 8. Frontend architecture

### Routes (lazy loaded except Home)
`/`, `/explore`, `/opportunities/:id`, `/saved`, `/applications`, `/profile`, `/submit`, `/terms`, `/privacy`, `/admin`, `*`.
Page titles, descriptions and H1 are in design.md section 9.

### Repository interface
```ts
export interface Repository {
  listOpportunities(): Promise<Opportunity[]>;
  getOpportunity(id: string): Promise<Opportunity | null>;
  submitReport(input: ReportInput): Promise<{ ok: true } | { ok: false; message: string }>;
  submitOpportunity(input: SubmissionInput): Promise<{ ok: true } | { ok: false; message: string }>;
}
```
- `LocalRepository` loads `listings.demo.json` and `listings.real.json` through dynamic `import()` and merges them. `submitReport` and `submitOpportunity` are not supported locally: the UI shows "Report by email" using a `mailto:` link to `VITE_CONTACT_EMAIL` with the listing id in the subject, and hides the submit form behind a notice. The UI never claims a report was sent when it was not.
- `HttpRepository` calls the API (section 10) with `fetch`.
- The repository is chosen once from `VITE_DATA_SOURCE`.
- Every page that loads data handles three states: loading, error with a retry button, and empty.

### Local storage (all keys versioned, all reads and writes in try/catch)
| Key | Value |
|---|---|
| `cp.v1.profile` | `Profile` |
| `cp.v1.saved` | `string[]` of opportunity ids |
| `cp.v1.applications` | `Record<id, { status: 'interested' \| 'applied' \| 'shortlisted' \| 'completed'; updatedAt: string }>` |
| `cp.v1.checklists` | `Record<id, string[]>` of completed task ids |

Rules: if a value fails to parse or has the wrong shape, discard it and use the default instead of crashing. If storage is unavailable, keep state in memory and show a small notice "Your data cannot be saved in this browser". Ids that no longer exist in the data are hidden from Saved and Applications, not deleted silently. "Delete my data on this device" clears all `cp.v1.*` keys.

### Search, filters and sort
- Search: case insensitive, split on spaces, every word must match somewhere in title, organizer, city, description, skill labels or topic labels. Debounce 200ms.
- Filters (AND across groups, OR within a group): category, fee (free or paid), mode, level, skills, city, deadline (closing soon is 3 days, this week is 7 days, all upcoming), verified only, show expired.
- Sort: best match (default when the profile is not empty), nearest deadline, recently added.
- State lives in the URL query string so filtered views can be shared and the back button works. Reset filters clears the query string.
- With the dataset size of the MVP, filtering runs in the browser on the full list.

### ActionPath checklist
Templates by category (defined in `apps/web/src/data/checklists.ts`):
- Internship: review the job description, check eligibility, update your resume, prepare requested documents, open the official application page, mark as applied after you apply.
- Hackathon: review theme and rules, check team requirements, list the skills and tools you need, prepare a project idea, complete official registration, track your registration status.
- Workshop: check venue and date, confirm the registration fee, review required materials, plan travel if needed (offline and hybrid only), complete registration, keep the event in your upcoming list.
- Competition and meetup: review rules or agenda, check eligibility, confirm fee and date, complete registration, mark as applied.
Each task has a stable id (`{category}-{slug}`). Tasks are labelled "Suggested". A task derived from `eligibility.manualChecks` is labelled "From the organizer" and shows the original text. Completed ids persist per listing.

### Report listing
Reasons: expired, looks fake, wrong details, broken link, other. Optional note (500 characters maximum) and optional contact email. With `HttpRepository` the report is posted; with `LocalRepository` the mailto fallback is used.

---

## 9. Demo data

Demo data is for the hackathon demonstration. Today is 24 October 2026, so the dates below are set relative to that. If the demo happens much later, shift the dates forward, keeping the same spread so Closing soon, Closing within a week and Expired states still appear.

All demo organizers are fictional and plainly named, such as "Demo Tech Club". No real organizations, real people or real links. All records: `isDemo: true`, `verification: 'unverified'`, `applicationUrl: null`, `sourceUrl: null`, `lastCheckedAt: null`. Descriptions are short, specific and written by a person on the team, not filler. Event dates fall after deadlines. Fill `createdAt` with distinct dates in October 2026 so "Recently added" has an order.

| id | Title | Category | Fee | Mode and city | Level | Skills | Topics | Deadline | Eligibility |
|---|---|---|---|---|---|---|---|---|---|
| demo-001 | Beginner Machine Learning Workshop | workshop | 0 | offline, Greater Noida | beginner | python | ai-ml | 2026-10-26 | none |
| demo-002 | 24 Hour Web Build Hackathon | hackathon | 0 | offline, Noida | intermediate | javascript, html-css, react | web-development | 2026-11-08 | minYear 1 |
| demo-003 | Data Analysis Internship | internship | 0 | online | intermediate | python, sql, data-analysis | data-science | 2026-11-20 | minYear 2, manual check "Resume required" |
| demo-004 | Capture the Flag Contest | competition | 300 | online | intermediate | cybersecurity | cybersecurity | 2026-11-12 | none |
| demo-005 | Open Source Contributors Meetup | meetup | 0 | offline, Delhi | beginner | git | open-source | 2026-10-30 | none |
| demo-006 | Cloud Basics Bootcamp | workshop | 499 | hybrid, Bengaluru | beginner | cloud | cloud | 2026-12-05 | none |
| demo-007 | Applied AI Hackathon | hackathon | 0 | online | advanced | python, ai-ml | ai-ml | 2026-11-25 | minYear 3 |
| demo-008 | Frontend Developer Internship | internship | 0 | offline, Delhi | intermediate | javascript, react, html-css | web-development | 2026-12-10 | minYear 3, maxYear 4 |
| demo-009 | Java Coding Contest | competition | 0 | online | intermediate | java | (none) | 2026-09-30 (expired) | none |
| demo-010 | Robotics Basics Workshop | workshop | 250 | offline, Greater Noida | beginner | (none) | (none) | 2026-10-15 (expired) | none |

All deadlines use the time `23:59:00+05:30`. This spread gives: one closing within 3 days (demo-001), two within 7 days (demo-001, demo-005), both free and paid, all categories and levels, online, offline and hybrid, and two expired records.

Because every demo record is `unverified`, the "Verified only" filter returns nothing until a real record is added. The empty state text in design.md explains this. `listings.real.json` starts as an empty array. A real record is added only after the team opens its official page, confirms the details, copies the real `applicationUrl` and `sourceUrl`, sets `lastCheckedAt` and then sets `verification` to `verified`.

---

## 10. Backend

### API conventions
- Base path `/api/v1`. JSON only. Dates are ISO 8601 strings.
- Error body: `{ "error": { "code": "validation_error", "message": "...", "fields": { "field": "message" } } }`. Status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 429 rate limited, 500 server error with no internal detail in the message.
- Every request body and query is validated with the shared zod schemas. Unknown fields are rejected.
- Responses for public lists send an `ETag` and support `If-None-Match`.

### Endpoints

Public:
| Method and path | Purpose |
|---|---|
| `GET /health` | `{ "status": "ok" }` for the host health check |
| `GET /opportunities` | All non removed listings as `Opportunity[]` (up to 500). The API does not filter or score. The `verification` field returned is the stored value, and the client derives expired |
| `GET /opportunities/:id` | One listing or 404 |
| `POST /reports` | Body `{ opportunityId, reason, details?, contactEmail? }`. Returns 201 `{ "ok": true }`. Unknown `opportunityId` returns 404 |
| `POST /submissions` | Body is the listing fields a student can supply (title, category, organizer, description, fee, mode, city, skills, topics, level, deadline, eventDate, applicationUrl, sourceUrl) plus optional `submitterEmail`. Returns 201 and stores with status `pending` |

Admin (all require a valid session cookie):
| Method and path | Purpose |
|---|---|
| `POST /admin/login` | Body `{ password }`. Compares against `ADMIN_PASSWORD_HASH`. On success sets a signed, httpOnly, secure, SameSite=Strict cookie |
| `POST /admin/logout` | Clears the cookie |
| `GET /admin/opportunities` | Includes removed and drafts |
| `POST /admin/opportunities` | Create a listing |
| `PATCH /admin/opportunities/:id` | Edit fields, change `verification`, set `lastCheckedAt` |
| `DELETE /admin/opportunities/:id` | Soft remove (sets `removedAt`) |
| `GET /admin/reports` | Open reports first |
| `PATCH /admin/reports/:id` | Set status to `reviewed` or `dismissed` |
| `GET /admin/submissions` | Pending first |
| `POST /admin/submissions/:id/approve` | Creates an opportunity with `verification: 'community'`, `isDemo: false`, status becomes `approved` |
| `POST /admin/submissions/:id/reject` | Status becomes `rejected` |

Admin rules: the server refuses to set `verification: 'verified'` unless `sourceUrl` and `lastCheckedAt` are present. Mutating admin requests must send the header `X-Requested-With: campusplus`. Login attempts are rate limited more strictly than other routes.

### Database tables (Drizzle, SQLite)
- `opportunities`: all `Opportunity` fields. Arrays and the eligibility object stored as JSON text and validated on read and write. Plus `updatedAt`, `removedAt` (nullable).
- `reports`: `id`, `opportunityId` (foreign key), `reason`, `details`, `contactEmail` (nullable), `status` (`open`, `reviewed`, `dismissed`), `createdAt`.
- `submissions`: the submitted fields as JSON, `submitterEmail` (nullable), `status` (`pending`, `approved`, `rejected`), `createdAt`, `reviewedAt`.
- No table stores IP addresses or student profiles.

### Security and operations
- `@fastify/helmet` for headers. `@fastify/cors` with an exact origin allowlist from `ALLOWED_ORIGINS` and `credentials: true` only for admin routes.
- `@fastify/rate-limit`: a general limit per IP, tighter limits on `POST /reports`, `POST /submissions` and `POST /admin/login`. Tune the numbers during testing and write the final values in the README.
- Request body size limit of 50 kB.
- A hidden honeypot field on the submission and report forms: if filled, the API returns 201 without storing.
- Reject `applicationUrl` and `sourceUrl` that are not `https://` URLs.
- Logging with `pino`: log method, path, status and timing. Do not log request bodies, emails or the admin password.
- Strings are stored as plain text and rendered by React as text, never as HTML.
- Migrations run through `drizzle-kit`. A seed script loads `listings.demo.json` into the database in development only.
- Graceful shutdown closes the database.

---

## 11. Build plan and agent boundaries

The work is split so each agent has a clear area and the two do not edit the same files.

| Area | Owner |
|---|---|
| `apps/web`, `design.md` compliance | Frontend agent (Gemini 3.8 Flash in Antigravity, as stated by the owner) |
| `apps/api`, database, security, admin | Backend agent (Claude Opus 4.6 in Antigravity, as stated by the owner) |
| `packages/shared`, `scripts/`, the three markdown files | Written first, then changed only by the owner or by one agent at a time with the other agent informed |

Phases:
1. Phase 0, setup: create the monorepo, scripts, `.env.example`, CI, lint config. Write `packages/shared` completely (types, vocab, schemas, deadline, score, eligibility, shortlist) with passing unit tests. Both agents depend on this, so it must be done first and reviewed by the owner.
2. Phase 1, frontend on local data (no backend needed): shell, tokens, header and footer, Home, Explore with filters and URL state, Detail, Profile, Saved, Applications, checklist, Terms, Privacy, 404, SEO component, static files, favicon set. Demo data as in section 9.
3. Phase 2, backend, in parallel with the end of phase 1: schema, public endpoints, reports, submissions, health, security plugins, tests.
4. Phase 3, integration: `HttpRepository`, report and submit forms using the API, CORS and cookie checks on the real domains.
5. Phase 4, admin: login, listings management, reports and submissions review (this is optional, as in the blueprint).
6. Phase 5, hardening: bundle budgets, Lighthouse, accessibility pass, legal text filled in by the owners and reviewed, custom domain, release checklist.

If time is short, the blueprint's priority order still holds: working discovery dashboard, search and free only, calculated match score with explanation, a full save and track demo. Phase 2 to 4 can be skipped for the demo because the frontend runs on local data.

### Instruction block for the frontend agent
```
You are building apps/web for CampusPlus. First read design.md, techstack.md and architecture.md completely.
Rules:
- Work only inside apps/web. Import logic from packages/shared. Do not copy scoring or eligibility code into the web app.
- Follow design.md exactly: tokens, components, copy rules, page titles, descriptions and H1 text. No gradients, no purple, no pill buttons, no emoji, no images, no scroll animations, no cursor effects, no fake counts or reviews, no em dashes, no builder or AI credit line.
- Respect the bundle budgets in techstack.md. Lazy load every route except Home. Import icons by name. Do not add packages that are not listed without asking.
- Never invent URLs, organizers, reviews or statistics. Demo data follows section 9 of architecture.md.
- Use the Repository interface. Phase 1 uses LocalRepository only.
- Persist data only in the local storage keys defined in architecture.md, with try/catch and shape checks.
- After each feature run: npm run lint, npm run test, npm run build. Fix every error before moving on.
- If something is unclear or two rules conflict, stop and ask instead of guessing.
```

### Instruction block for the backend agent
```
You are building apps/api for CampusPlus. First read architecture.md and techstack.md completely, and design.md sections 10 and 11 for what data the privacy policy promises.
Rules:
- Work only inside apps/api. Import types and zod schemas from packages/shared. Do not redefine them.
- Implement exactly the endpoints, error format, tables and security rules in architecture.md section 10. Do not add endpoints that store student profiles or IP addresses.
- Validate every input. Reject unknown fields. Enforce the data validation rules in architecture.md section 3 on every write.
- The server must refuse verification 'verified' without sourceUrl and lastCheckedAt, and must reject non https URLs.
- Keep all database access inside apps/api/src/db so a later move to Postgres is contained.
- Never log request bodies, emails or passwords. Never put secrets in the repository.
- Write Vitest tests with Fastify inject for validation, rate limiting, CORS rejection, admin auth, and the report and submission flows.
- Run npm run lint, npm run test and npm run build in apps/api before finishing a task.
- If a requirement is unclear or conflicts with another file, stop and ask.
```

---

## 12. Release checklist (every item must be verified, not assumed)

| Requirement | How to verify |
|---|---|
| Terms and Conditions page | `/terms` loads, linked in the footer on every page, no placeholders, owners filled the entity name, email and jurisdiction, lawyer reviewed |
| Privacy Policy page | `/privacy` loads, linked in the footer, matches what the build really stores, contact and grievance email filled |
| Site favicon | `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, manifest icons all return 200 and display in the browser tab and on a phone |
| Custom domain | Site and API load over HTTPS on the final domain, `www` redirects to one canonical host, no `YOUR_DOMAIN` text left in `dist` |
| Meta description | Every route has a unique description of 110 to 160 characters (SEO unit test passes) |
| Unique heading per page | Every route has exactly one H1 and no two routes share one (test passes) |
| robots.txt | `/robots.txt` loads, disallows `/admin` and `/api/`, points to the real sitemap |
| sitemap.xml | Loads, lists only indexable public URLs on the real domain |
| Custom 404 | Unknown path and unknown listing id show the 404 page with `noindex` |
| Reduced JS bundle | `npm run size` passes, visualizer reviewed, route chunks confirmed in the build output, Lighthouse scores meet the budget |
| No purple gradient, no gradients | `lint:copy` passes, visual review |
| Hero text is specific | H1 and supporting sentence match design.md section 9 |
| No fake reviews or metrics | No testimonial, rating or typed count in the build, `lint:copy` passes |
| Minimal animation | No scroll animation, only 150ms hover transitions, reduced motion respected |
| No pill buttons | Buttons use the 6px radius token, `lint:copy` passes |
| No emoji icons | Only Lucide SVG icons, `lint:copy` passes |
| No cursor animation | Default cursor only, `lint:copy` passes |
| No AI images | `public/` and `src/assets/` contain only the logo set and Open Graph image built from the logo |
| No em dashes | `lint:copy` passes, also check the legal pages and demo data |
| No "made with AI" tag | Footer reviewed, `lint:copy` passes |
| No AI sounding copy | Banned word check passes, owner reads every page aloud once and rewrites anything that sounds generic |
| Honest data | Every demo record flagged, none verified, no invented URLs, expired states derived from dates |
| Student journey works | Playwright test passes: set profile, free only, open listing, save, mark applied, reload, state persists |
| Mobile | Checked at 360, 768, 1280 px, no horizontal scroll at 360 |
| Accessibility | Keyboard only run of the journey, contrast checked, axe or Lighthouse accessibility 90 or more |
| Security | CSP active in production without violations, CORS limited to the real origins, admin cookie httpOnly and secure, no secrets in git |

Known limits to state openly in the README: social previews use the same Open Graph tags on every URL, unknown URLs return status 200 with a `noindex` 404 page (soft 404), and application statuses are stored only in the student's browser.
