# HANZI — Liquidity Intelligence DApp

Real-data-only Liquidity Intelligence + Smart Money Scanner for Solana and BNB Chain.

## For the owner

This repository is designed so the public website is a static Next.js export on **Cloudflare Pages**, while the real-time read-only API runs as a **Node.js Web Service on Render**.

You do not need to run the code locally for normal hosting.

## Production architecture

- **Cloudflare Pages** → `apps/web`
- **Render Web Service** → `apps/api`
- Frontend automatically connects to `https://liquidity-intelligence-api.onrender.com` unless `NEXT_PUBLIC_API_URL` is supplied.
- Frontend uses HTTP API + WebSocket to receive live events.
- API binds to `0.0.0.0` and uses Render's `PORT`/configured API port.

Cloudflare Pages static Next.js deployment uses `npx next build` with output directory `out`. Render supports Node web services and WebSockets.

## Current mode

- REAL_DATA_ONLY / READ_ONLY
- No demo/random market feed
- No paper positions
- No synthetic market values
- No private keys
- No wallet signing
- No real-money execution

## DEX / launchpad coverage

### Solana
- Pump.fun / PumpSwap via PumpPortal read-only WebSocket
- Raydium AMM v4, CPMM and CLMM program monitoring
- Orca Whirlpools program monitoring
- Meteora DLMM and DAMM program monitoring
- Jupiter represented as an aggregation/routing layer

### BNB Chain
- PancakeSwap V2 factory + dynamically discovered pair swap monitoring
- PancakeSwap V3 factory + dynamically discovered pool swap monitoring
- Flap.sh Portal bonding-curve tracking
- Flap token creation, bonding-curve buys and `LaunchedToDEX` migration events

## Deployment

### Cloudflare Pages

Use the GitHub repository as the source and configure:

- Framework preset: **Next.js (Static HTML Export)**
- Production branch: `main`
- Build command: `npx next build`
- Build directory: `out`
- Environment variable (optional): `NEXT_PUBLIC_API_URL=https://liquidity-intelligence-api.onrender.com`

The repository already contains `apps/web/next.config.mjs`, `apps/web/wrangler.toml`, `apps/web/.env.example`, and `apps/web/public/_headers` for this layout.

### Render

Deploy only the API service from `render.yaml`:

- Service: `liquidity-intelligence-api`
- Runtime: Node
- Root directory: `apps/api`
- Build: `npm install && npm run build`
- Start: `npm start`
- Health check: `/health`

Required live-data configuration:

- `SOLANA_WS_URL` defaults to the public Solana mainnet WebSocket endpoint for light/read-only use.
- `BNB_WS_URL` must be set to a working BNB Chain WebSocket RPC endpoint.
- `PUMPPORTAL_WS_URL` is already configured.
- Optional PumpPortal trade streams require the appropriate PumpPortal API key and are subject to its current data policy.

For heavy production ingestion, use dedicated/private RPC infrastructure because public RPC endpoints are rate-limited.

## Important limitation

The current build performs venue/program discovery and real-time event ingestion. It does not claim that every DEX event is fully ABI-decoded into human-readable swap amounts yet; raw on-chain payloads are retained so decoder coverage can be expanded without inventing data.

## Safety

The active production path is intentionally **read-only**. Legacy trading-related source files may exist in the repository from earlier development, but they are not imported by the active server and are not exposed as execution endpoints.
