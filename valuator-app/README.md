# Valuator AI — Internal Drafting Tool (MVP)

Internal-only tool for The Valuator Group. Log in, create a property valuation job, add comparable sales and photos, then generate an AI-assisted first draft of the report to review and export. Property valuations only for now.

## What you need (all free tier)

1. A **Supabase** project — database, login, and photo storage.
2. A **Gemini API key** — the AI that writes the draft.
3. A **Vercel** account — hosts the live site, connected to this GitHub repo.

## 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → sign up free → "New project".
2. Once created, go to **SQL Editor** → "New query" → paste the entire contents of `supabase/schema.sql` (in this folder) → click "Run". This creates the database tables and storage bucket.
3. Go to **Authentication → Users** → "Add user" → create an account with your dad's email and a password he'll remember. This is the only login the app will accept (no public signup).
4. Go to **Project Settings → API**. You'll need two values from this page in step 3 below:
   - **Project URL**
   - **anon public** key

## 2. Get a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → sign in → "Create API key". Copy it.

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up free with your GitHub account.
2. "Add New" → "Project" → import the `Austria-Trip` repository.
3. When it asks for the **Root Directory**, set it to `valuator-app`.
4. Under **Environment Variables**, add these three (values from steps 1 & 2 above):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Click **Deploy**. After a minute you'll get a live URL — that's the app.

## Using the app

1. Open the Vercel URL, log in with the account created in step 1.3.
2. "New Valuation Job" → fill in the property details.
3. On the job page, add comparable sales (address, price, date, size) and upload any photos.
4. Click **Generate Draft** — the AI writes a first-draft report from the details you entered.
5. Edit the draft directly in the text box, **Save**, or **Export as .txt** to use elsewhere.

## Local development

```bash
cd valuator-app
npm install
cp .env.local.example .env.local   # fill in your real values
npm run dev
```

## Notes

- This covers Property valuations only — other asset categories can be added later.
- The Gemini call lives in one file, `lib/ai/generateReport.ts`, so swapping to a different AI provider later only means editing that file.
- Only the accounts you create manually in Supabase can log in — there is no public signup form.
