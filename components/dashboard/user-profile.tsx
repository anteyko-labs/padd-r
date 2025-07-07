'use client';

import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, ExternalLink, Shield, Mail, Phone, MapPin, Settings, Trophy, Clock } from 'lucide-react';
import { useAccount, useWriteContract } from 'wagmi';
import { STAKE_MANAGER_ABI, NFT_FACTORY_ABI } from '@/lib/contracts/abis';
import { STAKE_MANAGER_ADDRESS, NFT_FACTORY_ADDRESS } from '@/lib/contracts/config';
import { usePadBalance } from '@/hooks/usePadBalance';
import { useStakingPositions } from '@/hooks/useStakingPositions';
import { useNFTBalance } from '@/hooks/useNFTBalance';
import { TIER_LEVELS, formatDate, formatTokenAmount } from '@/lib/contracts/config';
import { DashboardDataContext } from './layout';

export function UserProfile() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const [unstakeLoading, setUnstakeLoading] = useState<number | null>(null);
  const [unstakeError, setUnstakeError] = useState<string | null>(null);

  const { padBalance, stakingPositions, nftBalance } = useContext(DashboardDataContext);
  const { address, chainId } = useAccount();
  const { balance, isLoading: isLoadingBalance } = padBalance;
  const {
    positions = [],
    isLoading: isLoadingPositions,
    totalStaked = 0,
    totalRewards = 0,
    currentTier = 'None',
  } = stakingPositions;
  const {
    totalNFTs = 0,
    isLoading: isLoadingNFTs,
    currentTier: nftTier = 'None',
  } = nftBalance;
  const { nfts } = useNFTBalance();

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/profile?address=${address}`)
      .then(async res => {
        if (!res.ok) throw new Error('Network response was not ok');
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(data => {
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setNotifications(data.notifications !== undefined ? data.notifications : true);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        console.error('Profile fetch error:', err);
      });
  }, [address]);

  const handleSave = async () => {
    console.log('Save button clicked!');
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, email, phone, notifications }),
      });
      if (res.ok) {
        setIsEditing(false);
        // Можно добавить toast об успехе
      } else {
        // Можно добавить toast об ошибке
      }
    } finally {
      setLoading(false);
    }
  };

  // Форматируем адрес кошелька
  const formatAddress = (address: string | undefined) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Получаем только активные позиции
  const activePositions = (positions ?? []).filter((pos: any) => pos.isActive && ((Date.now() / 1000) < (Number(pos.startTime) + Number(pos.duration))));

  // Завершённые позиции (finished)
  const finishedPositions = (positions ?? []).filter((pos: any) => {
    const endTime = Number(pos.startTime) + Number(pos.duration);
    return !pos.isActive || (Date.now() / 1000) >= endTime;
  });

  // Проверка: можно ли собрать NFT (например, claimableNFT === true или свойство позиции)
  const canClaimNFT = (pos: any) => {
    // Пример: если есть поле canClaimNFT или claimableNFT
    return pos.canClaimNFT || pos.claimableNFT || (pos.nftClaimed === false);
  };

  const handleClaimAndUnstake = async (positionId: number) => {
    setUnstakeLoading(positionId);
    setUnstakeError(null);
    try {
      // Сначала mint NFT
      await writeContractAsync({
        address: STAKE_MANAGER_ADDRESS,
        abi: STAKE_MANAGER_ABI,
        functionName: 'mintNextNFT',
        args: [BigInt(positionId)],
      });
      // Затем closePosition
      await writeContractAsync({
        address: STAKE_MANAGER_ADDRESS,
        abi: STAKE_MANAGER_ABI,
        functionName: 'closePosition',
        args: [BigInt(positionId)],
      });
    } catch (e: any) {
      setUnstakeError(e?.message || 'Ошибка при claim NFT & возврате токенов');
    }
    setUnstakeLoading(null);
  };

  const handleUnstake = async (positionId: number) => {
    setUnstakeLoading(positionId);
    setUnstakeError(null);
    try {
      await writeContractAsync({
        address: STAKE_MANAGER_ADDRESS,
        abi: STAKE_MANAGER_ABI,
        functionName: 'closePosition',
        args: [BigInt(positionId)],
      });
    } catch (e: any) {
      setUnstakeError(e?.message || 'Ошибка при возврате токенов');
    }
    setUnstakeLoading(null);
  };

  // Helper to get tier key by name
  const getTierKeyByName = (name: string): number | undefined => {
    const entry = Object.entries(TIER_LEVELS).find(([, value]) => value.name === name);
    return entry ? Number(entry[0]) : undefined;
  };

  let bestTier: string = 'No Tier';
  if (activePositions.length > 0) {
    bestTier = activePositions.reduce((max: string, pos: any) => {
      if (pos.tierInfo && pos.tierInfo.name) {
        const tierKey = getTierKeyByName(pos.tierInfo.name);
        const maxKey = getTierKeyByName(max);
        if (
          max === 'No Tier' ||
          (tierKey !== undefined && maxKey !== undefined && tierKey > maxKey)
        ) {
          return pos.tierInfo.name;
        }
      }
      return max;
    }, 'No Tier');
  } else if ((totalNFTs ?? 0) > 0 && nftTier && nftTier !== 'None') {
    bestTier = nftTier;
  }

  // Форматируем баланс
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return formatTokenAmount(balance);
  };

  const userInfo = {
    walletAddress: formatAddress(address),
    joinDate: 'October 2024',
    totalStaked: `${totalStaked.toFixed(2)} PADD-R`,
    currentTier: bestTier,
    kycStatus: 'Pending',
    rewardsEarned: totalRewards.toFixed(2),
    tokenBalance: formatBalance(balance),
    nftCount: totalNFTs,
  };

  // Определяем достигнутые тиры на основе позиций
  const achievedTiers = new Set<string>();
  positions.forEach((position: any) => {
    if (position && position.tierInfo?.name) {
      achievedTiers.add(position.tierInfo.name);
    }
  });

  const tierProgress = [
    { tier: 'Bronze', required: '6 months - 1 year', achieved: achievedTiers.has('Bronze') },
    { tier: 'Silver', required: '1 - 1.5 years', achieved: achievedTiers.has('Silver') },
    { tier: 'Gold', required: '1.5 - 2.5 years', achieved: achievedTiers.has('Gold') },
    { tier: 'Platinum', required: '2.5+ years', achieved: achievedTiers.has('Platinum') },
  ];

  const tierColors: Record<string, string> = {
    'Bronze': 'text-amber-400',
    'Silver': 'text-gray-400',
    'Gold': 'text-yellow-400',
    'Platinum': 'text-emerald-400',
    'No Tier': 'text-gray-400',
  };
  const badgeColors: Record<string, string> = {
    'Bronze': 'bg-amber-600',
    'Silver': 'bg-gray-600',
    'Gold': 'bg-yellow-600',
    'Platinum': 'bg-emerald-600',
    'No Tier': 'bg-gray-700',
  };

  return (
    <div className="space-y-8">
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{formatAddress(address)}</h3>
          <Badge className={`${badgeColors[bestTier]} text-white mb-4`}>{bestTier} Tier</Badge>
        </CardContent>
      </Card>
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <h4 className="font-semibold text-white mb-4">Account Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Token Balance</span>
              <span className="text-emerald-400 font-semibold">
                {isLoadingBalance ? 'Loading...' : `${userInfo.tokenBalance} PAD`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Staked</span>
              <span className="text-blue-400 font-semibold">
                {isLoadingPositions ? 'Loading...' : userInfo.totalStaked}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rewards Earned</span>
              <span className="text-white font-semibold">
                {isLoadingPositions ? 'Loading...' : `${userInfo.rewardsEarned} PAD`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">NFTs</span>
              <span className="text-purple-400 font-semibold">
                {isLoadingNFTs ? 'Loading...' : userInfo.nftCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <h4 className="font-semibold text-white mb-4">Завершённые позиции</h4>
          {finishedPositions.length === 0 ? (
            <div className="text-gray-400">Нет завершённых позиций</div>
          ) : (
            <div className="space-y-4">
              {finishedPositions.map((pos: any) => {
                const nftsForPosition = nfts.filter((nft: any) => Number(nft.positionId) === Number(pos.id));
                return (
                  <div key={pos.id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-800/40 rounded-xl p-4">
                    <div>
                      <div className="font-semibold text-white">Позиция #{pos.id}</div>
                      <div className="text-gray-400 text-sm">Сумма: {pos.formattedAmount} PADD-R</div>
                      <div className="text-gray-400 text-sm">Тир: {pos.tierInfo?.name || '—'}</div>
                      <div className="text-gray-400 text-sm">Период: {pos.formattedStartDate} — {pos.formattedEndDate}</div>
                      <div className="text-purple-400 text-sm mt-1">NFTs: {nftsForPosition.length}</div>
                    </div>
                    <div className="mt-2 md:mt-0 flex flex-col items-end">
                      {canClaimNFT(pos) ? (
                        <Button
                          onClick={() => handleClaimAndUnstake(pos.id)}
                          disabled={unstakeLoading === pos.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {unstakeLoading === pos.id ? 'Выполняется...' : 'Claim NFT & Unstake'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUnstake(pos.id)}
                          disabled={unstakeLoading === pos.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          {unstakeLoading === pos.id ? 'Возврат...' : 'Вернуть токены'}
                        </Button>
                      )}
                      {unstakeError && (
                        <div className="text-red-500 text-xs mt-1">{unstakeError}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}