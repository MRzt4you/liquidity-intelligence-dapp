export type DexDefinition = {
  id: string;
  name: string;
  chain: 'bnb' | 'solana';
  kind: 'v2' | 'v3' | 'bonding_curve' | 'aggregator';
  factory?: string;
  router?: string;
  notes?: string;
};

export const DEX_REGISTRY: DexDefinition[] = [
  { id: 'pancakeswap-v2', name: 'PancakeSwap V2', chain: 'bnb', kind: 'v2', factory: '0xca143ce32fe78f1f7019d7d551a6402fc5350c73', router: '0x10ed43c718714eb63d5aa57b78b54704e256024e' },
  { id: 'pancakeswap-v3', name: 'PancakeSwap V3', chain: 'bnb', kind: 'v3', factory: '0x0bfbcf9fa4f9c56b0f40a671ad40e0805a091865', router: '0x1b81d678ffb9c0263b24a97847620c99d213eb14' },
  { id: 'flap', name: 'Flap.sh', chain: 'bnb', kind: 'bonding_curve', factory: '0xe2ce6ab80874fa9fa2aae65d277dd6b8e65c9de0', notes: 'Flap Portal bonding curve; BNB mainnet chainId 56.' },
  { id: 'pumpfun-pumpswap', name: 'Pump.fun / PumpSwap', chain: 'solana', kind: 'bonding_curve', notes: 'PumpPortal read-only stream; migration is tracked when supplied by the stream.' },
  { id: 'jupiter', name: 'Jupiter', chain: 'solana', kind: 'aggregator', notes: 'Routing/quote layer; underlying venue remains the execution venue.' },
];

export const DEX_BY_ADDRESS = new Map(
  DEX_REGISTRY.filter((x) => x.factory).map((x) => [x.factory!.toLowerCase(), x]),
);

export function dexForAddress(address?: string) {
  return address ? DEX_BY_ADDRESS.get(address.toLowerCase()) : undefined;
}
