# StratMarket by Elvaris Capital

> **The Marketplace for AI-Researched Trading Strategies**  
> Operated by [Elvaris Capital](https://elvariscapital.in)

StratMarket is a full-stack algorithmic trading strategy marketplace built with **Next.js (App Router)**, **TypeScript**, **PostgreSQL / Prisma**, and **Tailwind CSS**. It bridges quant research candidates evaluated on historical tick data with real-time signal distribution, server-enforced 7-day trials, authenticated Python VPS ingestion, and automated broker routing.

---

## Key Highlights & Features

- **Preserved Aesthetic & Rich Interactions:**
  - Sleek dark monochrome visual identity with subtle gold accents.
  - Interactive price terrain canvas (`#tr`) with dynamic sine wave superposition.
  - Floating macOS-style bottom dock with hover magnification and tooltips.
  - Interactive index with cursor-following floating preview card (`#pv`).
  - Strategy cards with real-time filtering (Instrument, Timeframe, Category, Implementation Type) and sorting.
  - Rich strategy report modal with interactive SVG equity curve & drawdown charts with bar tooltips.

- **Complete Backend & Database Architecture:**
  - **Prisma Relational Schema:** Entities for `User`, `Strategy`, `StrategyVersion`, `StrategyMetrics`, `StrategyEntitlement`, `Trial`, `Subscription`, `StrategySignal`, `EmailAlertPreference`, `EmailDelivery`, `TradingConnection`, `AuditEvent`, and `Plan`.
  - **Server-Enforced 7-Day Trials:** Atomic trial and entitlement creation; one trial per user per strategy; automatic expiration and access revocation.
  - **Real Authentication & RBAC:** Secure bcrypt password hashing and JWT sessions with role-based authorization (`CUSTOMER` vs `ADMIN`).
  - **Elvaris Python VPS Integration:** HMAC SHA-256 signature verification, replay protection (5-minute timestamp skew window), and idempotency via `sourceEventId`.
  - **User & Admin Dashboards:**
    - `/dashboard`: Active trials, countdowns, email signal preferences, broker connection previews.
    - `/admin`: Role-protected strategy publishing, VPS runtime monitor, customer management, and security audit logs.
  - **Broker Security:** Safe credential vault reference; never returns raw keys; live execution safely marked as requiring verified credentials.

---

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Run unit & integration test suite (20 tests)
npm run test

# 3. Build production bundle
npm run build

# 4. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Evaluation Credentials
- **Customer:** `trader@elvariscapital.in` / `Elvaris2026!`
- **Administrator:** `admin@elvariscapital.in` / `Elvaris2026!`

---

## Documentation
- [Python VPS Integration Contract](docs/VPS_INTEGRATION_CONTRACT.md)
- [Deployment & Setup Guide](docs/DEPLOYMENT_AND_SETUP.md)
- [Environment Configuration Template](.env.example)
