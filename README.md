# StaySmart AI Endpoint (JS-only, Pages Router)

This avoids TypeScript and experimental config issues.

## Deploy on Vercel
1) Create/import this repo on Vercel (GitHub recommended).
2) In Project Settings → Environment Variables, add `OPENAI_API_KEY`.
3) Deploy.

## Endpoint
POST https://YOUR-PROJECT.vercel.app/api/rewrite
Body JSON: { draft, listing, host, guests, nights, notes }
Returns: { message }
