import { sepolia, mainnet } from 'wagmi/chains';

// Конфигурация контрактов для разных сетей
export const CONTRACT_ADDRESSES = {
  [sepolia.id]: {
    PAD_TOKEN: '0x302DD01c00100A66a5aaE4a54918b9d2e90D0772',
    STAKE_MANAGER: '0x9dC20133682d37aB9604F3dd05BcA6aF541De459',
    NFT_FACTORY: '0xAfB6C38604f3d93226b0D1681499EfC279553aB9',
  },
  [mainnet.id]: {
    PAD_TOKEN: '',
    STAKE_MANAGER: '',
    NFT_FACTORY: '',
  },
} as const;

// Получить адрес контракта для текущей сети
export function getContractAddress(chainId: number, contractName: keyof typeof CONTRACT_ADDRESSES[typeof sepolia.id]) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.[contractName];
}

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
  lockDurationMonths: bigint;
  startTimestamp: bigint;
  tierLevel: number;
  monthIndex: bigint;
  nextMintOn: bigint;
}

// Тир уровни
export const TIER_LEVELS = {
  0: { name: 'Bronze', color: '#CD7F32', minDuration: 180 }, // 6 месяцев
  1: { name: 'Silver', color: '#C0C0C0', minDuration: 365 }, // 12 месяцев
  2: { name: 'Gold', color: '#FFD700', minDuration: 547 }, // 18 месяцев
  3: { name: 'Platinum', color: '#E5E4E2', minDuration: 912 }, // 30 месяцев
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
  const days = Number(seconds) / (24 * 60 * 60);
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = Math.floor(days % 365);
    return `${years}y ${remainingDays}d`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = Math.floor(days % 30);
    return `${months}m ${remainingDays}d`;
  } else {
    return `${Math.floor(days)}d`;
  }
}

// Форматирование даты
export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
} 