# Vrutta

A professional networking platform (feed, events, 1:1 meetings, power teams, messaging,
admin console) built with Next.js 16 (App Router), a custom Node server for Socket.io,
Prisma + MongoDB, and NextAuth v5.

## Tech stack

| Area          | Choice                                             |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 16 (App Router, React 19)                  |
| Server        | Custom `server.ts` (Next + Socket.io on one HTTP)  |
| Database      | MongoDB via Prisma (`provider = "mongodb"`)        |
| Auth          | NextAuth v5 (Credentials + Google), JWT sessions   |
| Realtime      | Socket.io (`/api/socket/io`)                       |
| Email         | Resend                                             |
| Media         | AWS S3                                             |
| AI assistant  | Google Gemini                                      |
| PWA           | Serwist service worker                             |

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill it in:
   ```bash
   cp .env.example .env.local
   ```
   Only `DATABASE_URL` and an auth secret (`NEXTAUTH_SECRET` or `AUTH_SECRET`) are
   required to boot; every other integration degrades gracefully when unset
   (see `src/lib/env.ts`).
3. Push the Prisma schema to your database and generate the client:
   ```bash
   npm run prisma:push
   npm run prisma:generate
   npm run prisma:seed   # optional: seed categories/reference data
   ```
4. Start the dev server (runs `server.ts` via `tsx`):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Scripts

| Script                   | Purpose                                            |
| ------------------------ | ------------------------------------------------- |
| `npm run dev`            | Dev server (`tsx server.ts`)                       |
| `npm run build`          | `prisma generate && next build`                    |
| `npm start`              | Production server (`NODE_ENV=production tsx server.ts`) |
| `npm run lint`           | ESLint                                             |
| `npm test`               | Vitest                                             |
| `npm run prisma:push`    | Apply `schema.prisma` to the database             |
| `npm run prisma:studio`  | Prisma Studio                                      |

## Deployment (Railway)

The app runs as a **single long-lived Node process** (custom server + Socket.io),
so it must be deployed to a persistent host — not a serverless platform. It is
currently deployed on [Railway](https://railway.app).

Railway (via Nixpacks) auto-detects the Next.js project and runs `npm run build`
then `npm start`. No `Procfile` or `railway.json` is required.

### Environment variables in production

`getEnv()` (called at server startup) **hard-fails the boot** only when
`DATABASE_URL` or an auth secret is missing/invalid. In production it also logs a
loud warning listing any missing "recommended" var (mailer / S3 / app URL) — the
related feature is then degraded but the app still serves. Wrapping quotes on a
pasted `KEY="value"` are stripped automatically.

| Variable                              | Boot | Notes                                          |
| ------------------------------------- | :--: | --------------------------------------------- |
| `DATABASE_URL`                        | hard | MongoDB connection string                           |
| `NEXTAUTH_SECRET` (or `AUTH_SECRET`)  | hard | Session/JWT signing secret                          |
| `NEXT_PUBLIC_APP_URL`                 | warn | Public URL, e.g. `https://vrutta.net` — email/verification links; `RAILWAY_PUBLIC_DOMAIN` covers it if unset |
| `RESEND_API_KEY` / `EMAIL_FROM`       | warn | Transactional email — signup verification won't send without it |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME` | warn | S3 media uploads |
| `AWS_S3_PUBLIC_URL`                   |    | Public base URL for S3 objects (if not the default) |
| `GOOGLE_CLIENT_ID` / `_SECRET`        |    | Google OAuth (feature-degrades if unset)            |
| `GEMINI_API_KEY` / `GEMINI_MODEL`     |    | AI assistant                                        |
| `CRON_SECRET`                         |    | Authorizes scheduled API calls (event reminders)   |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` |  | Error tracking; the SDK stays inert when unset      |

`RAILWAY_PUBLIC_DOMAIN` is injected by Railway automatically and is only used as a
base-URL fallback when `NEXT_PUBLIC_APP_URL` is absent.

### Error tracking (Sentry)

The SDK is wired via `src/instrumentation*.ts` and the two error boundaries, and
is completely inert until `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` are set.

Production stack traces show minified frames unless source maps are uploaded.
That is done out-of-band (the `withSentryConfig` build plugin is deliberately
not used — it inflated the webpack build to ~17 min):

```bash
# after `npm run build`, with SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT set:
npm run sentry:sourcemaps
```

Set `SENTRY_RELEASE` + `NEXT_PUBLIC_SENTRY_RELEASE` (e.g. the git SHA) to the same
value at build time and pass `--release` to the upload so events line up with the
maps. Wire `npm run sentry:sourcemaps` into the Railway deploy as a post-build
step once the token is configured.

### Operational notes

- **Database backups.** Enable automated backups on the MongoDB deployment and
  run at least one test restore. Prisma + MongoDB has no migration history, so a
  backup is the only rollback path for data.
- **Rate limiting is in-process.** `src/lib/rate-limit.ts` keeps counters in
  memory — correct only while the app runs as a single instance. Before scaling
  to multiple Railway replicas, move the store to Redis.
- **CSP is Report-Only.** `next.config.js` sends `Content-Security-Policy-Report-Only`;
  violations appear in the browser console but nothing is blocked. Tighten the
  policy and switch to the enforcing header once reports are clean.

### After a schema change

Prisma + MongoDB does not use migration files. Apply schema changes with
`prisma db push`. The Prisma CLI only reads `.env` (not `.env.local`), so load
the URL explicitly:

```bash
# bash / git-bash
set -a && . <(grep '^DATABASE_URL=' .env.local) && set +a && npx prisma db push
```

Run this against the production database **before** the new build starts serving
traffic. Field additions are additive and safe. Note that `db push` also
(re)creates **every** index the schema declares — the first successful run after
a long gap can add dozens at once.

`db push` aborts if it cannot build a declared unique index — MongoDB rejects a
plain `@unique` index when more than one document is missing that field, so
optional fields that are usually empty (tokens, phone) are intentionally **not**
`@unique`; uniqueness for those lives in application code / token entropy.

### Realtime note

Socket.io shares the HTTP server started by `server.ts`. Railway supports
WebSockets out of the box; the client connects to the same origin at
`/api/socket/io`. Connections are authenticated from the NextAuth session cookie
on the handshake (see `src/lib/socket-io.ts`).

### Request interceptor

Cross-origin CSRF checks, the admin-subdomain routing, and route auth guards live
in `src/proxy.ts` (Next.js's request-interceptor convention, formerly named
`middleware`).
