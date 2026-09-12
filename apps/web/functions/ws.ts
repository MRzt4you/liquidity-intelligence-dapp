import { SOLANA_PROGRAMS } from './_utils';

type Env = { SOLANA_WS_URL?: string; BNB_WS_URL?: string; PUMPPORTAL_WS_URL?: string };

const send=(ws:WebSocket,x:any)=>{try{ws.send(JSON.stringify(x))}catch{}};

export const onRequestGet = async (ctx:any) => {
  const upgrade=ctx.request.headers.get('Upgrade');
  if(upgrade?.toLowerCase()!=='websocket') return new Response('WebSocket upgrade required',{status:426});
  const pair=new WebSocketPair();
  const client=pair[0], server=pair[1];
  server.accept();
  const env=ctx.env as Env;
  const started=Date.now();
  send(server,{type:'connected',service:'cloudflare-liquidity-api',mode:'REAL_DATA_ONLY',ts:started,sources:['solana-rpc','bsc-rpc','pump.fun/pumpswap']});

  const upstreams:WebSocket[]=[];
  const closeAll=()=>upstreams.forEach(x=>{try{x.close()}catch{}});
  const connect=(url:string|undefined,kind:'solana'|'bnb'|'pumpportal')=>{
    if(!url)return;
    try{
      const ws=new WebSocket(url); upstreams.push(ws);
      ws.addEventListener('open',()=>{
        if(kind==='solana'){
          Object.entries(SOLANA_PROGRAMS).forEach(([dex,program],i)=>ws.send(JSON.stringify({jsonrpc:'2.0',id:i+1,method:'logsSubscribe',params:[{mentions:[program]},{commitment:'confirmed'}]})));
        } else if(kind==='bnb') {
          ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_subscribe',params:['newHeads']}));
          ws.send(JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_subscribe',params:['logs',{}]}));
        } else if(kind==='pumpportal') {
          ws.send(JSON.stringify({method:'subscribeNewToken'}));
          ws.send(JSON.stringify({method:'subscribeMigration'}));
        }
        send(server,{type:'chain_status',chain:kind==='pumpportal'?'solana':kind,source:kind==='pumpportal'?'pumpportal':kind==='bnb'?'bsc-rpc':'solana-rpc',ts:Date.now()});
      });
      ws.addEventListener('message',(ev:any)=>{
        try{
          const raw=typeof ev.data==='string'?ev.data:new TextDecoder().decode(ev.data);
          const m=JSON.parse(raw);
          if(kind==='solana' && m.method==='logsNotification'){
            const value=m.params?.result?.value, logs=value?.logs||[];
            const hit=Object.entries(SOLANA_PROGRAMS).find(([,p])=>logs.some((l:string)=>l.includes(p)));
            send(server,{type:'log',chain:'solana',source:'solana-rpc',ts:Date.now(),txHash:value?.signature,slot:m.params?.result?.context?.slot,dex:hit?.[0],eventName:'program_log',raw:m});
          } else if(kind==='bnb' && m.method==='eth_subscription') {
            const e=m.params?.result;
            if(e?.number) send(server,{type:'block',chain:'bnb',source:'bsc-rpc',ts:Date.now(),blockNumber:parseInt(e.number,16),raw:e});
            else if(e) send(server,{type:'log',chain:'bnb',source:'bsc-rpc',ts:Date.now(),txHash:e.transactionHash,blockNumber:e.blockNumber?parseInt(e.blockNumber,16):undefined,pool:e.address,eventName:e.topics?.[0],raw:e});
          } else if(kind==='pumpportal') {
            const type=raw.includes('migration')||raw.includes('complete')?'migration':'token_create';
            send(server,{type,chain:'solana',source:'pump.fun/pumpswap',ts:Date.now(),dex:'pumpfun-pumpswap',raw:m,token:m.mint||m.token,creator:m.traderPublicKey||m.creator});
          }
        }catch{}
      });
      ws.addEventListener('close',()=>send(server,{type:'chain_status',chain:kind==='pumpportal'?'solana':kind,source:kind==='pumpportal'?'pumpportal':kind==='bnb'?'bsc-rpc':'solana-rpc',status:'OFFLINE',ts:Date.now()}));
    }catch{}
  };

  connect(env.SOLANA_WS_URL||'wss://api.mainnet-beta.solana.com','solana');
  connect(env.BNB_WS_URL,'bnb');
  connect(env.PUMPPORTAL_WS_URL||'wss://pumpportal.fun/api/data','pumpportal');
  server.addEventListener('close',closeAll);
  return new Response(null,{status:101,webSocket:client});
};
