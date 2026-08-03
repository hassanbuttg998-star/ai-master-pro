// /api/generate-prompt.js
// Secure server-side proxy to Groq's AI text API.
// The GROQ_API_KEY is read from a Vercel Environment Variable and is
// NEVER exposed to the browser. The front-end calls this endpoint instead
// of calling Groq (or Pollinations) directly.

module.exports = async function handler(req, res) {
    // Allow requests only from POST (simple + safe)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { system, message } = req.body || {};

        if (!message) {
            return res.status(400).json({ error: 'Missing "message" in request body' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Server is not configured with GROQ_API_KEY' });
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    ...(system ? [{ role: 'system', content: system }] : []),
                    { role: 'user', content: message }
                ],
                temperature: 0.8,
                max_tokens: 500
            })
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error('Groq API error:', errText);
            return res.status(502).json({ error: 'AI provider error, please try again.' });
        }

        const data = await groqRes.json();
        const text = data?.choices?.[0]?.message?.content?.trim() || '';

        return res.status(200).json({ text });

    } catch (err) {
        console.error('generate-prompt error:', err);
        return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
}
