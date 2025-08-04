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

// Конфигурация ваучеров по tiers
export interface Voucher {
  id: string;
  name: string;
  description: string;
  type: 'one-time' | 'reusable';
  category: 'car-rental' | 'restaurant' | 'car-service' | 'exclusive';
  value: string;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: string;
  tierRequired: number;
}

export const VOUCHERS_CONFIG: Voucher[] = [
  // Car Rental Vouchers
  {
    id: 'car-discount-5',
    name: 'Скидка 5% при оплате аренды авто PADD-R',
    description: 'Скидка на все автомобили PADD-R',
    type: 'reusable',
    category: 'car-rental',
    value: '5%',
    isUsed: false,
    tierRequired: 1
  },
  {
    id: 'free-hours-1',
    name: 'Бесплатные часы аренды',
    description: 'При аренде от 1 дня',
    type: 'reusable',
    category: 'car-rental',
    value: '1 час',
    isUsed: false,
    tierRequired: 1
  },
  {
    id: 'free-hours-2',
    name: 'Бесплатные часы аренды',
    description: 'При аренде от 1 дня',
    type: 'reusable',
    category: 'car-rental',
    value: '2 часа',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'free-hours-3',
    name: 'Бесплатные часы аренды',
    description: 'При аренде от 1 дня',
    type: 'reusable',
    category: 'car-rental',
    value: '3 часа',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'free-hours-4',
    name: 'Бесплатные часы аренды',
    description: 'При аренде от 1 дня',
    type: 'reusable',
    category: 'car-rental',
    value: '5 часов',
    isUsed: false,
    tierRequired: 4
  },
  {
    id: 'coupon-50',
    name: 'Купон на аренду авто',
    description: '25% стоимости',
    type: 'one-time',
    category: 'car-rental',
    value: '50$',
    isUsed: false,
    tierRequired: 1
  },
  {
    id: 'coupon-150',
    name: 'Купон на аренду авто',
    description: '25% стоимости',
    type: 'one-time',
    category: 'car-rental',
    value: '150$',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'coupon-600',
    name: 'Купон на аренду авто',
    description: '25% стоимости',
    type: 'one-time',
    category: 'car-rental',
    value: '600$',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'coupon-1250',
    name: 'Купон на аренду авто',
    description: '25% стоимости',
    type: 'one-time',
    category: 'car-rental',
    value: '1250$',
    isUsed: false,
    tierRequired: 4
  },

  // Car Service Vouchers
  {
    id: 'car-service-10',
    name: 'Скидка в автосервисе',
    description: 'На все услуги автосервиса',
    type: 'reusable',
    category: 'car-service',
    value: '10%',
    isUsed: false,
    tierRequired: 1
  },
  {
    id: 'car-service-15',
    name: 'Скидка в автосервисе',
    description: 'На все услуги автосервиса',
    type: 'reusable',
    category: 'car-service',
    value: '15%',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'car-service-20',
    name: 'Скидка в автосервисе',
    description: 'На все услуги автосервиса',
    type: 'reusable',
    category: 'car-service',
    value: '20%',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'car-service-30',
    name: 'Скидка в автосервисе',
    description: 'На все услуги автосервиса',
    type: 'reusable',
    category: 'car-service',
    value: '30%',
    isUsed: false,
    tierRequired: 4
  },

  // Restaurant Vouchers
  {
    id: 'restaurant-5',
    name: 'Скидка в ресторане',
    description: 'На все блюда и напитки',
    type: 'reusable',
    category: 'restaurant',
    value: '5%',
    isUsed: false,
    tierRequired: 1
  },
  {
    id: 'restaurant-10',
    name: 'Скидка в ресторане',
    description: 'На все блюда и напитки',
    type: 'reusable',
    category: 'restaurant',
    value: '10%',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'restaurant-15',
    name: 'Скидка в ресторане',
    description: 'На все блюда и напитки',
    type: 'reusable',
    category: 'restaurant',
    value: '15%',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'restaurant-20',
    name: 'Скидка в ресторане',
    description: 'На все блюда и напитки',
    type: 'reusable',
    category: 'restaurant',
    value: '20%',
    isUsed: false,
    tierRequired: 4
  },

  // Premium Services
  {
    id: 'car-wash',
    name: 'Мойка автомобилей',
    description: 'Бесплатная мойка',
    type: 'reusable',
    category: 'car-service',
    value: 'Бесплатно',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'unlimited-mileage',
    name: 'Безлимитный километраж',
    description: 'Без ограничений по пробегу',
    type: 'reusable',
    category: 'car-rental',
    value: 'Безлимит',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'premium-protection',
    name: 'Премиум защита',
    description: 'Расширенная страховка',
    type: 'reusable',
    category: 'car-rental',
    value: 'Включено',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'priority-booking',
    name: 'Приоритетное бронирование',
    description: 'Бронирование без очереди',
    type: 'reusable',
    category: 'car-rental',
    value: 'Приоритет',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'car-upgrade',
    name: 'Апгрейд авто',
    description: 'Бесплатный апгрейд класса',
    type: 'reusable',
    category: 'car-rental',
    value: 'Апгрейд',
    isUsed: false,
    tierRequired: 2
  },

  // Exclusive Services
  {
    id: 'chauffeur-service',
    name: 'Шафер-сервис',
    description: 'Персональный водитель',
    type: 'one-time',
    category: 'exclusive',
    value: '6 часов',
    isUsed: false,
    tierRequired: 4
  },
  {
    id: 'free-delivery-uae',
    name: 'Бесплатная доставка по ОАЭ',
    description: 'Доставка автомобиля в любую точку ОАЭ',
    type: 'reusable',
    category: 'car-rental',
    value: 'Бесплатно',
    isUsed: false,
    tierRequired: 4
  },
  {
    id: 'lamborghini-huracan',
    name: '1 день аренды Lamborghini Huracán EVO',
    description: 'Эксклюзивная аренда суперкара',
    type: 'one-time',
    category: 'exclusive',
    value: '1 день',
    isUsed: false,
    tierRequired: 2
  },
  {
    id: 'weekend-5star',
    name: 'Уикенд с авто и проживанием в отеле 5★',
    description: 'Люкс-уикенд в пятизвездочном отеле',
    type: 'one-time',
    category: 'exclusive',
    value: 'Уикенд',
    isUsed: false,
    tierRequired: 3
  },
  {
    id: 'yacht-tour',
    name: 'Выезд на яхте или приватный тур по Эмиратам',
    description: 'Эксклюзивный тур на яхте',
    type: 'one-time',
    category: 'exclusive',
    value: 'Тур',
    isUsed: false,
    tierRequired: 4
  }
];

// Функция для получения ваучеров по tier
export function getVouchersByTier(tierLevel: number): Voucher[] {
  return VOUCHERS_CONFIG.filter(voucher => voucher.tierRequired <= tierLevel);
}

// Функция для получения ваучеров по категории
export function getVouchersByCategory(category: string, tierLevel: number): Voucher[] {
  return VOUCHERS_CONFIG.filter(voucher => 
    voucher.category === category && voucher.tierRequired <= tierLevel
  );
} 