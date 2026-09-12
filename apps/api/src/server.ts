import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { SignalEngine } from './engines/signal';
import { SolanaAdapter } from './chains/solana';
import { BnbAdapter } from './chains/bnb';
import { PumpPortalAdapter } from './sources/pumpportal';
import { DEX_REGISTRY } from './dex/registry';

const app = Fastify({ logger: true });
const signal = new SignalEngine();
const startedAt = Date.now();
const events: any[] = [];
const metrics:any = {solanaEvents:0,bnbEvents:0,pumpEvents:0,startedAt,latencyMs:0,sources:{solana:'STARTING',bnb:'STARTING',pumpportal:'STARTING'},dexEvents:{}};

async function main(){
 await app.register(cors,{origin:true});
 app.get('/health',async()=>({ok:true,service:'liquidity-api',mode:'REAL_DATA_ONLY',uptimeSec:Math.floor((Date.now()-startedAt)/1000)}));
 app.get('/api/status',async()=>({mode:'REAL_DATA_ONLY',dataPolicy:'NO_DATA_NO_FALLBACK',metrics,eventCount:events.length,dexes:DEX_REGISTRY}));
 app.get('/api/dex',async()=>DEX_REGISTRY);
 app.get('/api/signals',async()=>signal.recent());
 app.get('/api/events',async()=>events.slice(0,200));
 app.get('/api/metrics',async()=>({...metrics,mode:'REAL_DATA_ONLY'}));
 const server=await app.listen({port:Number(process.env.API_PORT||4000),host:'0.0.0.0'});
 const wss=new WebSocketServer({server:app.server});
 const broadcast=(event:any)=>{
  metrics.latencyMs=Math.max(0,Date.now()-(event.ts||Date.now()));
  if(event.chain==='solana')metrics.solanaEvents++; if(event.chain==='bnb')metrics.bnbEvents++;
  if(event.source==='pump.fun/pumpswap')metrics.pumpEvents++;
  if(event.type==='chain_status'&&event.chain==='solana')metrics.sources.solana='LIVE';
  if(event.type==='chain_status'&&event.chain==='bnb')metrics.sources.bnb='LIVE';
  if(event.type==='chain_status'&&event.source==='pumpportal')metrics.sources.pumpportal='LIVE';
  if(event.dex)metrics.dexEvents[event.dex]=(metrics.dexEvents[event.dex]||0)+1;
  events.unshift(event);events.splice(200);
  if((event.type==='trade'||event.type==='token_create')&&Number(event.amountQuote||0)>0){
   const volume=Number(event.amountQuote||0);
   const signalResult=signal.score({volume,volumeBaseline:1,smartFlowUsd:event.side==='buy'?volume:-volume,buys:event.side==='buy'?1:0,sells:event.side==='sell'?1:0,tokenAgeSec:event.type==='token_create'?0:100,liquidityUsd:Number(event.liquidityUsd||0)});
   event.signal=signalResult;signal.push(event);
  }
  const data=JSON.stringify(event);wss.clients.forEach(c=>{if(c.readyState===1)c.send(data)});
 };
 wss.on('connection',ws=>ws.send(JSON.stringify({type:'connected',service:'liquidity-api',mode:'REAL_DATA_ONLY',ts:Date.now(),sources:['solana-rpc','bsc-rpc','pump.fun/pumpswap'],dexes:DEX_REGISTRY.map(x=>x.id)})));
 new SolanaAdapter(broadcast).start(); new BnbAdapter(broadcast).start(); new PumpPortalAdapter(broadcast).start();
 app.log.info(`REAL DATA API listening at ${server}`);
}
main().catch(error=>{app.log.error(error);process.exit(1)});
