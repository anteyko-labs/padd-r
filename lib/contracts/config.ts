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

export const PAD_TOKEN_ADDRESS = '0xAFD38DDaA3e7829693B7a80a029a00a61FFbeC08';
export const STAKE_MANAGER_ADDRESS = '0x330356f6ad6fe0977d85B42A2e538294A211a234';
export const NFT_FACTORY_ADDRESS = '0x3453a74D3EDE70cA317e6A29Bd04e82952B37050';
export const TIER_CALCULATOR_ADDRESS = '0xe9351C332C36BEecC61a216C42144E2Db5Fb21B7'; 