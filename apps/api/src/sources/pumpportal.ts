import WebSocket from 'ws';
import { NormalizedEvent } from '../types';
type Callback=(x:NormalizedEvent)=>void;
export class PumpPortalAdapter {
 private cb:Callback; private ws?:WebSocket; private reconnectMs=1000;
 constructor(cb:Callback){this.cb=cb}
 start(){const url=process.env.PUMPPORTAL_WS_URL||'wss://pumpportal.fun/api/data'; const connect=()=>{
  this.ws=new WebSocket(url);
  this.ws.on('open',()=>{this.reconnectMs=1000; this.ws?.send(JSON.stringify({method:'subscribeNewToken'})); this.cb({type:'chain_status',chain:'solana',source:'pumpportal',ts:Date.now()})});
  this.ws.on('message',raw=>{try{const e=JSON.parse(raw.toString());const c={chain:'solana' as const,source:'pump.fun/pumpswap',ts:Date.now(),txHash:e.signature,token:e.mint,wallet:e.traderPublicKey,raw:e};
   if(e.txType==='create')this.cb({...c,type:'token_create',name:e.name,symbol:e.symbol,amountQuote:Number(e.initialBuy||0),marketCapQuote:Number(e.marketCapSol||0)});
   else if(e.txType==='buy'||e.txType==='sell')this.cb({...c,type:'trade',side:e.txType,amountQuote:Number(e.solAmount||0),marketCapQuote:Number(e.marketCapSol||0)});
   else if(e.txType==='migrate'||e.txType==='complete')this.cb({...c,type:'migration'});
  }catch{}});
  this.ws.on('close',()=>{setTimeout(connect,this.reconnectMs);this.reconnectMs=Math.min(this.reconnectMs*2,30000)});
  this.ws.on('error',()=>this.ws?.close());
 }; connect()}
}
