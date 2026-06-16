require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Allow browser requests from your own site
app.use(cors());
app.use(express.json());

// ✅ Serve your carbontrack.html as the frontend
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Proxy route — browser calls this, server calls Groq
app.post('/api/chat', async (req, res) => {
  const { messages, system } = req.body;

  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_KEY) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...(messages || [])
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    res.json(data);
  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ error: 'Failed to reach Groq API.' });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ CarbonTrack server running on port ${PORT}`);
});
