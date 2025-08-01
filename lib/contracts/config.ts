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

// Обновленные адреса контрактов с поддержкой isInitialStakingNFT
export const PAD_TOKEN_ADDRESS = '0x073d23C46d11ae1FD00F15a8891C7848893951a5';
export const STAKE_MANAGER_ADDRESS = '0xcF01195B9DA94438453D57AD0BeADE3ff9F481A7';
export const NFT_FACTORY_ADDRESS = '0x486001b88DFa338C62ADA3174661B3640DB94e59';
export const TIER_CALCULATOR_ADDRESS = '0xd90536e41A6E289b28D85F3DF501334c4ddc076E';

// Красивые изображения NFT для каждого тира (из интернета)
export const NFT_IMAGES = {
  'Bronze': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
  'Silver': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
  'Gold': 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop&crop=center&auto=format&q=80',
  'Platinum': 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=400&h=400&fit=crop&crop=center&auto=format&q=80'
};

// Альтернативные изображения (более надежные)
export const NFT_IMAGES_FALLBACK = {
  'Bronze': 'https://picsum.photos/400/400?random=1',
  'Silver': 'https://picsum.photos/400/400?random=2', 
  'Gold': 'https://picsum.photos/400/400?random=3',
  'Platinum': 'https://picsum.photos/400/400?random=4'
}; 