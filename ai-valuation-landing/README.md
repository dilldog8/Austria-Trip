# Valuator AI — Landing Page

Static, single-file landing page for **Valuator AI**, an AI-automation concept for the insurance/asset valuation industry. No build step — just open `index.html` or host it as a static site (GitHub Pages, Netlify, Vercel, etc.).

## Set up the waitlist (required)

The signup form uses [FormSubmit.co](https://formsubmit.co) to email you new signups with zero backend.

1. Open `index.html` and find this line in the waitlist `<form>`:
   ```html
   action="https://formsubmit.co/REPLACE_WITH_YOUR_EMAIL@example.com"
   ```
2. Replace `REPLACE_WITH_YOUR_EMAIL@example.com` with the email address that should receive waitlist signups.
3. The first time someone submits the form, FormSubmit will send that inbox a confirmation email — click the activation link once. After that, every signup arrives by email automatically.

No account, API key, or server is required.

### Want a real database instead of email?
Swap the form `action` for any form backend (Formspree, Getform, a Google Sheet via Apps Script, Airtable, or your own API endpoint) — the JS already submits via `fetch` and just needs a `2xx` JSON response.

## Customizing

- Company name, copy, and colors all live in `index.html` (CSS variables at the top of `<style>` control the palette).
- No external dependencies, fonts, or images — fully self-contained for fast hosting.
