# Alston Electric

Local MVP package for Alston Electric's photo-to-estimate assistant.

## Run the backend-powered app

From this folder:

```powershell
npm install
npm start
```

Then open:

`http://localhost:4173`

The backend stores local MVP data in `data/db.json` by default.

## Optional production-style services

Copy `.env.example` to `.env` and fill in the services you want:

- `DATABASE_URL`: enables PostgreSQL storage. For Supabase, use the pooled Postgres connection string.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: reserved for a future direct Supabase client or storage integration.
- `CALCOM_BOOKING_URL` or `CALDIY_BOOKING_URL`: shows a branded Cal.com booking page after customer quote approval.
- `TELNYX_API_KEY`, `TELNYX_FROM_NUMBER`, `TELNYX_MESSAGING_PROFILE_ID`: enables real SMS sending.
- `PUBLIC_BASE_URL`: controls customer quote/upload links sent by SMS.

Apply the Postgres schema before setting `DATABASE_URL`:

```powershell
psql "$env:DATABASE_URL" -f db/schema.sql
```

Without Telnyx credentials, SMS actions are safely simulated and logged to the request timeline.

## Vercel + Supabase deployment

This repo is set up to work with:

- **Vercel** for hosting the site and API functions.
- **Supabase** for the Postgres database.

Deploy flow:

1. Create a Supabase project.
2. Run `db/schema.sql` in the Supabase SQL editor.
3. Copy the Supabase pooled connection string into `DATABASE_URL`.
4. Deploy the repo to Vercel.
5. Set `PUBLIC_BASE_URL` to the live Vercel domain.
6. Add Telnyx and Cal.com environment variables if you want those features live.

For a deployed site, set these in the Telnyx Messaging Profile:

- Webhook URL: `https://YOUR-DOMAIN.com/api/webhooks/telnyx`
- Webhook Failover URL: `https://YOUR-BACKUP-DOMAIN.com/api/webhooks/telnyx`

## Static fallback

You can still open `index.html` directly for a browser-only demo, but requests and settings will stay in that browser's local storage instead of the backend file store.

## Admin demo

Admin login page: `#/admin/login`

Demo password: `alston`

## Included in this MVP

- Public home page
- Estimate request page
- Thank-you page
- Admin login
- Admin dashboard
- Request detail page
- AI-style draft estimate generation from customer answers
- Emergency warning logic
- Conditional job-specific questions
- Photo and video upload previews
- Admin photo evidence review
- Editable quote message
- Quote preview page
- Customer quote approval page
- Appointment request flow
- More-photos request flow
- SMS notification endpoint for quote and photo requests
- Generated quote PDF endpoint
- Optional Cal.com booking URL handoff
- Copy, print, and email-draft quote actions
- Follow-up message templates
- Pricing settings
- Company settings
- Local backend API with file-backed persistence

## API

OpenAPI documentation is in `openapi.json`.

Key local endpoints:

- `GET /api/health`
- `GET /api/state`
- `PUT /api/requests`
- `PUT /api/pricing`
- `PUT /api/company`
- `POST /api/notifications/sms`
- `POST /api/webhooks/telnyx`
- `GET /api/quotes/{requestId}.pdf`

This is intentionally built as a private Alston Electric tool, not a multi-company SaaS platform.
