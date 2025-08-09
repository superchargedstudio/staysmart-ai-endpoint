// pages/api/rewrite.js — Structured StaySmart prompt (JS-only)
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(401).json({ error: 'Server misconfigured: missing OPENAI_API_KEY' });
  }
  try {
    const body = req.body || {};
    const { draft = '', listing = '', host = '', guests = '', nights, notes = '', discount } = body;
    if (!draft || !nights || !guests || !discount) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ error: 'Missing required fields: draft, nights, guests, discount' });
    }
    const firstName = String(host || '').replace(/Superhost/gi, '').trim().split(/\s+/)[0] || 'there';
    const party =
      Number(guests) === 1 ? 'a solo traveller' :
      Number(guests) === 2 ? 'a couple' :
      `${guests} quiet guests`;
    const system = [
      'You are StaySmart, a concise assistant for travellers requesting discounts from Airbnb hosts.',
      'Write in British English.',
      'Produce 5–7 short lines.',
      'Follow this structure loosely:',
      '1) Intro + praise: say the place is exactly what the guest is looking for.',
      '2) Discount ask: include the exact requested percentage (e.g., "10%"); mention it is slightly outside their budget and they will book immediately if given the discount.',
      '3) End with "Thanks!" on its own line.',
      'Include party size and number of nights.',
      'Address the host by first name only; never include "Superhost".',
      'Make it sound conversational and polite. It shouldnt sound mechanical or code like.',
      'Do not include any signature or [YOUR NAME].',
      'Return only the final message, no bullet points or code fences.'
    ].join(' ');
    const user = `Context:
- Host first name: ${firstName}
- Listing title: ${listing || 'N/A'}
- Party: ${party}
- Nights: ${nights}
- Discount requested: ${discount}%
- Notes: ${notes || 'N/A'}

Original draft to improve:
${draft}
`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.35,
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
      })
    });
    if (!resp.ok) {
      const detail = await resp.text();
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json({ error: 'LLM error', detail });
    }
    const data = await resp.json();
    const message = data?.choices?.[0]?.message?.content?.trim();
    if (!message) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(502).json({ error: 'Empty AI response' });
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ message });
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Server error', detail: String(err && err.message || err) });
  }
}
