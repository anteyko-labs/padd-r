'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Download, ExternalLink, QrCode, Eye, Star, Clock, Trophy } from 'lucide-react';
import { useNFTBalanceFromEvents } from '@/hooks/useNFTBalanceFromEvents';
import { useStakingPositions } from '@/hooks/useStakingPositions';
import { TIER_LEVELS } from '@/lib/contracts/config';
import { useEffect } from 'react';
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import { NFT_FACTORY_ADDRESS } from '@/lib/contracts/config';

export function RewardsPanel() {
  const { nfts, isLoading: isLoadingNFTs, totalNFTs, transferableNFTs, currentTier, refetch } = useNFTBalanceFromEvents();
  const { positions, isLoading: isLoadingPositions, totalRewards } = useStakingPositions();

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

  // Генерируем NFT карточки на основе реальных данных
  const generateNFTCards = () => {
    if (isLoadingNFTs) {
      return Array(2).fill(null).map((_, index) => (
        <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover overflow-hidden">
          <div className="relative">
            <div className="w-full h-48 bg-gray-800 animate-pulse"></div>
          </div>
          <CardHeader>
            <div className="h-6 bg-gray-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (nfts.length === 0) {
      return (
        <div className="col-span-full text-center py-12">
          <div className="w-24 h-24 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Trophy size={32} className="text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No NFTs Yet</h3>
          <p className="text-gray-400 mb-4">Start staking to earn your first NFT reward</p>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Start Staking
          </Button>
        </div>
      );
    }

    return nfts.map((nft, index) => (
      <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover overflow-hidden">
        <div className="relative">
          <div className="w-full h-48 bg-gradient-to-br from-purple-600/20 to-emerald-600/20 flex items-center justify-center">
            <div className="text-center">
              <Trophy size={48} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-semibold">{nft.tierInfo?.name} NFT</p>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Badge className={`${
              nft.tierInfo?.name === 'Platinum' ? 'bg-emerald-600' :
              nft.tierInfo?.name === 'Gold' ? 'bg-yellow-600' :
              nft.tierInfo?.name === 'Silver' ? 'bg-gray-600' : 'bg-amber-600'
            } text-white`}>
              {nft.tierInfo?.name}
            </Badge>
          </div>
          {nft.isTransferable && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-emerald-600 text-white">Tradeable</Badge>
            </div>
          )}
        </div>
        
        <CardHeader>
          <CardTitle className="text-lg text-white">{nft.tierInfo?.name} NFT #{nft.tokenId}</CardTitle>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-emerald-600 text-emerald-400">
              Active
            </Badge>
            <span className="text-emerald-400 font-bold">{nft.formattedAmountStaked}</span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Benefits</p>
            <div className="space-y-1">
              <div className="text-sm text-gray-300 flex items-center">
                <Star size={12} className="text-emerald-400 mr-2" />
                {nft.tierInfo?.discount}% discount on services
              </div>
              <div className="text-sm text-gray-300 flex items-center">
                <Star size={12} className="text-emerald-400 mr-2" />
                {nft.tierInfo?.name} tier benefits
              </div>
              {nft.isTransferable && (
                <div className="text-sm text-gray-300 flex items-center">
                  <Star size={12} className="text-emerald-400 mr-2" />
                  Tradeable on marketplace
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-400">Started: {nft.formattedStartDate}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-400">Staked for: {Number(nft.lockDurationMonths)} month{Number(nft.lockDurationMonths) === 1 ? '' : 's'}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
              <Eye size={16} className="mr-1" />
              Details
            </Button>
            {nft.isTransferable && (
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                <ExternalLink size={16} className="mr-1" />
                Trade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    ));
  };

  // Динамические ваучеры на основе NFT пользователя
  const vouchers = nfts.map((nft) => ({
    title: `${nft.tierInfo?.discount}% Restaurant Discount`,
    description: `Valid for ${nft.tierInfo?.name} tier holders`,
    validUntil: nft.formattedNextMintDate || '-',
    status: 'Active' as const,
    qrCode: nft.isTransferable,
  }));

  // Динамическая история наград
  const rewardHistory = [
    // NFT события
    ...nfts.map((nft) => ({
      date: nft.formattedStartDate,
      reward: `${nft.tierInfo?.name} NFT`,
      type: 'NFT',
      status: 'Received' as const,
    })),
    // Токеновые награды по позициям
    ...positions.filter(pos => !!pos && Number(pos.rewards) > 0).map((pos) => {
      const safePos = pos as NonNullable<typeof pos>;
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
      {/* NFT Rewards */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">NFT Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generateNFTCards()}
        </div>
      </div>

      {/* Active Vouchers */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Active Vouchers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">No active vouchers</div>
          ) : vouchers.map((voucher, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover">
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
            ) : rewardHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/30">
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
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}