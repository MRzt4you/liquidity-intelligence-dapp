export type MarketSnapshot = {
  price:number; emaFast?:number; emaSlow?:number; atrPct?:number;
  volume?:number; volumeBaseline?:number; liquidityUsd?:number; liquidityDeltaPct?:number;
  smartFlowUsd?:number; whaleFlowUsd?:number; buys?:number; sells?:number;
  holderConcentrationPct?:number; tokenAgeSec?:number; risk?:'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  sweep?:'HIGH'|'LOW'; bos?:'BULLISH'|'BEARISH'|'NONE'; fvg?:'BULLISH'|'BEARISH'|'NONE';
};
export function intelligence(s:MarketSnapshot){
  let score=50; const reasons:string[]=[]; const risks:string[]=[];
  const volRatio=(s.volumeBaseline&&s.volumeBaseline>0)?(s.volume||0)/s.volumeBaseline:1;
  if(s.emaFast&&s.emaSlow){ if(s.emaFast>s.emaSlow){score+=12;reasons.push('TREND_UP')}else{score-=12;reasons.push('TREND_DOWN')} }
  if(volRatio>=2){score+=10;reasons.push('VOLUME_ACCELERATION')}
  if((s.smartFlowUsd||0)>0){score+=10;reasons.push('SMART_MONEY_INFLOW')} else if((s.smartFlowUsd||0)<0){score-=10;reasons.push('SMART_MONEY_OUTFLOW')}
  if((s.whaleFlowUsd||0)>0){score+=6;reasons.push('WHALE_INFLOW')}
  if((s.buys||0)>(s.sells||0)*1.25){score+=7;reasons.push('BUY_IMBALANCE')} else if((s.sells||0)>(s.buys||0)*1.25){score-=7;reasons.push('SELL_IMBALANCE')}
  if(s.bos==='BULLISH') {score+=8;reasons.push('BOS_BULLISH')} if(s.bos==='BEARISH'){score-=8;reasons.push('BOS_BEARISH')}
  if(s.fvg==='BULLISH') {score+=4;reasons.push('FVG_SUPPORT')} if(s.fvg==='BEARISH'){score-=4;reasons.push('FVG_RESISTANCE')}
  if(s.sweep==='HIGH'){score+=3;reasons.push('LIQUIDITY_SWEEP')}
  if((s.liquidityDeltaPct||0)<-15){score-=18;risks.push('LIQUIDITY_REMOVAL')}
  if((s.liquidityUsd||0)<10000){score-=12;risks.push('LOW_LIQUIDITY')}
  if((s.holderConcentrationPct||0)>35){score-=12;risks.push('CONCENTRATED_HOLDERS')}
  if(s.risk==='CRITICAL'){score-=35;risks.push('CRITICAL_CONTRACT_RISK')} else if(s.risk==='HIGH'){score-=20;risks.push('HIGH_CONTRACT_RISK')}
  score=Math.max(0,Math.min(100,Math.round(score)));
  const state=score>=80&&risks.length===0?'STRONG_BUY':score>=68?'BUY_WATCH':score>=48?'NEUTRAL':'RISK_OFF';
  return {score,state,reasons,riskFlags:risks,volRatio:Math.round(volRatio*100)/100};
}
