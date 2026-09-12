# Render deployment

This package is prepared as two Render Web Services:

- `liquidity-intelligence-api`: persistent Node.js API + WebSocket scanner
- `liquidity-intelligence-web`: Next.js dashboard

## Deploy

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render detects `render.yaml` and creates both services.
4. Set `SOLANA_WS_URL` and `BNB_WS_URL` on the API service to reliable mainnet WebSocket RPC endpoints. Public/free endpoints may rate-limit or disconnect.
5. Deploy the API first. Confirm `/health` returns `ok: true` and `/api/status` reports `REAL_DATA_ONLY`.
6. Deploy the web service. Its `NEXT_PUBLIC_API_URL` is set to `https://liquidity-intelligence-api.onrender.com` by default.

## Data policy

Production code contains no demo feed, random market generator, paper positions, or synthetic fallback path. When the RPC/source is unavailable, the dashboard shows `OFFLINE`, `WAITING`, or `NO DATA`.

## Important

This package is a real-data read-only scanner. It does not enable real-money trade execution. Do not add private keys to Render environment variables unless you have a separate audited secret-management/execution architecture.
