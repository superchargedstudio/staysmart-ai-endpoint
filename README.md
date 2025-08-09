
# StaySmart AI Endpoint (Vercel / Next.js)

An Edge API that rewrites a draft host message into a concise, friendly British-English note (5–7 lines).

## Deploy (Vercel)
1. Create a new Vercel project and import this folder.
2. Add an **Environment Variable**: `OPENAI_API_KEY` (or swap to your preferred provider).
3. Deploy. Your endpoint will be `https://YOUR-APP.vercel.app/api/rewrite`.

## CORS
This endpoint sends:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type
```
so Chrome content scripts can `fetch` it.

## Usage
Send `POST` JSON:
```json
{
  "draft": "message...",
  "listing": "title",
  "host": "First Last",
  "guests": 2,
  "nights": 3,
  "notes": "optional",
  "style": "friendly"
}
```
Response:
```json
{ "message": "rewritten text..." }
```
