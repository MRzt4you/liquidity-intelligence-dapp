import baseWorker from './src/index';
import { normalizeStampedeTrades, buildRotations, radar, flow, evidence } from './src/stampede-engine';

type Env = Record<string, any>;

async function observedEvents(request: Request, env: Env, ctx: any) {
  const u = new URL(request.url);
  const r = await baseWorker.fetch(new Request(`${u.origin}/api/events`, { headers: request.headers }), env, ctx);
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/stampede')) return baseWorker.fetch(request, env, ctx);
    try {
      const events = await observedEvents(request, env, ctx);
      const trades = normalizeStampedeTrades(events);
      const windowS = Math.max(60, Number(url.searchParams.get('window') || 1800));
      const rotations = buildRotations(trades, windowS);
      const now = Date.now();
      if (url.pathname === '/api/stampede/status') return json({ mode:'REAL_DATA_ONLY', observedEvents:events.length, pumpTrades:trades.length, rotations:rotations.length, windowS, policy:'Observed wallet order only; no ownership or funding inference.' });
      if (url.pathname === '/api/stampede/rotations') return json({ windowS, count:rotations.length, rows:rotations.slice(0, Number(url.searchParams.get('limit') || 200)) });
      if (url.pathname === '/api/stampede/radar') return json({ windowS, rows:radar(trades, rotations, now, Math.max(60, Number(url.searchParams.get('span') || windowS))).slice(0, Number(url.searchParams.get('limit') || 50)) });
      if (url.pathname === '/api/stampede/flow') { const token=url.searchParams.get('token'); if(!token) return json({error:'token query is required'},400); return json(flow(rotations, token, Number(url.searchParams.get('limit')||100))); }
      if (url.pathname === '/api/stampede/evidence') return json({ rows:evidence(rotations,url.searchParams.get('token')||undefined,Number(url.searchParams.get('limit')||200)) });
      return json({error:'Not found'},404);
    } catch (error) { return json({ error: error instanceof Error ? error.message : 'stampede engine error' }, 500); }
  }
};
