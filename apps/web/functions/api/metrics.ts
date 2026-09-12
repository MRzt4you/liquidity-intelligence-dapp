import { json } from '../_utils';
export const onRequestGet = async (ctx:any) => json({
  mode:'REAL_DATA_ONLY', dataPolicy:'NO_DATA_NO_FALLBACK',
  solanaEvents:0,bnbEvents:0,pumpEvents:0,latencyMs:0,
  sources:{solana:'READY',bnb:ctx.env.BNB_WS_URL?'READY':'NOT_CONFIGURED',pumpportal:'READY'},
  dexEvents:{}
});
