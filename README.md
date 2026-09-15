# FinPath - AI Financial Decision & Journey Copilot

FinPath is an AI-powered financial decision engine and copilot designed for digital merchants and individual users. It provides deterministic financial health scoring, stress-testing scenario modeling, mobile OTP authentication, and automated financial decision recommendation paths (Borrow, Save, Protect, Wait).

---

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts, Motion
- **Backend**: Express.js, TypeScript, Node.js (`server.ts`)
- **AI Engine**: `@google/genai` (Google Gemini 2.5 Flash / Pro)
- **Database / Auth**: MongoDB Node Driver, Crypto OTP HMAC-SHA256, HTTP-Only Cookie Sessions

---

## Features

- **Financial Health Radar**: Dynamic resilience score based on debt-to-income, liquidity runway, and essential expense buffer.
- **Decision Engine**: Rule-based & AI-orchestrated financial recommendations.
- **What-If Stress Lab**: Real-time simulation of financial shocks (income drops, unexpected expenses, rate changes).
- **Consent Center**: Transparent user consent management for data processing.
- **Copilot**: Natural language financial assistant integrated with Google Gemini AI.
- **Multi-Factor Auth**: Secure SMS OTP authentication & demo mode bypass for quick testing.

---

## Local Development

### Prerequisites
- Node.js (v18+)
- npm

### Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/suyash00773/FINPath.git
   cd FINPath
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## Production Build

To test the production build locally:

```bash
npm run build
npm start
```

- `npm run build`: Compiles the Vite React frontend into `dist/` and bundles `server.ts` using `esbuild` to `dist/server.cjs`.
- `npm start`: Runs the Node production server using `dist/server.cjs`.

---

## Deployment Configuration

FinPath is ready to deploy on **Vercel**, **Render**, **Railway**, or any Node.js hosting platform.

### Vercel Deployment Settings

- **Framework Preset**: `Vite`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables

Configure the following environment variables in your deployment platform dashboard:

- `GEMINI_API_KEY`: API key for Google Gemini AI integration.
- `APP_URL`: Production application URL.
- `MONGODB_URI`: (Optional) MongoDB connection string for persistent sessions.
- `OTP_SECRET`: Secret key for OTP HMAC generation.
- `SESSION_SECRET`: Secret key for session cookie signing.
- `MOCK_SMS`: Set to `true` for demo/testing environments.

---

## License

MIT
