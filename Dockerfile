# ============================================================
# CarbonTrack India — Production Dockerfile for Google Cloud Run
# Multi-stage build: install → final image with non-root user
# ============================================================

# ---- Stage 1: Install dependencies ----
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files only — maximises Docker layer cache
COPY package.json package-lock.json ./

# Install only production dependencies (skip devDependencies)
RUN npm ci --omit=dev --ignore-scripts

# ---- Stage 2: Final production image ----
FROM node:20-alpine AS final

# Set non-root user (uid 1000) — required for Cloud Run security policies
USER node

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Copy application source
COPY --chown=node:node server.js       ./
COPY --chown=node:node public/         ./public/
COPY --chown=node:node .env.example    ./

# Cloud Run injects PORT=8080 by default; expose it
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Health check — Cloud Run will probe /api/healthz
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/api/healthz || exit 1

# Start the server
CMD ["node", "server.js"]
