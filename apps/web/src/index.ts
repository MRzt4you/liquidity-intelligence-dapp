declare const WebSocketPair: any;

type Env = {
  ASSETS: any;
  SOLANA_WS_URL?: string;
  BNB_WS_URL?: string;
  PUMPPORTAL_WS_URL?: string;
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

const state = {
  events: [] as EventItem[],
  signals: [] as EventItem[],
  startedAt: Date.now(),
  metrics: {solanaEvents:0,bnbEvents:0,pumpEvents:0,latencyMs:0,sources:{solana:'STARTING',bnb:'NOT_CONFIGURED',pumpportal:'STARTING'} as Record<string,string>,dexEvents:{} as Record<string,number>}
};

const json = (data:unknown,status=200) => new Response(JSON.stringify(data), {
  status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});

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
  state.events.unshift(e);
  state.events=state.events.slice(0,500);
  if((e.type==='trade'||e.type==='token_create') && e.side && Number(e.amountQuote||0)>0) {
    const amount=Number(e.amountQuote);
    const signal={type:'market_signal',chain:e.chain,source:e.source,dex:e.dex,token:e.token||e.mint,side:e.side,amountQuote:amount,score:e.side==='buy'?60:40,state:e.side==='buy'?'BUY_WATCH':'RISK_WATCH',reason:'Derived only from observed on-chain event fields',ts:e.ts};
    state.signals.unshift(signal); state.signals=state.signals.slice(0,100);
  }
}

function api(path:string, env:Env) {
  if(path==='/api/dex') return json(DEXES);
  if(path==='/api/status') return json({mode:'REAL_DATA_ONLY',dataPolicy:'NO_DATA_NO_FALLBACK',cloudflare:true,bnbConfigured:Boolean(env.BNB_WS_URL),uptimeSec:Math.floor((Date.now()-state.startedAt)/1000),eventCount:state.events.length,dexes:DEXES});
  if(path==='/api/metrics') return json({mode:'REAL_DATA_ONLY',dataPolicy:'NO_DATA_NO_FALLBACK',...state.metrics,eventCount:state.events.length});
  if(path==='/api/signals') return json(state.signals);
  if(path==='/api/events') return json(state.events.slice(0,200));
  return null;
}

function bridge(request:Request, env:Env) {
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket') return new Response('WebSocket upgrade required',{status:426});
  const pair=new WebSocketPair();
  const client=pair[0], server=pair[1];
  server.accept();
  const send=(x:unknown)=>{try{server.send(JSON.stringify(x))}catch{}};
  send({type:'connected',service:'cloudflare-liquidity-api',mode:'REAL_DATA_ONLY',ts:Date.now(),sources:['solana-rpc','bsc-rpc','pump.fun/pumpswap']});
  const upstreams:WebSocket[]=[];
  const closeAll=()=>upstreams.forEach(x=>{try{x.close()}catch{}});
  const connect=(url:string|undefined,kind:'solana'|'bnb'|'pumpportal')=>{
    if(!url)return;
    try {
      const ws=new WebSocket(url); upstreams.push(ws);
      ws.addEventListener('open',()=>{
        if(kind==='solana') Object.entries(SOLANA_PROGRAMS).forEach(([,program],i)=>ws.send(JSON.stringify({jsonrpc:'2.0',id:i+1,method:'logsSubscribe',params:[{mentions:[program]},{commitment:'confirmed'}]})));
        else if(kind==='bnb') { ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_subscribe',params:['newHeads']})); ws.send(JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_subscribe',params:['logs',{}]})); }
        else { ws.send(JSON.stringify({method:'subscribeNewToken'})); ws.send(JSON.stringify({method:'subscribeMigration'})); }
        const event={type:'chain_status',chain:kind==='pumpportal'?'solana':kind,source:kind==='pumpportal'?'pumpportal':kind==='bnb'?'bsc-rpc':'solana-rpc',status:'LIVE',ts:Date.now()}; record(event); send(event);
      });
      ws.addEventListener('message',(ev:any)=>{
        try {
          const raw=typeof ev.data==='string'?ev.data:new TextDecoder().decode(ev.data); const m=JSON.parse(raw);
          let event:EventItem|null=null;
          if(kind==='solana' && m.method==='logsNotification') {
            const value=m.params?.result?.value, logs=value?.logs||[]; const hit=Object.entries(SOLANA_PROGRAMS).find(([,p])=>logs.some((l:string)=>l.includes(p)));
            event={type:'log',chain:'solana',source:'solana-rpc',ts:Date.now(),txHash:value?.signature,slot:m.params?.result?.context?.slot,dex:hit?.[0],eventName:'program_log'};
          } else if(kind==='bnb' && m.method==='eth_subscription') {
            const e=m.params?.result;
            if(e?.number) event={type:'block',chain:'bnb',source:'bsc-rpc',ts:Date.now(),blockNumber:parseInt(e.number,16)};
            else if(e) event={type:'log',chain:'bnb',source:'bsc-rpc',ts:Date.now(),txHash:e.transactionHash,blockNumber:e.blockNumber?parseInt(e.blockNumber,16):undefined,pool:e.address,eventName:e.topics?.[0]};
          } else if(kind==='pumpportal') {
            const type=raw.includes('migration')||raw.includes('complete')?'migration':'token_create';
            event={type,chain:'solana',source:'pump.fun/pumpswap',ts:Date.now(),dex:'pumpfun-pumpswap',token:m.mint||m.token,creator:m.traderPublicKey||m.creator};
          }
          if(event){record(event);send(event);}
        } catch {}
      });
      ws.addEventListener('close',()=>{const event={type:'chain_status',chain:kind==='pumpportal'?'solana':kind,source:kind==='pumpportal'?'pumpportal':kind==='bnb'?'bsc-rpc':'solana-rpc',status:'OFFLINE',ts:Date.now()};record(event);send(event)});
    } catch {}
  };
  connect(env.SOLANA_WS_URL||'wss://api.mainnet-beta.solana.com','solana');
  connect(env.BNB_WS_URL,'bnb');
  connect(env.PUMPPORTAL_WS_URL||'wss://pumpportal.fun/api/data','pumpportal');
  server.addEventListener('close',closeAll);
  return new Response(null,{status:101,webSocket:client});
}

export default {
  async fetch(request:Request, env:Env):Promise<Response> {
    const url=new URL(request.url);
    if(url.pathname==='/health') return json({ok:true,service:'liquidity-intelligence-worker',mode:'REAL_DATA_ONLY'});
    const response=api(url.pathname,env); if(response) return response;
    if(url.pathname==='/ws') return bridge(request,env);
    return env.ASSETS.fetch(request);
  }
};
