# Valuator AI — The Valuator Group

Internal tool for The Valuator Group's valuers. Log in, create a valuation job in any of four asset categories (Property, Plant & Machinery, Motor Vehicles, Art & Collectibles), add comparable sales and photos, then generate an AI-assisted first draft of the report — edit it, save it, and export it as a branded PDF or plain text.

Every valuer at the company logs in under one shared organization. Any valuer can see and work on any job in the org (a collaborative model, not a personal-folder model). Admins can invite new valuers from inside the app — no one else can sign up.

## What you need

1. A **Supabase** project on the **Pro plan** (~$25/mo) — see note below on why.
2. A **Gemini API key** — the AI that writes the draft.
3. A **Vercel** account — hosts the live site, connected to this GitHub repo.

### Why Supabase Pro

The free tier pauses a project after a week of inactivity and caps how many invite emails it can send per hour. Neither is acceptable for a company tool multiple people rely on. Upgrading is a manual action in the Supabase dashboard (**Project Settings → Billing**) — there's no code change involved, just flip it to Pro before rolling this out to more than one person.

## 1. Set up Supabase

If this is a **brand-new Supabase project** (skip to step 2 if you already have one running from before):

1. Go to [supabase.com](https://supabase.com) → sign up → "New project".
2. **SQL Editor** → "New query" → paste the entire contents of `supabase/schema.sql` → "Run".
3. Then paste the entire contents of `supabase/migrations/0002_multi_tenant_and_categories.sql` → "Run". This adds multi-tenancy and the four asset categories.
4. **Authentication → Users** → "Add user" → create the first account (this will become the admin).
5. **Project Settings → API** — note the **Project URL**, the **anon public** key, and the **service_role** key (under "Project API keys", click "Reveal"). You'll need all three below.

If you are **upgrading an existing project** from the Property-only MVP:

1. **SQL Editor** → run `supabase/migrations/0002_multi_tenant_and_categories.sql`. It's written to run safely on top of existing data: it creates one "The Valuator Group" organization, makes every existing logged-in user an admin of it, and migrates the existing test job into the new category/details format automatically. Nothing to fill in by hand.
2. Grab the **service_role** key from **Project Settings → API** (you didn't need this one before).

### Bootstrap: make yourself an admin

The migration automatically makes every existing user an admin when it runs. If you're setting this up fresh and just created your first user in step 1.4 above, run the migration **after** creating that user so it picks them up. Once you're an admin, you can invite everyone else from the **Manage Users** page in the app — no further SQL needed.

## 2. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → sign in → "Create API key". Copy it.

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with your GitHub account.
2. "Add New" → "Project" → import the `Austria-Trip` repository.
3. Set the **Root Directory** to `valuator-app`.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — **server-only, never exposed to the browser.** Required for inviting new valuers. Treat it like a password: do not paste it anywhere public.
   - `GEMINI_API_KEY`
5. Click **Deploy**.

## Using the app

1. Log in. The first admin account can invite the rest of the team from **Dashboard → Manage Users**: enter an email and name, and Supabase will email them an invite to set a password.
2. **New Valuation Job** → pick an asset category (Property, Plant & Machinery, Motor Vehicle, Art & Collectibles) — the form fields below change to match.
3. On the job page, add comparable sales and upload photos.
4. **Generate Draft** — the AI writes a first-draft report using category-appropriate valuation language (comparable sales for property, depreciated replacement cost for machinery, mileage-adjusted comparisons for vehicles, auction/provenance-based comparisons for art).
5. Edit the draft directly, **Save**, then export as **PDF** (branded, ready to hand to a client) or **.txt** (plain text).

Any valuer in the org can see and edit any job — there are no personal/private jobs within the company.

## Local development

```bash
cd valuator-app
npm install
cp .env.local.example .env.local   # fill in your real values
npm run dev
```

## Notes

- The Gemini call lives in one file, `lib/ai/generateReport.ts` — swapping AI providers later only means editing that file.
- Asset category definitions (fields, labels) live in `lib/categories.ts` — adding a fifth category later is a matter of extending that one file plus the methodology hint in `generateReport.ts`.
- The branded PDF layout lives in `lib/pdf/ValuationReportPdf.tsx`.
- There is no public signup form. Every account is created either via the Supabase dashboard (the first admin) or the in-app invite flow (everyone after that).
