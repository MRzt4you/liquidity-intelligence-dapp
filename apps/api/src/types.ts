export type Chain='solana'|'bnb';
export type NormalizedEvent={
 type:'token_create'|'trade'|'migration'|'block'|'log'|'chain_status'|'pool_create'|'liquidity';
 chain:Chain; source:string; ts:number; txHash?:string; slot?:number; blockNumber?:number;
 token?:string; token0?:string; token1?:string; symbol?:string; name?:string; wallet?:string;
 side?:'buy'|'sell'; amountUsd?:number; amountQuote?:number; amountToken?:number; liquidityUsd?:number;
 marketCapQuote?:number; pool?:string; dex?:string; dexKind?:string; feeTier?:number;
 reserves?:{reserve0:string;reserve1:string}; creator?:string; eventName?:string; raw?:unknown;
};
