import { sepolia, mainnet } from 'wagmi/chains';

// Типы для позиций стейкинга
export interface StakingPosition {
  id: number;
  amount: bigint;
  startTime: bigint;
  duration: bigint;
  nextMintAt: bigint;
  tier: bigint;
  monthIndex: bigint;
  isActive: boolean;
  owner: string;
  rewards?: bigint;
}

// Типы для NFT метаданных
export interface NFTMetadata {
  positionId: bigint;
  amountStaked: bigint;
  lockDurationHours: bigint;
  startTimestamp: bigint;
  tierLevel: number;
  hourIndex: bigint;
  nextMintOn: bigint;
}

// Новый TIER_LEVELS для часов
export const TIER_LEVELS = {
  0: { name: 'Bronze', color: '#CD7F32', minDuration: 1 },   // 1 час
  1: { name: 'Silver', color: '#C0C0C0', minDuration: 4 },   // 4 часа
  2: { name: 'Gold', color: '#FFD700', minDuration: 7 },     // 7 часов
  3: { name: 'Platinum', color: '#E5E4E2', minDuration: 9 }, // 9 часов
} as const;

// Форматирование чисел
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  return `${whole}.${trimmedFraction}`;
}

// Форматирование времени
export function formatDuration(seconds: bigint): string {
  const h = Math.floor(Number(seconds) / 3600);
  const m = Math.floor((Number(seconds) % 3600) / 60);
  let res = '';
  if (h > 0) res += `${h} hour${h > 1 ? 's' : ''} `;
  if (m > 0) res += `${m} minute${m > 1 ? 's' : ''}`;
  return res.trim() || '0 minutes';
}

// Форматирование даты
export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
}

export const PAD_TOKEN_ADDRESS = '0x5e36c2e6a50712d09Ea714a356923514B4C2338e';
export const STAKE_MANAGER_ADDRESS = '0xC54E3B95EC87F4a1E85860E81b4864ac059E1dDf';
export const NFT_FACTORY_ADDRESS = '0xDBE1483fE39b26a92FE4B7cc3923c0cc9Ad50237';
export const TIER_CALCULATOR_ADDRESS = '0xB6DB11203d75C39a7D79cE7a545Ce6b7ce3D12a6'; 