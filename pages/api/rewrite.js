// pages/api/rewrite.js — JS-only, with robust errors
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(401).json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });
    }

    const body = req.body || {};
    const {
      draft = '',
      listing = '',
      host = '',
      guests = '',
      nights,
      notes = '',
      style = 'friendly'
    } = body;

    if (!draft || !nights) {
      console.error('Bad request body', body);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ error: 'Missing required fields: draft and nights' });
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

    // Call OpenAI
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
      const detail = await resp.text();
      console.error('OpenAI error', resp.status, detail);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json({ error: 'LLM error', detail });
    }

    const data = await resp.json();
    const message = data?.choices?.[0]?.message?.content?.trim();
    if (!message) {
      console.error('Empty AI response', data);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json({ error: 'Empty AI response' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ message });
  } catch (err) {
    console.error('Server error', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}
