// pages/api/rewrite.js — JS-only (no TypeScript deps)
export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { draft, listing, host, guests, nights, notes, style = 'friendly' } = req.body || {};

    if (!draft || !nights) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const system = [
      'You are StaySmart, a concise assistant for travellers.',
      'Write in British English; keep to 5–7 short lines.',
      'Tone: friendly, respectful, trustworthy; no emojis; no exclamation spam.',
      'Personalise to property/host if details are provided.',
      'Mention that the guest will treat the home like their own.',
      'Output only the final message.'
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
      res.status(502).json({ error: 'LLM error', detail: err });
      return;
    }

    const data = await resp.json();
    const message = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content.trim()
      : '';

    if (!message) {
      res.status(502).json({ error: 'Empty AI response' });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).json({ message });
  } catch (e) {
    res.status(500).json({ error: 'Server error', detail: e && e.message ? e.message : String(e) });
  }
}
