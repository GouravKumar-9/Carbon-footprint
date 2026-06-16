# CarbonTrack India — Deployment Guide

## Folder structure
```
carbontrack-server/
├── server.js          ← Express proxy server
├── package.json       ← Node dependencies
├── render.yaml        ← Render.com config
├── README.md          ← This file
└── public/
    └── index.html     ← Your full web app
```

---

## Option 1: Deploy on Render.com (FREE — Recommended)

### Step 1 — Get your Groq API key
1. Go to https://console.groq.com
2. Click **API Keys** → **Create Key**
3. Copy and save it (starts with `gsk_...`)

### Step 2 — Upload to GitHub
1. Go to https://github.com and create a free account
2. Click **New repository** → name it `carbontrack-india` → Create
3. Upload all files from this folder (drag & drop in GitHub UI)
   - server.js
   - package.json
   - render.yaml
   - README.md
   - public/index.html

### Step 3 — Deploy on Render
1. Go to https://render.com and sign up (free)
2. Click **New** → **Web Service**
3. Connect your GitHub account → select `carbontrack-india` repo
4. Render auto-detects settings from render.yaml ✅
5. Scroll down to **Environment Variables**
6. Click **Add Environment Variable**:
   - Key: `GROQ_API_KEY`
   - Value: `gsk_your-key-here`
7. Click **Create Web Service**
8. Wait ~2 minutes → your site is live at `carbontrack-india.onrender.com` 🎉

---

## Option 2: Deploy on Railway.app (FREE — Even Simpler)

1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `carbontrack-india` repo
4. Click **Variables** tab → Add:
   - `GROQ_API_KEY` = `gsk_your-key-here`
5. Railway auto-deploys → live in 1 minute ✅

---

## Option 3: Run locally on your computer

```bash
# 1. Install Node.js from https://nodejs.org (if not installed)

# 2. Open terminal in this folder
cd carbontrack-server

# 3. Install dependencies
npm install

# 4. Set your API key
# On Mac/Linux:
export GROQ_API_KEY=gsk_your-key-here

# On Windows (Command Prompt):
set GROQ_API_KEY=gsk_your-key-here

# 5. Start the server
npm start

# 6. Open browser → http://localhost:3000
```

---

## Why is a server needed?

The Groq AI API cannot be called directly from a browser — it's blocked
by browser security rules (CORS). The server acts as a middleman:

```
Browser → your server (/api/chat) → Groq API → back to browser
```

This also keeps your API key secret — it never appears in the browser.

---

## Cost

- Render free tier: $0/month (sleeps after 15min inactivity, wakes in ~30s)
- Groq API: Standard pricing (includes a very generous free tier)
- Everything else: completely free
