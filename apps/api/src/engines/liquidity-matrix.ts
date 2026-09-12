export type Candle={t:number,o:number,h:number,l:number,c:number,v:number};
export function analyzeCandles(cs:Candle[]){
 const c=cs.slice(-100); if(c.length<5)return {trend:'UNKNOWN',atrPct:0,eqh:[],eql:[],fvg:[],sweeps:[]};
 const closes=c.map(x=>x.c); const ema=(n:number)=>{const a=2/(n+1);let e=closes[0];for(const p of closes.slice(1))e=p*a+e*(1-a);return e};
 const ef=ema(9), es=ema(21); const atr=c.slice(-14).reduce((s,x,i)=>{const prev=c[Math.max(0,c.length-15+i)].c;return s+Math.max(x.h-x.l,Math.abs(x.h-prev),Math.abs(x.l-prev))},0)/Math.min(14,c.length-1);
 const eqh:number[]=[],eql:number[]=[]; for(let i=2;i<c.length-2;i++){if(Math.abs(c[i].h-c[i-1].h)/c[i].h<.0015&&Math.abs(c[i].h-c[i+1].h)/c[i].h<.0015)eqh.push(c[i].h);if(Math.abs(c[i].l-c[i-1].l)/c[i].l<.0015&&Math.abs(c[i].l-c[i+1].l)/c[i].l<.0015)eql.push(c[i].l)}
 const fvg:any[]=[];for(let i=2;i<c.length;i++){if(c[i].l>c[i-2].h)fvg.push({side:'BULLISH',low:c[i-2].h,high:c[i].l});if(c[i].h<c[i-2].l)fvg.push({side:'BEARISH',low:c[i].h,high:c[i-2].l})}
 const sweeps:any[]=[];for(let i=1;i<c.length;i++){const prev=c[i-1];if(c[i].h>prev.h&&c[i].c<prev.h)sweeps.push({side:'HIGH',price:prev.h});if(c[i].l<prev.l&&c[i].c>prev.l)sweeps.push({side:'LOW',price:prev.l})}
 return {trend:ef>es?'BULLISH':'BEARISH',emaFast:ef,emaSlow:es,atrPct:atr/c.at(-1)!.c*100,eqh:egh(eqh),eql:egh(eql),fvg:fvg.slice(-8),sweeps:sweeps.slice(-8)};
}
function egh(a:number[]){return [...new Set(a.map(x=>Number(x.toFixed(10))))].slice(-8)}
