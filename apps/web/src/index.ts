declare const WebSocketPair: any;

type Env = {
  ASSETS: any;
  SOLANA_WS_URL?: string;
  SOLANA_RPC_URL?: string;
  BNB_WS_URL?: string;
  BNB_RPC_URL?: string;
  PUMPPORTAL_WS_URL?: string;
  PUMPPORTAL_API_KEY?: string;
};
type EventItem = Record<string, any> & { ts: number };
type PumpToken = { mint?: string; name?: string; symbol?: string; creator?: string; createdAt: number; initialBuy?: number; marketCapSol?: number; pool?: string; bondingCurveKey?: string; txHash?: string; firstSeenAt: number; trades: number; buys: number; sells: number; inflowSol: number; outflowSol: number; lastBuyAt?: number; lastSellAt?: number; risk: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNRATED'; riskReasons: string[] };

const DEXES = [
  { id: 'raydium-amm', name: 'Raydium AMM', chain: 'solana', kind: 'v2' },
  { id: 'raydium-cpmm', name: 'Raydium CPMM', chain: 'solana', kind: 'v2' },
  { id: 'raydium-clmm', name: 'Raydium CLMM', chain: 'solana', kind: 'v3' },
  { id: 'orca-whirlpool', name: 'Orca Whirlpools', chain: 'solana', kind: 'v3' },
  { id: 'meteora-dlmm', name: 'Meteora DLMM', chain: 'solana', kind: 'v3' },
  { id: 'meteora-damm', name: 'Meteora DAMM', chain: 'solana', kind: 'v2' },
  { id: 'pumpfun-pumpswap', name: 'Pump.fun / PumpSwap', chain: 'solana', kind: 'bonding_curve' },
  { id: 'jupiter', name: 'Jupiter', chain: 'solana', kind: 'aggregator' },
  { id: 'pancakeswap-v2', name: 'PancakeSwap V2', chain: 'bnb', kind: 'v2' },
  { id: 'pancakeswap-v3', name: 'PancakeSwap V3', chain: 'bnb', kind: 'v3' },
  { id: 'flap', name: 'Flap.sh', chain: 'bnb', kind: 'bonding_curve' },
];
const SOLANA_PROGRAMS: Record<string, string> = {
  'raydium-amm': '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  'raydium-cpmm': 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  'raydium-clmm': 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  'orca-whirlpool': 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  'meteora-dlmm': 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  'meteora-damm': 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
};
const TOPIC = {
  swap: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
  sync: '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1',
  mint: '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f',
  burn: '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496',
  transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
};
const state = {
  events: [] as EventItem[], signals: [] as EventItem[], pumpTokens: new Map<string, PumpToken>(), startedAt: Date.now(),
  metrics: { solanaEvents: 0, bnbEvents: 0, pumpEvents: 0, tradeEvents: 0, liquidityEvents: 0, tokenEvents: 0, latencyMs: 0, sources: { solana: 'STARTING', bnb: 'STARTING', pumpportal: 'STARTING' } as Record<string, string>, dexEvents: {} as Record<string, number> },
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
function numHex(x: any) { try { return x == null ? undefined : parseInt(String(x), 16); } catch { return undefined; } }
function word(data: string, n: number) { const s = (data || '').replace(/^0x/, ''); const x = s.slice(n * 64, (n + 1) * 64); return x ? BigInt('0x' + x).toString() : undefined; }
function addrTopic(x: any) { if (!x) return undefined; return '0x' + String(x).replace(/^0x/, '').slice(-40); }
function riskForPumpToken(t: PumpToken): PumpToken['risk'] {
  const reasons: string[] = [];
  if (!t.mint) reasons.push('missing CA');
  if (!t.creator) reasons.push('creator not observed');
  if ((t.initialBuy || 0) <= 0) reasons.push('initial buy not observed');
  if ((t.initialBuy || 0) > 10) reasons.push('large initial buy');
  if ((t.inflowSol || 0) > 0 && (t.outflowSol || 0) > (t.inflowSol || 0) * 0.75) reasons.push('heavy early outflow');
  if (t.sells >= 5 && t.sells >= t.buys) reasons.push('sell pressure');
  if (t.trades === 0) reasons.push('no trade flow yet');
  t.riskReasons = reasons;
  if (!t.mint || !t.creator) return 'HIGH';
  if (reasons.includes('heavy early outflow') || reasons.includes('sell pressure')) return 'HIGH';
  if ((t.initialBuy || 0) <= 0 || t.trades === 0) return 'UNRATED';
  if ((t.buys >= 3 && t.buys > t.sells) || t.inflowSol > t.outflowSol * 2) return 'LOW';
  return 'MEDIUM';
}
function updatePumpToken(input: Partial<PumpToken> & { mint?: string; ts?: number }) {
  const mint = input.mint; if (!mint) return; const now = Number(input.ts || Date.now());
  const current = state.pumpTokens.get(mint) || { mint, createdAt: now, firstSeenAt: now, trades: 0, buys: 0, sells: 0, inflowSol: 0, outflowSol: 0, risk: 'UNRATED' as const, riskReasons: [] };
  const next = { ...current, ...input } as PumpToken; next.firstSeenAt = current.firstSeenAt; next.risk = riskForPumpToken(next); state.pumpTokens.set(mint, next);
  if (state.pumpTokens.size > 300) { const oldest = [...state.pumpTokens.values()].sort((a, b) => a.firstSeenAt - b.firstSeenAt)[0]; if (oldest?.mint) state.pumpTokens.delete(oldest.mint); }
}
function record(event: EventItem) {
  const e = { ...event, ts: Number(event.ts || Date.now()) }; state.metrics.latencyMs = Math.max(0, Date.now() - e.ts);
  if (e.chain === 'solana') state.metrics.solanaEvents++; if (e.chain === 'bnb') state.metrics.bnbEvents++; if (e.source === 'pump.fun/pumpswap') state.metrics.pumpEvents++;
  if (e.type === 'trade') state.metrics.tradeEvents++; if (e.type === 'liquidity') state.metrics.liquidityEvents++; if (e.type === 'token_create') state.metrics.tokenEvents++; if (e.dex) state.metrics.dexEvents[e.dex] = (state.metrics.dexEvents[e.dex] || 0) + 1;
  if (e.type === 'chain_status') { const k = e.source === 'pumpportal' ? 'pumpportal' : e.chain; if (k) state.metrics.sources[k] = e.status || 'UNKNOWN'; }
  state.events.unshift(e); state.events = state.events.slice(0, 500);
  if (e.source === 'pump.fun/pumpswap' && e.token) {
    const mint = String(e.token); const current = state.pumpTokens.get(mint);
    if (e.type === 'token_create') updatePumpToken({ mint, name: e.name, symbol: e.symbol, creator: e.creator, createdAt: e.ts, initialBuy: Number(e.initialBuy || 0) || undefined, marketCapSol: Number(e.marketCapSol || 0) || undefined, pool: e.pool, bondingCurveKey: e.bondingCurveKey, txHash: e.txHash, ts: e.ts });
    else if (current && e.type === 'trade') {
      const quote = Number(e.amountQuote || 0); const buy = e.side === 'buy';
      updatePumpToken({ ...current, trades: current.trades + 1, buys: current.buys + (buy ? 1 : 0), sells: current.sells + (buy ? 0 : 1), inflowSol: current.inflowSol + (buy ? quote : 0), outflowSol: current.outflowSol + (buy ? 0 : quote), lastBuyAt: buy ? e.ts : current.lastBuyAt, lastSellAt: buy ? current.lastSellAt : e.ts, ts: e.ts });
    }
    const updated = state.pumpTokens.get(mint); if (updated && (e.type === 'token_create' || e.type === 'trade')) { e.risk = updated.risk; e.riskReasons = updated.riskReasons; e.inflowSol = updated.inflowSol; e.outflowSol = updated.outflowSol; e.buys = updated.buys; e.sells = updated.sells; e.tradeCount = updated.trades; }
  }
  if ((e.type === 'trade' || e.type === 'token_create' || e.type === 'migration') && e.side && Number(e.amountQuote || 0) > 0) { state.signals.unshift({ type: 'market_signal', chain: e.chain, source: e.source, dex: e.dex, token: e.token || e.mint, side: e.side, amountQuote: e.amountQuote, state: e.side === 'buy' ? 'BUY_WATCH' : 'RISK_WATCH', reason: 'Observed real event flow', ts: e.ts }); state.signals = state.signals.slice(0, 100); }
}
function api(path: string, env: Env) {
  if (path === '/api/dex') return json(DEXES);
  if (path === '/api/pumpfun') return json([...state.pumpTokens.values()].sort((a, b) => b.firstSeenAt - a.firstSeenAt));
  if (path === '/api/status') return json({ mode: 'REAL_DATA_ONLY', dataPolicy: 'NO_DATA_NO_FALLBACK', cloudflare: true, bnbConfigured: true, solanaConfigured: true, pumpTradeFeed: Boolean(env.PUMPPORTAL_API_KEY), pumpLaunchFeed: true, uptimeSec: Math.floor((Date.now() - state.startedAt) / 1000), eventCount: state.events.length, metrics: state.metrics, dexes: DEXES });
  if (path === '/api/metrics') return json({ mode: 'REAL_DATA_ONLY', dataPolicy: 'NO_DATA_NO_FALLBACK', ...state.metrics, eventCount: state.events.length, pumpTradeFeed: Boolean(env.PUMPPORTAL_API_KEY), pumpLaunchFeed: true });
  if (path === '/api/signals') return json(state.signals);
  if (path === '/api/events') return json(state.events.slice(0, 250));
  return null;
}
async function solanaDetails(signature: string | undefined, dex: string | undefined, env: Env) {
  if (!signature) return null;
  try {
    const rpc = env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const r = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [signature, { encoding: 'jsonParsed', commitment: 'confirmed', maxSupportedTransactionVersion: 0 }] }) });
    const j: any = await r.json(); const v = j.result; if (!v) return null; const msg = v.transaction?.message || {};
    const keys = (msg.accountKeys || []).map((k: any) => typeof k === 'string' ? k : k.pubkey).filter(Boolean); const pre = v.meta?.preTokenBalances || []; const post = v.meta?.postTokenBalances || []; const map = new Map<string, any>();
    for (const b of pre) map.set(String(b.accountIndex), { pre: Number(b.uiTokenAmount?.uiAmount || 0), post: 0, mint: b.mint, owner: b.owner });
    for (const b of post) { const k = String(b.accountIndex); const old = map.get(k) || { pre: 0, post: 0, mint: b.mint, owner: b.owner }; old.post = Number(b.uiTokenAmount?.uiAmount || 0); old.mint = b.mint || old.mint; old.owner = b.owner || old.owner; map.set(k, old); }
    const tokenBalanceChanges = [...map.entries()].map(([i, x]) => ({ accountIndex: Number(i), account: keys[Number(i)], mint: x.mint, owner: x.owner, delta: x.post - x.pre })).filter(x => x.delta !== 0).slice(0, 24);
    const lamportChanges = (v.meta?.preBalances || []).map((n: number, i: number) => ({ account: keys[i], delta: (v.meta?.postBalances?.[i] || 0) - n })).filter((x: any) => x.delta !== 0).slice(0, 24);
    return { slot: v.slot, blockTime: v.blockTime, feeLamports: v.meta?.fee, computeUnits: v.meta?.computeUnitsConsumed, success: !v.meta?.err, err: v.meta?.err, accounts: keys.slice(0, 30), tokenBalanceChanges, lamportChanges, logMessages: (v.meta?.logMessages || []).slice(0, 30), dex };
  } catch { return null; }
}
function pumpEvent(raw: string, m: any): EventItem {
  const pool = m.pool || m.poolId || m.exchange; const txType = String(m.txType || m.type || m.side || '').toLowerCase(); const isMigration = txType.includes('migrat') || raw.toLowerCase().includes('migration'); const isTrade = Boolean(m.txType || m.side || m.tokenAmount || m.solAmount || m.baseAmount || m.quoteAmount); const type = isMigration ? 'migration' : isTrade ? 'trade' : 'token_create'; const side = txType.includes('sell') ? 'sell' : txType.includes('buy') ? 'buy' : undefined; const amountQuote = Number(m.solAmount ?? m.quoteAmount ?? m.bnbAmount ?? m.amountQuote ?? 0) || undefined;
  return { type, chain: 'solana', source: 'pump.fun/pumpswap', ts: Number(m.timestamp || m.created_timestamp || Date.now()), dex: pool || 'pumpfun-pumpswap', token: m.mint || m.token || m.ca, creator: m.traderPublicKey || m.creator || m.user, txHash: m.signature || m.tx || m.txHash, side, amountQuote, tokenAmount: m.tokenAmount || m.token_amount, initialBuy: m.initialBuy, marketCapSol: m.marketCapSol, vSolInBondingCurve: m.vSolInBondingCurve, vTokensInBondingCurve: m.vTokensInBondingCurve, bondingCurveKey: m.bondingCurveKey, name: m.name, symbol: m.symbol, uri: m.uri, pool };
}
function bridge(request: Request, env: Env) {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket upgrade required', { status: 426 });
  const pair = new WebSocketPair(); const client = pair[0], server = pair[1]; server.accept(); const send = (x: unknown) => { try { server.send(JSON.stringify(x)); } catch {} };
  send({ type: 'connected', service: 'cloudflare-liquidity-api', mode: 'REAL_DATA_ONLY', ts: Date.now(), sources: ['solana-rpc', 'bsc-rpc', 'pump.fun/pumpswap'] });
  const upstreams: WebSocket[] = []; const timers: number[] = []; const closeAll = () => { upstreams.forEach(x => { try { x.close(); } catch {} }); timers.forEach(x => clearTimeout(x)); };
  const connect = (url: string | undefined, kind: 'solana' | 'bnb' | 'pumpportal') => {
    if (!url) return;
    try {
      const ws = new WebSocket(url); upstreams.push(ws);
      ws.addEventListener('open', () => {
        if (kind === 'solana') Object.entries(SOLANA_PROGRAMS).forEach(([, program], i) => ws.send(JSON.stringify({ jsonrpc: '2.0', id: i + 1, method: 'logsSubscribe', params: [{ mentions: [program] }, { commitment: 'confirmed' }] })));
        else if (kind === 'bnb') { ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['newHeads'] })); ws.send(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_subscribe', params: ['logs', {}] })); }
        else { ws.send(JSON.stringify({ method: 'subscribeNewToken' })); ws.send(JSON.stringify({ method: 'subscribeMigration' })); if (env.PUMPPORTAL_API_KEY) ws.send(JSON.stringify({ method: 'subscribeTokenTrade', keys: [] })); }
        const e = { type: 'chain_status', chain: kind === 'pumpportal' ? 'solana' : kind, source: kind === 'pumpportal' ? 'pumpportal' : kind === 'bnb' ? 'bsc-rpc' : 'solana-rpc', status: 'LIVE', ts: Date.now(), details: kind === 'pumpportal' ? (env.PUMPPORTAL_API_KEY ? 'launch+migration+trade configured' : 'launch+migration free feed; trade feed not enabled') : kind === 'bnb' ? 'public BSC websocket' : 'Solana mainnet websocket' }; record(e); send(e);
      });
      ws.addEventListener('message', (ev: any) => {
        void (async () => {
          try {
            const raw = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data); const m = JSON.parse(raw); let event: EventItem | null = null;
            if (kind === 'solana' && m.method === 'logsNotification') {
              const value = m.params?.result?.value; const logs = value?.logs || []; const hit = Object.entries(SOLANA_PROGRAMS).find(([, p]) => logs.some((l: string) => l.includes(p)));
              event = { type: 'log', chain: 'solana', source: 'solana-rpc', ts: Date.now(), txHash: value?.signature, slot: m.params?.result?.context?.slot, dex: hit?.[0], eventName: 'program_log', logCount: logs.length, logs: logs.slice(0, 12) }; record(event); send(event);
              const d = await solanaDetails(value?.signature, hit?.[0], env); if (d) { const detail = { type: 'transaction_detail', chain: 'solana', source: 'solana-rpc', ts: Date.now(), txHash: value.signature, dex: hit?.[0], ...d }; record(detail); send(detail); }
            } else if (kind === 'bnb' && m.method === 'eth_subscription') {
              const e = m.params?.result;
              if (e?.number) event = { type: 'block', chain: 'bnb', source: 'bsc-rpc', ts: Date.now(), blockNumber: numHex(e.number), hash: e.hash, parentHash: e.parentHash, timestamp: numHex(e.timestamp), gasUsed: numHex(e.gasUsed) };
              else if (e) {
                const topic = String(e.topics?.[0] || '').toLowerCase(); const eventName = topic === TOPIC.swap ? 'swap' : topic === TOPIC.sync ? 'liquidity_sync' : topic === TOPIC.mint ? 'liquidity_add' : topic === TOPIC.burn ? 'liquidity_remove' : topic === TOPIC.transfer ? 'transfer' : 'contract_log'; const data = String(e.data || ''); let extra: any = {};
                if (eventName === 'swap') extra = { sender: addrTopic(e.topics?.[1]), to: addrTopic(e.topics?.[2]), amount0In: word(data, 0), amount1In: word(data, 1), amount0Out: word(data, 2), amount1Out: word(data, 3) };
                if (eventName === 'liquidity_sync') extra = { reserve0: word(data, 0), reserve1: word(data, 1) };
                if (eventName === 'liquidity_add' || eventName === 'liquidity_remove') extra = { provider: addrTopic(e.topics?.[1]), amount0: word(data, 0), amount1: word(data, 1) };
                if (eventName === 'transfer') extra = { from: addrTopic(e.topics?.[1]), to: addrTopic(e.topics?.[2]), amount: word(data, 0) };
                event = { type: eventName === 'swap' ? 'trade' : eventName.startsWith('liquidity_') ? 'liquidity' : eventName === 'transfer' ? 'wallet_transfer' : 'log', chain: 'bnb', source: 'bsc-rpc', ts: Date.now(), txHash: e.transactionHash, blockNumber: numHex(e.blockNumber), pool: e.address, eventName, topic0: topic, topic1: e.topics?.[1], topic2: e.topics?.[2], topic3: e.topics?.[3], data, ...extra };
              }
              if (event) { record(event); send(event); }
            } else if (kind === 'pumpportal') { event = pumpEvent(raw, m); record(event); send(event); }
          } catch (error) { send({ type: 'parser_error', source: kind, message: error instanceof Error ? error.message : 'unknown parser error', ts: Date.now() }); }
        })();
      });
      ws.addEventListener('close', () => { const e = { type: 'chain_status', chain: kind === 'pumpportal' ? 'solana' : kind, source: kind === 'pumpportal' ? 'pumpportal' : kind === 'bnb' ? 'bsc-rpc' : 'solana-rpc', status: 'OFFLINE', ts: Date.now() }; record(e); send(e); const t = setTimeout(() => connect(url, kind), 2500) as unknown as number; timers.push(t); });
      ws.addEventListener('error', () => {});
    } catch { const t = setTimeout(() => connect(url, kind), 2500) as unknown as number; timers.push(t); }
  };
  connect(env.SOLANA_WS_URL || 'wss://api.mainnet-beta.solana.com', 'solana'); connect(env.BNB_WS_URL || 'wss://rpc.nodeflare.app/bnb/ws/public', 'bnb'); const pumpUrl = env.PUMPPORTAL_WS_URL || 'wss://pumpportal.fun/api/data'; const pump = pumpUrl + (env.PUMPPORTAL_API_KEY ? (pumpUrl.includes('?') ? '&' : '?') + 'api-key=' + encodeURIComponent(env.PUMPPORTAL_API_KEY) : ''); connect(pump, 'pumpportal'); server.addEventListener('close', closeAll); return new Response(null, { status: 101, webSocket: client });
}
export default { async fetch(request: Request, env: Env): Promise<Response> { const url = new URL(request.url); if (url.pathname === '/health') return json({ ok: true, service: 'liquidity-intelligence-worker', mode: 'REAL_DATA_ONLY' }); const response = api(url.pathname, env); if (response) return response; if (url.pathname === '/ws') return bridge(request, env); return env.ASSETS.fetch(request); } };
