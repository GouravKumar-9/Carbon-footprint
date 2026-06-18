require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const jwt        = require('jsonwebtoken');
const { Groq }   = require('groq-sdk');
const crypto     = require('crypto');
const bcrypt     = require('bcryptjs');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');

const PORT       = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'test'
    ? 'carbontrack-secret-key-2026'
    : crypto.randomBytes(32).toString('hex'));

/* ------------------------------------------------------------------ 
   Groq client — singleton instantiated at startup (not per-request)
   ------------------------------------------------------------------ */
const GROQ_KEY = process.env.GROQ_API_KEY;
const groqClient = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;

/* ------------------------------------------------------------------
   Compression (gzip/brotli) — reduces transfer size ~70%
   ------------------------------------------------------------------ */
app.use(compression());

/* ------------------------------------------------------------------
   Helmet — strict security headers
   ------------------------------------------------------------------ */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   [
        "'self'",
        "'unsafe-inline'",
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcAttr: ["'unsafe-inline'"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https://*"],
      connectSrc:  ["'self'"],
    },
  },
  // HSTS — force HTTPS for 1 year
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

/* ------------------------------------------------------------------
   CORS — allowlist only
   ------------------------------------------------------------------ */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ------------------------------------------------------------------
   Body parser — capped at 50 KB to block oversized payloads
   ------------------------------------------------------------------ */
app.use(express.json({ limit: '50kb' }));

/* ------------------------------------------------------------------
   Static files — serve with caching
   ------------------------------------------------------------------ */
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filepath) => {
    if (path.basename(filepath) === 'index.html') {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

/* ------------------------------------------------------------------
   JWT Authentication Middleware
   ------------------------------------------------------------------ */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  console.log(`[AUTH] Token length: ${token ? token.length : 0}`);

  if (!token) {
    console.warn('[AUTH] Access denied: Token missing.');
    return res.status(401).json({ error: 'Access denied: Token missing.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[AUTH] Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    console.log(`[AUTH] Token verified successfully for user: ${user.email}`);
    req.user = user;
    next();
  });
}

/* ------------------------------------------------------------------
   Rate limiters
   ------------------------------------------------------------------ */
const loginLimiter = rateLimit({
  windowMs:      15 * 60 * 1000,
  max:           (process.env.NODE_ENV === 'production') ? 5 : 100,
  skip:          (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many login attempts from this IP. Please try again after 15 minutes.' }
});

const chatLimiter = rateLimit({
  windowMs:      15 * 60 * 1000,
  max:           30,
  skip:          (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many chat requests from this IP. Please try again after 15 minutes.' }
});

/* ------------------------------------------------------------------
   Credentials — bcrypt (industry standard, automatic salt baked in)
   
   DEFAULT: bcrypt hash of 'greenplanet2026' (cost factor 12)
   To generate your own: node -e "require('bcryptjs').hash('yourpassword',12).then(h=>console.log(h))"
   Then set ADMIN_PASSWORD_HASH in your environment / Cloud Run secret.
   ------------------------------------------------------------------ */
const defaultEmail        = (process.env.ADMIN_EMAIL || 'gaurav@carbontrack.in').toLowerCase();
const defaultPasswordHash = process.env.ADMIN_PASSWORD_HASH ||
  '$2b$12$AR/noeZpftNSXZ2z6GYymOQeONIaigNu2gwk9WAzWAh/MR0M.2rJK'; // bcrypt of 'greenplanet2026'

/* ------------------------------------------------------------------
   POST /api/login
   ------------------------------------------------------------------ */
app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Length cap — prevent hash-DoS
  if (typeof email !== 'string' || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }
  if (typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Password too long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  const isEmailMatch    = email.toLowerCase() === defaultEmail;
  // bcrypt compare — constant-time; always run even if email wrong (timing safety)
  const isPasswordMatch = await bcrypt.compare(password, defaultPasswordHash);

  if (isEmailMatch && isPasswordMatch) {
    const user  = { email: defaultEmail, name: 'Gaurav' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token, user });
  }

  return res.status(401).json({ error: 'Invalid email or password.' });
});

/* ------------------------------------------------------------------
   POST /api/chat — protected, rate-limited, input-validated
   ------------------------------------------------------------------ */
const MAX_MESSAGES     = 40;
const MAX_CONTENT_LEN  = 4000;
const MAX_SYSTEM_LEN   = 1500;

app.post('/api/chat', authenticateToken, chatLimiter, async (req, res) => {
  const { messages, system } = req.body;
  console.log(`[CHAT] POST /api/chat - messages: ${messages ? messages.length : 0}, system prompt length: ${system ? system.length : 0}`);

  if (!Array.isArray(messages)) {
    console.warn('[CHAT] messages is not an array');
    return res.status(400).json({ error: 'Invalid request: messages must be an array.' });
  }

  if (messages.length > MAX_MESSAGES) {
    console.warn(`[CHAT] messages count ${messages.length} exceeds max ${MAX_MESSAGES}`);
    return res.status(400).json({ error: `Too many messages. Maximum is ${MAX_MESSAGES}.` });
  }

  for (const msg of messages) {
    if (
      typeof msg !== 'object' || msg === null ||
      typeof msg.content !== 'string' ||
      !['user', 'assistant', 'system'].includes(msg.role)
    ) {
      console.warn('[CHAT] message has invalid role or structure:', JSON.stringify(msg));
      return res.status(400).json({ error: 'Invalid request: each message must have a valid role and content string.' });
    }
    if (msg.content.length > MAX_CONTENT_LEN) {
      console.warn(`[CHAT] message content length ${msg.content.length} exceeds max ${MAX_CONTENT_LEN}`);
      return res.status(400).json({ error: `Message content too long. Maximum is ${MAX_CONTENT_LEN} characters.` });
    }
  }

  if (system !== undefined) {
    if (typeof system !== 'string') {
      console.warn('[CHAT] system prompt is not a string');
      return res.status(400).json({ error: 'Invalid request: system must be a string.' });
    }
    if (system.length > MAX_SYSTEM_LEN) {
      console.warn(`[CHAT] system prompt length ${system.length} exceeds max ${MAX_SYSTEM_LEN}`);
      return res.status(400).json({ error: `System prompt too long. Maximum is ${MAX_SYSTEM_LEN} characters.` });
    }
  }

  if (!groqClient) {
    console.error('[CHAT] groqClient is not initialized');
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  try {
    console.log('[CHAT] Calling Groq API...');
    const chatCompletion = await groqClient.chat.completions.create({
      model:      'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages
      ],
      temperature: 0.7,
    });

    console.log('[CHAT] Groq API response received successfully');
    res.json(chatCompletion);
  } catch (err) {
    console.error('Groq API error:', err);
    res.status(500).json({ error: 'Failed to reach Groq API.' });
  }
});

/* ------------------------------------------------------------------
   GET /api/healthz — liveness probe for Cloud Run / Docker
   ------------------------------------------------------------------ */
app.get('/api/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ------------------------------------------------------------------
   SPA fallback — serve index.html for all unmatched routes
   ------------------------------------------------------------------ */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ------------------------------------------------------------------
   Start server (only when run directly, not when imported by tests)
   ------------------------------------------------------------------ */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ CarbonTrack server running on port ${PORT}`);
    if (!GROQ_KEY) {
      console.warn('⚠️  GROQ_API_KEY not set — AI chat will be disabled.');
    }
  });
}

module.exports = app;
