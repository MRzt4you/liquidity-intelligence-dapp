export type Position={id:string;token:string;side:'LONG';entry:number;sizeUsd:number;high:number;stop:number;tp:number;tp2:number;tp3:number;trailStop:number;status:'OPEN'|'CLOSED';pnlPct:number;realizedUsd:number;createdAt:number;reason?:string;partialPct:number};
export function newPosition(id:string,token:string,entry:number,sizeUsd:number):Position{return{id,token,side:'LONG',entry,sizeUsd,high:entry,stop:entry*.94,tp:entry*1.06,tp2:entry*1.10,tp3:entry*1.16,trailStop:entry*.94,status:'OPEN',pnlPct:0,realizedUsd:0,createdAt:Date.now(),partialPct:0}}
export function updateAdaptiveTP(p:Position,m:any){const price=Number(m.price||p.entry);p.high=Math.max(p.high,price);p.pnlPct=(price/p.entry-1)*100;const atr=Math.max(.001,Number(m.atrPct||6))/100;const smart=Number(m.smartFlowUsd||0),liq=Number(m.liquidityDeltaPct||0),mom=Number(m.momentum||0),risk=String(m.risk||'LOW');
 const strength=Math.max(0,Math.min(1,(Number(m.score||50)-50)/50));
 if(p.pnlPct>3){const ext=Math.max(p.tp,p.entry*(1+Math.min(.30,.06+atr*(1.8+strength))));p.tp=ext;p.tp2=Math.max(p.tp2,p.entry*(1+Math.min(.45,.10+atr*(2.4+strength))));p.tp3=Math.max(p.tp3,p.entry*(1+Math.min(.70,.16+atr*(3.5+strength))));}
 const trail=Math.max(p.entry*.94,p.high*(1-Math.max(.025,atr*(risk==='HIGH'||risk==='CRITICAL'?1.2:1.8)))); if(p.pnlPct>2)p.trailStop=Math.max(p.trailStop,trail);
 if(p.pnlPct>3&&(mom<0||liq<-12||risk==='HIGH'||risk==='CRITICAL'))p.stop=Math.max(p.stop,p.entry*1.005); if(p.pnlPct>8&&smart>0)p.stop=Math.max(p.stop,p.entry*(1+.03)); p.stop=Math.max(p.stop,p.trailStop,p.entry*.94);
 let action:string|undefined;if(price>=p.tp3)action='TP3';else if(price>=p.tp2)action='TP2';else if(price>=p.tp)action='TP1';else if(price<=p.stop)action='STOP';
 return{position:p,action};}
