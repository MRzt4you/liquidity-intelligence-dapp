# Liquidity Intelligence DApp — Solana + BNB

Real-data-only Liquidity Intelligence + Smart Money Scanner for Solana and BNB Chain.

## Current mode
- REAL_DATA_ONLY / READ_ONLY
- No demo/random market feed
- No paper positions or synthetic market values
- No private keys or wallet signing

## DEX / launchpad coverage
### Solana
- Pump.fun / PumpSwap via PumpPortal read-only WebSocket
- Raydium AMM v4, CPMM and CLMM program monitoring
- Orca Whirlpools program monitoring
- Meteora DLMM and DAMM program monitoring
- Jupiter is represented as a routing/aggregation layer; underlying venue is tracked separately where observable

### BNB Chain
- PancakeSwap V2 factory + dynamically discovered pair swap monitoring
- PancakeSwap V3 factory + dynamically discovered pool swap monitoring
- Flap.sh Portal bonding-curve tracking on BNB mainnet
- Flap token creation, bonding-curve buys and `LaunchedToDEX` migration events

## Pump.fun data policy
PumpPortal is a third-party data service. `subscribeNewToken` and `subscribeMigration` are available for launch/migration monitoring; token/account trade streams require a PumpPortal API key and are metered according to PumpPortal's current data policy. The scanner never stores or requests a private wallet key.

## Detailed event model
Normalized events can carry chain, DEX, DEX kind, token, pool, wallet, side, amounts, block/slot, transaction hash, fee tier, creator, migration and raw source payload. The API exposes `/api/dex`, `/api/events`, `/api/signals`, `/api/metrics` and a live WebSocket stream.

## Deployment
See `RENDER.md` for the two-service Render deployment (API + web).

## Configuration
Copy `.env.example` and provide real Solana/BSC WebSocket RPC endpoints. Optional PumpPortal API key, token mints and wallet watchlists can be configured for metered trade streams.

## Important limitation
The current build performs venue/program discovery and real-time event ingestion. It does not claim that every DEX event is fully ABI-decoded into human-readable swap amounts yet; raw on-chain payloads are retained so the decoder can be expanded without inventing data.
