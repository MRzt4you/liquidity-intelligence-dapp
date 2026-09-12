import WebSocket from 'ws';
import { NormalizedEvent } from '../types';

const PAIR_CREATED='0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9';
const SWAP_V2='0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';
const MINT_V2='0x4c209b5fc8ad5078d2f4e1e4f3a1f5f3a8d7d2e1e7d2a0b6b7a1e8f2c4f5c1d1';
const BURN_V2='0xdccd412f0b125b2a3a6f0c5f3d6e7a8b9c0d1e2f3a4b5c6d7e8f90123456789';
const SYNC_V2='0x1c411e9a96e5d7e2f7f0e7c8f4f4e8e5e5b7e3a8d0e4e2e3f7b9c4f1c2d5a4';
const POOL_CREATED_V3='0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118';
const SWAP_V3='0x19b47279256b2a23a1665c810c8d55a1758940ee09377d4f8d26497a3577dc83';
const FLAP_TOKEN_CREATED='0x504e7f360b2e5fe33cbaaae4c593bc55305328341bf79009e43e0e3b7f699603';
const FLAP_BOUGHT='0xa800a2038683844fac66747f771bfdfae862eb28b16bcfa387afa9fbacce8ff7';
const FLAP_LAUNCHED='0x6e4f47630b8745b8cacbd44f42a8a33e7eea7cc08ef22fc7630f4f385784ff7d';

const V2_FACTORY='0xca143ce32fe78f1f7019d7d551a6402fc5350c73';
const V3_FACTORY='0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865';
const FLAP_PORTAL='0xe2ce6ab80874fa9fa2aae65d277dd6b8e65c9de0';

const word=(data:string,index:number)=>{
 const h=data.replace(/^0x/,''); return h.slice(index*64,(index+1)*64);
};
const addr=(topic:string)=>'0x'+topic.slice(-40);
const u256=(data:string,index:number)=>{try{return BigInt('0x'+word(data,index));}catch{return 0n}};
const num=(x:bigint)=>Number(x);

export class BnbAdapter {
 constructor(private cb:(x:NormalizedEvent)=>void){}
 start(){
  const url=process.env.BNB_WS_URL;
  if(!url)return;
  let delay=1000;
  const connect=()=>{
   const ws=new WebSocket(url);
   ws.on('open',()=>{
    delay=1000;
    ws.send(JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_subscribe',params:['newHeads']}));
    const addresses=[V2_FACTORY,V3_FACTORY,FLAP_PORTAL,...(process.env.BNB_LOG_ADDRESSES||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)];
    const topics=(process.env.BNB_LOG_TOPICS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
    const filter:any={address:[...new Set(addresses)]}; if(topics.length) filter.topics=[topics];
    ws.send(JSON.stringify({jsonrpc:'2.0',id:2,method:'eth_subscribe',params:['logs',filter]}));
    this.cb({type:'chain_status',chain:'bnb',source:'bsc-rpc',ts:Date.now()});
   });
   ws.on('message',raw=>{try{
    const m=JSON.parse(raw.toString()); if(m.method!=='eth_subscription')return;
    const e=m.params?.result;
    if(e?.number){this.cb({type:'block',chain:'bnb',source:'bsc-rpc',ts:Date.now(),blockNumber:parseInt(e.number,16),raw:e});return;}
    if(!e)return;
    const topic=(e.topics?.[0]||'').toLowerCase(); const emitter=(e.address||'').toLowerCase();
    const base:any={chain:'bnb',source:'bsc-rpc',ts:Date.now(),txHash:e.transactionHash,blockNumber:e.blockNumber?parseInt(e.blockNumber,16):undefined,pool:e.address,raw:e};

    if(emitter===V2_FACTORY && topic===PAIR_CREATED){
      this.cb({...base,type:'pool_create',dex:'pancakeswap-v2',dexKind:'v2',token0:addr(e.topics[1]),token1:addr(e.topics[2])}); return;
    }
    if(emitter===V3_FACTORY && topic===POOL_CREATED_V3){
      this.cb({...base,type:'pool_create',dex:'pancakeswap-v3',dexKind:'v3',token0:addr(e.topics[1]),token1:addr(e.topics[2]),feeTier:parseInt(e.topics[3],16),pool:'0x'+word(e.data,1)}); return;
    }
    if(emitter===FLAP_PORTAL && topic===FLAP_TOKEN_CREATED){
      this.cb({...base,type:'token_create',dex:'flap',dexKind:'bonding_curve',token:addr(e.topics[1])}); return;
    }
    if(emitter===FLAP_PORTAL && topic===FLAP_BOUGHT){
      const token='0x'+word(e.data,1); const buyer='0x'+word(e.data,2); const eth=u256(e.data,4);
      this.cb({...base,type:'trade',dex:'flap',dexKind:'bonding_curve',token,wallet:buyer,side:'buy',amountQuote:num(eth),amountToken:num(u256(e.data,3))}); return;
    }
    if(emitter===FLAP_PORTAL && topic===FLAP_LAUNCHED){
      this.cb({...base,type:'migration',dex:'flap',dexKind:'bonding_curve',token:'0x'+word(e.data,0),pool:'0x'+word(e.data,1),amountToken:num(u256(e.data,2)),amountQuote:num(u256(e.data,3)),eventName:'LaunchedToDEX'}); return;
    }
    if(topic===SWAP_V2){
      const amount0In=u256(e.data,0), amount1In=u256(e.data,1), amount0Out=u256(e.data,2), amount1Out=u256(e.data,3);
      const side=amount0In>0n||amount1In>0n?'swap_in':'swap_out';
      this.cb({...base,type:'trade',dex:'pancakeswap-v2',dexKind:'v2',wallet:addr(e.topics[1]),side:side==='swap_in'?'buy':'sell',amountQuote:num(amount0In+amount1In+amount0Out+amount1Out),amountToken:num(amount0Out+amount1Out)}); return;
    }
    if(topic===SWAP_V3){
      const amount0=BigInt('0x'+word(e.data,0)), amount1=BigInt('0x'+word(e.data,1));
      this.cb({...base,type:'trade',dex:'pancakeswap-v3',dexKind:'v3',wallet:addr(e.topics[1]),side:amount0>0n||amount1>0n?'buy':'sell',amountQuote:Math.abs(num(amount0))+Math.abs(num(amount1))}); return;
    }
    this.cb({...base,type:'log',dex:emitter===FLAP_PORTAL?'flap':emitter===V3_FACTORY?'pancakeswap-v3':emitter===V2_FACTORY?'pancakeswap-v2':undefined,eventName:topic});
   }catch{}});
   ws.on('close',()=>{setTimeout(connect,delay);delay=Math.min(delay*2,30000)}); ws.on('error',()=>ws.close());
  }; connect();
 }
}
