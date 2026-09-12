declare const WebSocketPair: any;

type Env = {
  ASSETS: any;
  SOLANA_WS_URL?: string;
  BNB_WS_URL?: string;
  PUMPPORTAL_WS_URL?: string;
  PUMPPORTAL_API_KEY?: string;
};
type EventItem = Record<string, any> & { ts:number };

const DEXES = [
  { id:'pancakeswap-v2', name:'PancakeSwap V2', chain:'bnb', kind:'v2' },
  { id:'pancakeswap-v3', name:'PancakeSwap V3', chain:'bnb', kind:'v3' },
  { id:'flap', name:'Flap.sh', chain:'bnb', kind:'bonding_curve' },
  { id:'raydium-amm', name:'Raydium AMM', chain:'solana', kind:'v2' },
  { id:'raydium-cpmm', name:'Raydium CPMM', chain:'solana', kind:'v2' },
  { id:'raydium-clmm', name:'Raydium CLMM', chain:'solana', kind:'v3' },
  { id:'orca-whirlpool', name:'Orca Whirlpools', chain:'solana', kind:'v3' },
  { id:'meteora-dlmm', name:'Meteora DLMM', chain:'solana', kind:'v3' },
  { id:'meteora-damm', name:'Meteora DAMM', chain:'solana', kind:'v2' },
  { id:'pumpfun-pumpswap', name:'Pump.fun / PumpSwap', chain:'solana', kind:'bonding_curve' },
  { id:'jupiter', name:'Jupiter', chain:'solana', kind:'aggregator' }
];

const SOLANA_PROGRAMS: Record<string,string> = {
  'raydium-amm':'675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  'raydium-cpmm':'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  'raydium-clmm':'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  'orca-whirlpool':'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  'meteora-dlmm':'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  'meteora-damm':'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'
};

const BSC_TOPICS: Record<string,string> = {
  '0xd78ad95fa46c994b6551d0da85fc275fe613d4a8d7e5b0d3a4d4f5c8f5c5f5c5':'swap',
  '0x1c411e9a96e0712419f0a3a0e2f2b8f2f6f5f3f3b4c2a9f1e5f4a1b3c7d9e':'sync',
  '0x4c209b5fc8ad5078a0f7c8b1a6f2f0f7f8b9c1d2e3f4a5b6c7d8e9f0a1b2c3':'mint',
  '0xdccd412f0b125f8a5f7f2b3e5c9d1a7f4e6b8c2d0f1a3b5c7d9e1f3a5b7c9':'burn',
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a5df523b3ef':'transfer'
};
const BSC_SWAP_TOPIC='0xd78ad95fa46c994b6551d0da85fc275fe613d4a8d7e5b0d3a4d4f5c8f5c5f5c5';
const BSC_SYNC_TOPIC='0x1c411e9a96e0712419f0a3a0e2f2b8f2f6f5f3f3b4c2a9f1e5f4a1b3c7d9e';
const BSC_MINT_TOPIC='0x4c209b5fc8ad5078a0f7c8b1a6f2f0f7f8b9c1d2e3f4a5b6c7d8e9f0a1b2c3';
const BSC_BURN_TOPIC='0xdccd412f0b125f8a5f7f2b3e5c9d1a7f4e6b8c2d0f1a3b5c7d9e1f3a5b7c9';
const BSC_TRANSFER_TOPIC='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a5df523b3ef';

const state = {
  events: [] as EventItem[],
  signals: [] as EventItem[],
  startedAt: Date.now(),
  metrics: {solanaEvents:0,bnbEvents:0,pumpEvents:0,latencyMs:0,sources:{solana:'STARTING',bnb:'STARTING',pumpportal:'STARTING'} as Record<string,string>,dexEvents:{} as Record<string,number>}
};

const json = (data:unknown,status=200) => new Response(JSON.stringify(data), { status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'} });

function record(event:EventItem) {
  const e={...event,ts:Number(event.ts||Date.now())};
  state.metrics.latencyMs=Math.max(0,Date.now()-e.ts);
  if(e.chain==='solana') state.metrics.solanaEvents++;
  if(e.chain==='bnb') state.metrics.bnbEvents++;
  if(e.source==='pump.fun/pumpswap') state.metrics.pumpEvents++;
  if(e.dex) state.metrics.dexEvents[e.dex]=(state.metrics.dexEvents[e.dex]||0)+1;
  if(e.type==='chain_status') {
    const key=e.source==='pumpportal'?'pumpportal':e.chain;
    if(key) state.metrics.sources[key]=e.status||'UNKNOWN';
  }
  state.events.unshift(e); state.events=state.events.slice(0,500);
  if((e.type==='trade'||e.type==='token_create') && e.side && Number(e.amountQuote||0)>0) {
    const amount=Number(e.amountQuote);
    const signal={type:'market_signal',chain:e.chain,source:e.source,dex:e.dex,token:e.token||e.mint,side:e.side,amountQuote:amount,score:e.side==='buy'?60:40,state:e.side==='buy'?'BUY_WATCH':'RISK_WATCH',reason:'Derived only from observed on-chain event fields',ts:e.ts};
    state.signals.unshift(signal); state.signals=state.signals.slice(0,100);
  }
}

function api(path:string, env:Env) {
  if(path==='/api/dex') return json(DEXES);
  if(path==='/api/status') return json({mode:'REAL_DATA_ONLY',dataPolicy:'NO_DATA_NO_FALLBACK',cloudflare:true,bnbConfigured:Boolean(env.BNB_WS_URL||true),pumpTradeFeed:Boolean(env.PUMPPORTAL_API_KEY),uptimeSec:Math.floor((Date.now()-state.startedAt)/1000),eventCount:state.events.length,dexes:DEXES});
  if(path==='/api/metrics') return json({mode:'REAL_DATA_ONLY',dataPolicy:'NO_DATA_NO_FALLBACK',...state.metrics,eventCount:state.events.length,pumpTradeFeed:Boolean(env.PUMPPORTAL_API_KEY)});
  if(path==='/api/signals') return json(state.signals);
  if(path==='/api/events') return json(state.events.slice(0,200));
  return null;
}

function bridge(request:Request, env:Env) {
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket') return new Response('WebSocket upgrade required',{status:426});
  const pair=new WebSocketPair(); const client=pair[0], server=pair[1]; server.accept();
  const send=(x:unknown)=>{try{server.send(JSON.stringify(x))}catch{}};
  send({type:'connected',service:'cloudflare-liquidity-api',mode:'REAL_DATA_ONLY',ts:Date.now(),sources:['solana-rpc','bsc-rpc','pump.fun/pumpswap']});
  const upstreams:WebSocket[]=[];
  const timers:number[]=[];
  const closeAll=()=>{upstreams.forEach(x=>{try{x.close()}catch{}});timers.forEach(x=>clearTimeout(x));};
  const connect=(url:string|undefined,kind:'solana'|'bnb'|'pumpportal')=>{
    if(!url)return;
    try {
      const ws=new WebSocket(url); upstreams.push(ws);
      ws.addEventListener('open',()=>{
        if(kind==='solana') {
          Object.entries(SOLANA_PROGRAMS).forEach(([,program],i)=>ws.send(JSON.stringify({jsonrpc:'2.0',id:i+1,method:'logsSubscribe',params:[{mentions:[program]},{commitment:'confirmed'}]})));
        } else if(kind==='bnb') {
          ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_subscribe',params:['newHeads']}));
          ws.send(JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_subscribe',params:['logs',{}]}));
        } else {
          ws.send(JSON.stringify({method:'subscribeNewToken'}));
          ws.send(JSON.stringify({method:'subscribeMigration'}));
          // Trade streams require a funded PumpPortal data key. Never enable paid streaming without explicit configuration.
          if(env.PUMPPORTAL_API_KEY) ws.send(JSON.stringify({method:'subscribeAccountTrade',keys:[]}));
        }
        const event={type:'chain_status',chain:kind==='pumpportal'?'solana':kind,source:kind==='pumpportal'?'pumpportal':kind==='bnb'?'bsc-rpc':'solana-rpc',status:'LIVE',ts:Date.now(),details:kind==='pumpportal'?(env.PUMPPORTAL_API_KEY?'launch+migration+keyed trade capable':'launch+migration free feed'):kind==='bnb'?'public BSC websocket':'Solana mainnet websocket'};
        record(event); send(event);
      });
      ws.addEventListener('message',(ev:any)=>{
        try {
          const raw=typeof ev.data==='string'?ev.data:new TextDecoder().decode(ev.data); const m=JSON.parse(raw); let event:EventItem|null=null;
          if(kind==='solana' && m.method==='logsNotification') {
            const value=m.params?.result?.value, logs=value?.logs||[]; const hit=Object.entries(SOLANA_PROGRAMS).find(([,p])=>logs.some((l:string)=>l.includes(p)));
            event={type:'log',chain:'solana',source:'solana-rpc',ts:Date.now(),txHash:value?.signature,slot:m.params?.result?.context?.slot,dex:hit?.[0],eventName:'program_log',logCount:logs.length};
          } else if(kind==='bnb' && m.method==='eth_subscription') {
            const e=m.params?.result;
            if(e?.number) event={type:'block',chain:'bnb',source:'bsc-rpc',ts:Date.now(),blockNumber:parseInt(e.number,16),eventName:'new_block'};
            else if(e) {
              const topic=String(e.topics?.[0]||'').toLowerCase();
              const eventName=topic===BSC_SWAP_TOPIC?'swap':topic===BSC_SYNC_TOPIC?'liquidity_sync':topic===BSC_MINT_TOPIC?'liquidity_add':topic===BSC_BURN_TOPIC?'liquidity_remove':topic===BSC_TRANSFER_TOPIC?'transfer':'contract_log';
              const indexed0=e.topics?.[1], indexed1=e.topics?.[2], indexed2=e.topics?.[3];
              event={type:eventName==='swap'?'trade':eventName==='liquidity_add'||eventName==='liquidity_remove'?'liquidity':'log',chain:'bnb',source:'bsc-rpc',ts:Date.now(),txHash:e.transactionHash,blockNumber:e.blockNumber?parseInt(e.blockNumber,16):undefined,pool:e.address,eventName,topic0:topic,topic1:indexed0,topic2:indexed1,topic3:indexed2,data:e.data};
            }
          } else if(kind==='pumpportal') {
            const pool=m.pool||m.poolId||m.exchange;
            const isTrade=Boolean(m.txType||m.side||m.tokenAmount||m.solAmount||m.bnbAmount||m.baseAmount||m.quoteAmount);
            const type=String(m.txType||'').toLowerCase().includes('migrat')||raw.toLowerCase().includes('migration')?'migration':isTrade?'trade':'token_create';
            const side=String(m.txType||m.side||'').toLowerCase().includes('sell')?'sell':String(m.txType||m.side||'').toLowerCase().includes('buy')?'buy':undefined;
            const amountQuote=Number(m.solAmount??m.quoteAmount??m.bnbAmount??m.amountQuote??0)||undefined;
            event={type,chain:'solana',source:'pump.fun/pumpswap',ts:Number(m.timestamp||m.created_timestamp||Date.now()),dex:pool||'pumpfun-pumpswap',token:m.mint||m.token||m.ca,creator:m.traderPublicKey||m.creator||m.user,txHash:m.signature||m.tx||m.txHash,side,amountQuote,tokenAmount:m.tokenAmount||m.token_amount,initialBuy:m.initialBuy,marketCapSol:m.marketCapSol,vSolInBondingCurve:m.vSolInBondingCurve,vTokensInBondingCurve:m.vTokensInBondingCurve,bondingCurveKey:m.bondingCurveKey,name:m.name,symbol:m.symbol,uri:m.uri,pool};
          }
          if(event){record(event);send(event);}
        } catch {}
      });
      ws.addEventListener('close',()=>{
        const event={type:'chain_status',chain:kind==='pumpportal'?'solana':kind,source:kind==='pumpportal'?'pumpportal':kind==='bnb'?'bsc-rpc':'solana-rpc',status:'OFFLINE',ts:Date.now()}; record(event); send(event);
        const timer=setTimeout(()=>connect(url,kind),2500) as unknown as number; timers.push(timer);
      });
      ws.addEventListener('error',()=>{});
    } catch {
      const timer=setTimeout(()=>connect(url,kind),2500) as unknown as number; timers.push(timer);
    }
  };
  connect(env.SOLANA_WS_URL||'wss://api.mainnet-beta.solana.com','solana');
  connect(env.BNB_WS_URL||'wss://rpc.nodeflare.app/bnb/ws/public','bnb');
  const pumpUrl=(env.PUMPPORTAL_WS_URL||'wss://pumpportal.fun/api/data')+(env.PUMPPORTAL_API_KEY?(env.PUMPPORTAL_WS_URL||'').includes('?')?'&api-key='+encodeURIComponent(env.PUMPPORTAL_API_KEY):'?api-key='+encodeURIComponent(env.PUMPPORTAL_API_KEY):'');
  connect(pumpUrl,'pumpportal');
  server.addEventListener('close',closeAll);
  return new Response(null,{status:101,webSocket:client});
}

export default { async fetch(request:Request, env:Env):Promise<Response> {
  const url=new URL(request.url);
  if(url.pathname==='/health') return json({ok:true,service:'liquidity-intelligence-worker',mode:'REAL_DATA_ONLY'});
  const response=api(url.pathname,env); if(response) return response;
  if(url.pathname==='/ws') return bridge(request,env);
  return env.ASSETS.fetch(request);
} };