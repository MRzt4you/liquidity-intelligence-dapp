import { DEXES, json } from '../_utils';
export const onRequestGet = async (ctx:any) => json({mode:'REAL_DATA_ONLY',dataPolicy:'NO_DATA_NO_FALLBACK',eventCount:0,dexes:DEXES,cloudflare:true,bnbConfigured:Boolean(ctx.env.BNB_WS_URL)});
