export const DEXES = [
  { id:'pancakeswap-v2', name:'PancakeSwap V2', chain:'bnb', kind:'v2' },
  { id:'pancakeswap-v3', name:'PancakeSwap V3', chain:'bnb', kind:'v3' },
  { id:'flap', name:'Flap.sh', chain:'bnb', kind:'bonding_curve' },
  { id:'raydium-amm', name:'Raydium AMM', chain:'solana', kind:'v2' },
  { id:'raydium-cpmm', name:'Raydium CPMM', chain:'solana', kind:'v2' },
  { id:'raydium-clmm', name:'Raydium CLMM', chain:'solana', kind:'v3' },
  { id:'orca-whirlpool', name:'Orca Whirlpools', chain:'solana', kind:'v3' },
  { id:'meteora-dlmm', name:'Meteora DLMM', chain:'solana', kind:'v3' },
  { id:'meteora-damm', name:'Meteora DAMM', chain:'solana', kind:'v2' },
  { id:'pumpfun-pumpswap', name:'Pump.fun / PumpSwap', chain:'solana', kind:'bonding_curve' },
  { id:'jupiter', name:'Jupiter', chain:'solana', kind:'aggregator' }
] as const;

export const SOLANA_PROGRAMS: Record<string,string> = {
  'raydium-amm':'675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  'raydium-cpmm':'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  'raydium-clmm':'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  'orca-whirlpool':'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  'meteora-dlmm':'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  'meteora-damm':'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB'
};

export const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
