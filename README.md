# Liquidity Intelligence DApp — Solana + BNB

Real-data-only Liquidity Intelligence + Smart Money Scanner for Solana and BNB Chain.

This repository is being populated from the Render-ready v4.1 build. It contains the API, web dashboard, chain adapters, intelligence engines, database schema, and deployment configuration.

## Current mode
- REAL_DATA_ONLY / READ_ONLY
- No demo/random market feed
- No paper-trading endpoints in the active server
- No private keys or wallet signing

## Deployment
See `RENDER.md` for the two-service Render deployment (API + web).

## Configuration
Copy `.env.example` and provide real Solana/BSC WebSocket RPC endpoints. PumpPortal is used as a third-party Solana stream where configured.
