
// /api/rewrite.ts — Next.js (Edge runtime) on Vercel
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { draft, listing, host, guests, nights, notes, style = 'friendly' } = await req.json();

    if (!draft || !nights) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const system = [
      'You are StaySmart, a concise assistant for travellers.',
      'Write in British English; keep to 5–7 short lines.',
      'Tone: friendly, respectful, trustworthy; no emojis; no exclamation spam.',
      'Personalise to property/host if details are provided.',
      'Mention that the guest will treat the home like their own.',
      'Do not output explanations — only the final message.'
    ].join(' ');

    const user = `Original draft:
---
${draft}
---

Context:
- Listing: ${listing || 'N/A'}
- Host: ${host || 'N/A'}
- Guests: ${guests || 'N/A'}
- Nights: ${nights}
- Notes: ${notes || 'N/A'}

Rewrite the message accordingly in 5–7 lines.`;

    // --- OpenAI example ---
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: 'LLM error', detail: err }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await resp.json();
    const message = data?.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Empty AI response' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // Minimal CORS for content scripts
    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Server error', detail: e?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
