# StratMarket — Deployment, Setup & Architecture Guide
**Operated by:** Elvaris Capital ([https://elvariscapital.in](https://elvariscapital.in))  
**Product Positioning:** The Marketplace for AI-Researched Trading Strategies  

---

## 1. System Architecture

StratMarket is architected into three distinct execution tiers:

```
┌────────────────────────────────┐       ┌───────────────────────────────┐
│     Next.js Web Marketplace    │       │     Elvaris Python VPS        │
│   (App Router, Server Actions) │       │   (Linux execution runner)    │
│  - Public Catalogue            │◄──────┼─── Authenticated HMAC Webhook │
│  - Research Reports            │       │   - Ingests Live Signals      │
│  - 7-Day Trial System          │       │   - Health / Heartbeats       │
│  - User & Admin Dashboards     │       └───────────────────────────────┘
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐       ┌───────────────────────────────┐
│     PostgreSQL Database        │       │  External Provider Adapters   │
│  - Prisma ORM & Migrations     │       │  - Transactional Email        │
│  - Immutable Strategy Versions │       │  - Payment Gateway (Stripe/RZ)│
│  - Server-Enforced Trials      │       │  - Broker Vault (Encrypted)   │
│  - Security Audit Trail        │       └───────────────────────────────┘
└────────────────────────────────┘
```

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env.local` for local execution:
```bash
cp .env.example .env.local
```

### Critical Variables:
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/stratmarket?schema=public` |
| `JWT_SECRET` | 32+ character HMAC key for session tokens | Random base64 string |
| `VPS_SHARED_SECRET` | Secret key shared with Elvaris Python VPS | Random hex string |
| `VPS_API_ENDPOINT` | URL of VPS execution engine | `https://vps.elvariscapital.in/api/v1` |
| `EMAIL_PROVIDER` | Transactional email provider | `console` (dev) or `resend` (prod) |
| `PAYMENT_PROVIDER` | Payment gateway | `stripe` or `razorpay` |
| `CREDENTIAL_VAULT_KEY` | AES-256-GCM key for broker credential storage | 32-byte secret |

---

## 3. Local Development Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Database Setup & Prisma Client Generation
```bash
npx prisma generate
```
*Note: If PostgreSQL is running locally, apply migrations with `npx prisma migrate dev`.*

### Step 3: Run the Test Suite
```bash
npm run test
```
Runs 20 unit and integration tests covering authentication, 7-day trials, marketplace filtering, VPS HMAC verification, and user isolation.

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 4. Pre-configured Evaluation Accounts

StratMarket includes pre-seeded evaluation accounts for seamless local evaluation:

- **Customer / Trader Account:**
  - **Email:** `trader@elvariscapital.in`
  - **Password:** `Elvaris2026!`
  - **Access:** Browse strategies, start 7-day trials, view countdown, configure alert preferences, connect paper simulator.

- **Administrator Account:**
  - **Email:** `admin@elvariscapital.in`
  - **Password:** `Elvaris2026!`
  - **Access:** Dedicated `/admin` console, toggle strategy publication status, view VPS runtime health, inspect incoming signal logs, audit trails.

---

## 5. Deployment Options

### Vercel / Cloudflare Pages / AWS Amplify
1. Connect GitHub repository.
2. Configure environment variables matching `.env.example`.
3. Build command: `npm run build`.
4. Output directory: default (`.next`).

### Docker Deployment
A standard multi-stage `Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```
