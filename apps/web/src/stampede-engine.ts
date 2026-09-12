export type StampedeTrade = {
  token: string;
  wallet: string;
  side: 'buy'|'sell';
  ts: number;
  txHash?: string;
  symbol?: string;
  amountQuote?: number;
  creator?: string;
};

export type Rotation = {
  wallet: string;
  sellToken: string;
  buyToken: string;
  sellTs: number;
  buyTs: number;
  gapS: number;
  sellTx?: string;
  buyTx?: string;
  grade: 'direct'|'clean'|'ambiguous';
};

const MAIN = new Set(['direct','clean']);
const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));

export function normalizeStampedeTrades(events:any[]): StampedeTrade[] {
  return events.filter(e=>e?.type==='trade' && e?.chain==='solana' && e?.source==='pump.fun/pumpswap' && (e?.side==='buy'||e?.side==='sell') && e?.token && (e?.creator||e?.wallet||e?.traderPublicKey)).map(e=>({
    token:String(e.token), wallet:String(e.wallet||e.creator||e.traderPublicKey), side:e.side, ts:Number(e.ts||Date.now()), txHash:e.txHash, symbol:e.symbol, amountQuote:Number(e.amountQuote||0)||undefined, creator:e.creator
  })).sort((a,b)=>a.ts-b.ts);
}

export function buildRotations(trades:StampedeTrade[], windowS=1800): Rotation[] {
  const byWallet=new Map<string,StampedeTrade[]>();
  for(const t of trades){const a=byWallet.get(t.wallet)||[];a.push(t);byWallet.set(t.wallet,a)}
  const out:Rotation[]=[];
  for(const [wallet,ts] of byWallet){
    ts.sort((a,b)=>a.ts-b.ts);
    for(let i=0;i<ts.length;i++){
      const buy=ts[i]; if(buy.side!=='buy') continue;
      const sells=ts.filter(s=>s.side==='sell'&&s.ts<=buy.ts&&s.ts>=buy.ts-windowS&&s.token!==buy.token);
      if(!sells.length) continue;
      const latest=new Map<string,StampedeTrade>(); for(const s of sells) latest.set(s.token,s);
      const candidates=[...latest.values()].sort((a,b)=>b.ts-a.ts);
      for(const s of candidates.slice(0,5)){
        const otherBuy=ts.some(x=>x.side==='buy'&&x.ts>s.ts&&x.ts<buy.ts&&x.token!==buy.token);
        const otherSell=ts.some(x=>x.side==='sell'&&x.ts>s.ts&&x.ts<buy.ts&&x.token!==s.token);
        const grade=s.txHash&&buy.txHash&&s.txHash===buy.txHash&&!otherSell?'direct':(!otherBuy&&!otherSell&&candidates.length===1?'clean':'ambiguous');
        out.push({wallet,sellToken:s.token,buyToken:buy.token,sellTs:s.ts,buyTs:buy.ts,gapS:Math.max(0,buy.ts-s.ts),sellTx:s.txHash,buyTx:buy.txHash,grade});
      }
    }
  }
  return out.sort((a,b)=>b.buyTs-a.buyTs);
}

export function radar(trades:StampedeTrade[], rotations:Rotation[], now=Date.now(), spanS=1800){
  const lo=now-spanS, r=rotations.filter(x=>x.buyTs>=lo&&x.buyTs<=now&&MAIN.has(x.grade));
  const by=new Map<string,{wallets:Set<string>,src:Set<string>,inflow:number,seq:number,last:number,first:number}>();
  for(const x of r){const row=by.get(x.buyToken)||{wallets:new Set(),src:new Set(),inflow:0,seq:0,last:x.buyTs,first:x.buyTs};row.wallets.add(x.wallet);row.src.add(x.sellToken);row.seq++;row.last=Math.max(row.last,x.buyTs);row.first=Math.min(row.first,x.buyTs);const b=trades.find(t=>t.wallet===x.wallet&&t.token===x.buyToken&&t.side==='buy'&&t.ts===x.buyTs);row.inflow+=Number(b?.amountQuote||0);by.set(x.buyToken,row)}
  const ten=now-600, prev=now-1200;
  return [...by.entries()].map(([token,d])=>{
    const recent=new Set(r.filter(x=>x.buyToken===token&&x.buyTs>ten).map(x=>x.wallet)).size;
    const previous=new Set(r.filter(x=>x.buyToken===token&&x.buyTs>prev&&x.buyTs<=ten).map(x=>x.wallet)).size;
    const accel=previous?recent/previous:(recent?recent:0);
    const breadth=d.src.size;
    const ageS=Math.max(0,Math.floor((now-d.first)/1000));
    const flowKnown=d.inflow>0;
    const score=100*clamp(.38*clamp(d.wallets.size/20)+.24*clamp(accel/4)+.16*clamp(breadth/8)+.12*(ageS<3600?1:ageS<14400?.6:.25)+.10*(flowKnown?1:.4));
    return {token,wallets:d.wallets.size,seq:d.seq,breadth,inflowQuote:d.inflow,acceleration:Number(accel.toFixed(2)),ageS,score:Number(score.toFixed(1)),evidenceKnown:flowKnown};
  }).sort((a,b)=>b.score-a.score||b.wallets-a.wallets);
}

export function flow(rotations:Rotation[], token:string, limit=100){
  const incoming=new Map<string,Set<string>>(), outgoing=new Map<string,Set<string>>();
  for(const r of rotations){if(!MAIN.has(r.grade))continue;if(r.buyToken===token){const s=incoming.get(r.sellToken)||new Set();s.add(r.wallet);incoming.set(r.sellToken,s)}if(r.sellToken===token){const s=outgoing.get(r.buyToken)||new Set();s.add(r.wallet);outgoing.set(r.buyToken,s)}}
  return {token,incoming:[...incoming].map(([from,w])=>({token:from,wallets:w.size})).sort((a,b)=>b.wallets-a.wallets).slice(0,limit),outgoing:[...outgoing].map(([to,w])=>({token:to,wallets:w.size})).sort((a,b)=>b.wallets-a.wallets).slice(0,limit)};
}

export function evidence(rotations:Rotation[], token?:string, limit=200){return rotations.filter(r=>MAIN.has(r.grade)&&(!token||r.buyToken===token||r.sellToken===token)).slice(0,limit).map(r=>({...r,observedOnly:true,claim:'Observed sell → buy order by the same wallet; this does not prove the sale funded the purchase.'}))}
