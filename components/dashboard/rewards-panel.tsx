'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Download, ExternalLink, QrCode, Eye, Star, Clock, Trophy } from 'lucide-react';
import { useNFTBalanceFromEvents } from '@/hooks/useNFTBalanceFromEvents';
import { useStakingPositions } from '@/hooks/useStakingPositions';
import { TIER_LEVELS } from '@/lib/contracts/config';
import { useEffect, useState, useContext } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import { NFT_FACTORY_ADDRESS } from '@/lib/contracts/config';
import { DashboardDataContext } from './layout';
import { motion } from "framer-motion";
import type { StakingPosition } from '@/lib/contracts/config';
import { NFTModal } from './nft-modal';
import { VoucherModal } from './voucher-modal';
import { Voucher, getVouchersByTier } from '@/lib/contracts/config';
import { useAccount } from 'wagmi';

// Тип для NFT (расширенный)
export type DashboardNFT = {
  tokenId: number;
  positionId: bigint;
  amountStaked: bigint;
  lockDurationMonths: bigint;
  startTimestamp: bigint;
  tierLevel: number;
  monthIndex: bigint;
  nextMintOn: bigint;
  formattedAmountStaked: string;
  formattedStartDate: string;
  formattedNextMintDate: string;
  tierInfo: any;
  isTransferable: boolean;
  daysUntilNextMint: number;
  // дополнительные поля, которые могут быть добавлены в процессе работы
  used?: boolean;
  owner?: string;
  currentUser?: string;
  image?: string;
  isInitialStakingNFT?: boolean;
};

export type DashboardPosition = StakingPosition & {
  formattedNextMintDate?: string;
  formattedRewards?: string;
};

export function RewardsPanel() {
  const { address } = useAccount();
  const { nftBalance, stakingPositions } = useContext(DashboardDataContext);
  const {
    nfts = [],
    isLoading: isLoadingNFTs,
    totalNFTs = 0,
    transferableNFTs = 0,
    currentTier,
    refetch,
  } = nftBalance;
  
  console.log('RewardsPanel render:', { nfts, isLoadingNFTs, totalNFTs, nftBalance });
  const {
    positions = [],
    isLoading: isLoadingPositions,
    totalRewards = 0,
  } = stakingPositions;
  const [filter, setFilter] = useState<'active' | 'expired' | 'used' | 'transferred'>('active');
  const [selectedNFT, setSelectedNFT] = useState<DashboardNFT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
  const [vouchersLoading, setVouchersLoading] = useState(false);

  // Слушаем событие NFTMinted
  useEffect(() => {
    // Для подписки на события используем публичный RPC из .env
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/9c259df705904ba5b2cbd4a10d00e7df';
    const rpcProvider = new JsonRpcProvider(rpcUrl);
    const nftAddress = NFT_FACTORY_ADDRESS;
    if (!nftAddress) return;
    const abi = [
      'event NFTMinted(address indexed to, uint256 indexed tokenId, tuple(uint256,uint256,uint256,uint256,uint8,uint256,uint256) meta)'
    ];
    const contract = new Contract(nftAddress, abi, rpcProvider);
    const handler = () => refetch && refetch();
    contract.on('NFTMinted', handler);
    return () => { contract.off('NFTMinted', handler); };
  }, [refetch]);

  // Функция для вычисления статуса NFT
  function getNFTStatus(nft: DashboardNFT) {
    // Упрощенная логика: все NFT показываем как активные
    // Пока NFT не переведены, они остаются активными
    if (nft.owner && nft.owner !== nft.currentUser) return 'transferred';
    return 'active';
  }

  // Фильтруем NFT по выбранному статусу
  const filteredNFTs = nfts.filter((nft: DashboardNFT) => getNFTStatus(nft) === filter);

  // Генерируем NFT карточки на основе реальных данных
  const generateNFTCards = () => {
    console.log('generateNFTCards called:', { isLoadingNFTs, nftsLength: filteredNFTs.length, filteredNFTs });
    
    if (isLoadingNFTs) {
      return <div className="text-center py-8 text-gray-400">Loading NFTs...</div>;
    }
    if (filteredNFTs.length === 0) {
      return <div className="text-center py-8 text-gray-400">No NFTs with selected filter</div>;
    }
    return filteredNFTs.map((nft: any, index: number) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, boxShadow: '0 4px 32px #00ffb2' }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.5, delay: index * 0.1, type: 'spring', stiffness: 300 }}
      >
        <Card 
          className="bg-gray-900/50 border-gray-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer overflow-hidden card-hover"
          onClick={() => {
            console.log('NFT card clicked:', nft);
            setSelectedNFT(nft);
            setIsModalOpen(true);
          }}
        >
          <div className="relative group">
            <img 
              src={nft.image || '/placeholder-nft.svg'} 
              alt={nft.tierInfo?.name} 
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-nft.svg';
              }}
            />
            
            {/* Overlay with action buttons */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNFT(nft);
                    setIsModalOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-4 right-4">
              <Badge className={`${
                nft.tierInfo?.name === 'Platinum' ? 'bg-emerald-600' :
                nft.tierInfo?.name === 'Gold' ? 'bg-yellow-600' :
                nft.tierInfo?.name === 'Silver' ? 'bg-gray-600' : 'bg-amber-600'
              } text-white`}>
                {nft.tierInfo?.name}
              </Badge>
            </div>
            {nft.isInitialStakingNFT && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-blue-600 text-white">
                  Initial
                </Badge>
              </div>
            )}
          </div>
          
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white flex items-center justify-between">
              <span>{nft.tierInfo?.name} NFT #{nft.tokenId}</span>
              <Download className="w-4 h-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Staked:</span>
                <div className="text-emerald-400 font-semibold">{nft.formattedAmountStaked} PAD</div>
              </div>
              <div>
                <span className="text-gray-400">Started:</span>
                <div className="text-white">{nft.formattedStartDate}</div>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <div className="text-white">{nft.isInitialStakingNFT ? 'Initial' : 'Monthly'}</div>
              </div>
              <div>
                <span className="text-gray-400">Next:</span>
                <div className="text-white">{nft.formattedNextMintDate}</div>
              </div>
            </div>
            
            {/* Action hint */}
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
              Click to view details and import to wallet
            </div>
          </CardContent>
        </Card>
      </motion.div>
    ));
  };

  // Загружаем ваучеры пользователя
  useEffect(() => {
    async function fetchUserVouchers() {
      if (!address) return;
      
      setVouchersLoading(true);
      try {
        const maxTier = nfts.length > 0 ? Math.max(...nfts.map((nft: DashboardNFT) => nft.tierLevel)) : 1;
        const response = await fetch(`/api/vouchers?userId=${address}&tierLevel=${maxTier}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserVouchers(data.vouchers || []);
        } else {
          // Если API недоступен, используем локальные ваучеры
          const localVouchers = getVouchersByTier(maxTier);
          setUserVouchers(localVouchers);
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
        // Fallback к локальным ваучерам
        const maxTier = nfts.length > 0 ? Math.max(...nfts.map((nft: DashboardNFT) => nft.tierLevel)) : 1;
        const localVouchers = getVouchersByTier(maxTier);
        setUserVouchers(localVouchers);
      } finally {
        setVouchersLoading(false);
      }
    }

    fetchUserVouchers();
  }, [address, nfts]);

  // Динамические ваучеры на основе NFT пользователя
  const vouchers = userVouchers.map((voucher: Voucher) => ({
    title: voucher.name,
    description: voucher.description,
    validUntil: 'Активен',
    status: voucher.isUsed ? 'Used' as const : 'Active' as const,
    qrCode: true,
    voucher: voucher
  }));

  // Динамическая история наград
  const rewardHistory = [
    // NFT события
    ...nfts.map((nft: DashboardNFT) => ({
      date: nft.formattedStartDate,
      reward: `${nft.tierInfo?.name} NFT`,
      type: 'NFT',
      status: 'Received' as const,
    })),
    // Токеновые награды по позициям
    ...positions
      .filter((pos: DashboardPosition) => !!pos && Number(pos.rewards) > 0)
      .map((pos: DashboardPosition) => {
        const safePos = pos as DashboardPosition;
        return {
          date: safePos.formattedNextMintDate,
          reward: `${safePos.formattedRewards} PAD Rewards`,
          type: 'Token',
          status: 'Earned' as const,
        };
      }),
  ];

  function formatDuration(seconds: number) {
    if (!seconds || seconds <= 0) return '0 minutes';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    let res = '';
    if (h > 0) res += `${h} hour${h > 1 ? 's' : ''} `;
    if (m > 0) res += `${m} minute${m > 1 ? 's' : ''}`;
    return res.trim();
  }

  return (
            <div className="space-y-8">
          {/* Фильтр по статусу */}
      <div className="flex gap-2 mb-4">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Button
            variant="ghost"
            size="sm"
            className={`transition-colors rounded-full px-4 py-2 font-semibold border-2
              ${filter === 'active' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-transparent border-emerald-800 text-emerald-400 hover:bg-emerald-900/20'}
            `}
            onClick={() => setFilter('active')}
          >
            Актуальные
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Button
            variant="ghost"
            size="sm"
            className={`transition-colors rounded-full px-4 py-2 font-semibold border-2
              ${filter === 'used' ? 'bg-gray-600 text-white border-gray-600 shadow-lg' : 'bg-transparent border-gray-800 text-gray-400 hover:bg-gray-900/20'}
            `}
            onClick={() => setFilter('used')}
          >
            Использованы
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 300 }}>
          <Button
            variant="ghost"
            size="sm"
            className={`transition-colors rounded-full px-4 py-2 font-semibold border-2
              ${filter === 'transferred' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-transparent border-purple-800 text-purple-400 hover:bg-purple-900/20'}
            `}
            onClick={() => setFilter('transferred')}
          >
            Переданы
          </Button>
        </motion.div>
      </div>
      {/* NFT Rewards */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">NFT Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingNFTs ? (
            <div className="text-center py-8 text-gray-400">Loading NFTs...</div>
          ) : filteredNFTs.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Trophy size={32} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Нет NFT с выбранным статусом</h3>
              <p className="text-gray-400 mb-4">Попробуйте выбрать другой фильтр</p>
            </div>
          ) : (
            generateNFTCards()
          )}
        </div>
      </div>

      {/* Active Vouchers */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Active Vouchers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {vouchersLoading ? (
             <div className="col-span-full text-center py-12 text-gray-400">Загрузка ваучеров...</div>
           ) : vouchers.length === 0 ? (
             <div className="col-span-full text-center py-12 text-gray-400">Нет активных ваучеров</div>
           ) : vouchers.map((voucher: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, boxShadow: '0 4px 32px #00ffb2' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => {
                if (voucher.voucher) {
                  setSelectedVoucher(voucher.voucher);
                  setIsVoucherModalOpen(true);
                }
              }}
            >
              <Card className="bg-gray-900/50 border-gray-800 card-hover cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{voucher.title}</CardTitle>
                  <Badge className={`w-fit ${voucher.status === 'Active' ? 'bg-emerald-600' : 'bg-gray-600'} text-white`}>
                    {voucher.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300 text-sm">{voucher.description}</p>
                  <div className="text-sm">
                    <span className="text-gray-400">Valid until: </span>
                    <span className="text-white">{voucher.validUntil}</span>
                  </div>
                  <div className="flex gap-2">
                    {voucher.qrCode && (
                      <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        <QrCode size={16} className="mr-1" />
                        Show QR
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`${voucher.qrCode ? 'flex-1' : 'w-full'} border-gray-600 text-gray-300`}
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reward History */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift size={20} className="text-purple-400" />
            <span>Reward History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rewardHistory.length === 0 ? (
              <div className="text-center text-gray-400">No reward history</div>
            ) : rewardHistory.map((item: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, backgroundColor: '#222' }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <Gift size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.reward}</p>
                      <p className="text-sm text-gray-400">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                      {item.type}
                    </Badge>
                    <p className="text-xs text-emerald-400 mt-1">{item.status}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NFT Modal */}
      <NFTModal
        nft={selectedNFT}
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Modal closing');
          setIsModalOpen(false);
          setSelectedNFT(null);
        }}
      />

      {/* Voucher Modal */}
      <VoucherModal
        voucher={selectedVoucher}
        isOpen={isVoucherModalOpen}
        onClose={() => {
          setIsVoucherModalOpen(false);
          setSelectedVoucher(null);
        }}
      />
      
      {/* Debug info */}
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-sm">
        <div>Total NFTs: {nfts.length}</div>
        <div>Filtered NFTs: {filteredNFTs.length}</div>
        <div>Filter: {filter}</div>
        <div>Selected: {selectedNFT ? `#${selectedNFT.tokenId}` : 'None'}</div>
        <div>Modal: {isModalOpen ? 'Open' : 'Closed'}</div>
      </div>
    </div>
  );
}