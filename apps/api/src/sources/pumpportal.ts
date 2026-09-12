import WebSocket from 'ws';
import { NormalizedEvent } from '../types';

type Callback=(x:NormalizedEvent)=>void;

export class PumpPortalAdapter {
 private cb:Callback; private ws?:WebSocket; private reconnectMs=1000;
 constructor(cb:Callback){this.cb=cb}
 start(){
  const base=process.env.PUMPPORTAL_WS_URL||'wss://pumpportal.fun/api/data';
  const key=process.env.PUMPPORTAL_API_KEY;
  const url=key ? `${base}${base.includes('?')?'&':'?'}api-key=${encodeURIComponent(key)}` : base;
  const connect=()=>{
   this.ws=new WebSocket(url);
   this.ws.on('open',()=>{
    this.reconnectMs=1000;
    this.ws?.send(JSON.stringify({method:'subscribeNewToken'}));
    this.ws?.send(JSON.stringify({method:'subscribeMigration'}));
    const tokens=(process.env.PUMPPORTAL_TOKEN_MINTS||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(key&&tokens.length)this.ws?.send(JSON.stringify({method:'subscribeTokenTrade',keys:tokens}));
    const accounts=(process.env.PUMPPORTAL_WALLETS||'').split(',').map(x=>x.trim()).filter(Boolean);
    if(key&&accounts.length)this.ws?.send(JSON.stringify({method:'subscribeAccountTrade',keys:accounts}));
    this.cb({type:'chain_status',chain:'solana',source:'pumpportal',ts:Date.now()});
   });
   this.ws.on('message',raw=>{try{
    const e=JSON.parse(raw.toString());
    const c:any={chain:'solana',source:'pump.fun/pumpswap',ts:Date.now(),txHash:e.signature,token:e.mint,wallet:e.traderPublicKey,raw:e};
    if(e.txType==='create')this.cb({...c,type:'token_create',name:e.name,symbol:e.symbol,creator:e.traderPublicKey,amountQuote:Number(e.initialBuy||0),marketCapQuote:Number(e.marketCapSol||0)});
    else if(e.txType==='buy'||e.txType==='sell')this.cb({...c,type:'trade',side:e.txType,amountQuote:Number(e.solAmount||0),amountToken:Number(e.tokenAmount||0),marketCapQuote:Number(e.marketCapSol||0)});
    else if(e.txType==='migrate'||e.txType==='complete'||e.pool==='pumpswap')this.cb({...c,type:'migration',dex:'pumpfun-pumpswap',dexKind:'bonding_curve',eventName:e.txType||'migration'});
   }catch{}});
   this.ws.on('close',()=>{setTimeout(connect,this.reconnectMs);this.reconnectMs=Math.min(this.reconnectMs*2,30000)});
   this.ws.on('error',()=>this.ws?.close());
  };connect();
 }
}
