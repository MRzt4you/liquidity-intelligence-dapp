# Source inventory

- Solana: WebSocket `logsSubscribe` raw stream.
- Pump.fun/PumpSwap: PumpPortal read-only WebSocket discovery/trade stream.
- BNB Smart Chain: `eth_subscribe` `newHeads` plus configurable `logs`.
- Flap: intentionally exposed through the BSC log adapter; exact contract addresses/topics must be configured for the deployment/version being indexed.

No private keys, signing, automated buying/selling, or execution are included.
