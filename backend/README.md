# Mochi Backend (API)

Node.js serverless functions and API for Mochi AI Companion.

## Setup
```bash
npm install
```

## Development
```bash
npm run dev
```

Runs on `http://localhost:3001`

## Endpoints (Ready for Phase 3)
- `POST /api/check-in` — Send unprompted check-in messages
- `POST /api/emotion-update` — Update emotional memory
- `POST /api/stream-clause` — Stream Claude responses

## Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

## Test
```bash
npm run test
```

## Code Quality
```bash
npm run lint
npm run format
```
