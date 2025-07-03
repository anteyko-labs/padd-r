'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wallet, Shield, Trophy, Clock, TrendingUp, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDuration, formatTokenAmount, TIER_LEVELS } from '@/lib/contracts/config';
import React, { useContext } from 'react';
import { DashboardDataContext } from './layout';

export function Overview() {
  const { padBalance, stakingPositions, nftBalance } = useContext(DashboardDataContext);
  const { balance, isLoading: isLoadingBalance, error: balanceError } = padBalance;
  const {
    positions = [],
    isLoading: isLoadingStaking,
    totalStaked = 0,
    totalRewards = 0,
    activePositions = 0,
    currentTier = 'None',
    nextRewardIn = 0,
  } = stakingPositions;
  const {
    totalNFTs = 0,
    isLoading: isLoadingNFTs,
    totalStakedInNFTs = 0,
    currentTier: nftTier = 'None',
  } = nftBalance;
  const router = useRouter();

  // Форматируем баланс
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return formatTokenAmount(balance);
  };

  // Цвета для тиров
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

  // Получаем лучший тир (из стейкинга или NFT)
  const activePositionsArr = (positions ?? []).filter((pos: any) => pos.isActive && !pos.isMature && pos.secondsRemaining > 0);

  // Helper to get tier key by name
  const getTierKeyByName = (name: string): number | undefined => {
    const entry = Object.entries(TIER_LEVELS).find(([, value]) => value.name === name);
    return entry ? Number(entry[0]) : undefined;
  };

  let bestTier: string = 'No Tier';
  if (activePositionsArr.length > 0) {
    bestTier = activePositionsArr.reduce((max: any, pos: any) => {
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

  const userStats = {
    balance: formatBalance(balance),
    stakedAmount: totalStaked.toFixed(2),
    currentTier: bestTier,
    nextRewardIn,
    totalRewards: totalRewards.toFixed(2),
    stakingProgress: positions.length > 0 ? Math.min(100, (activePositions / positions.length) * 100) : 0,
  };

  // При формировании списков позиций:
  const currentPositions = positions.filter((pos: any) => pos.isActive && !pos.isMature && pos.secondsRemaining > 0);
  const pastPositions = positions.filter((pos: any) => !pos.isActive || pos.isMature || pos.secondsRemaining === 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900/50 border-gray-800 card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Token Balance</p>
                {isLoadingBalance ? (
                  <p className="text-2xl font-bold text-emerald-400">Loading...</p>
                ) : balanceError ? (
                  <p className="text-2xl font-bold text-red-400">Error</p>
                ) : (
                  <p className="text-2xl font-bold text-emerald-400">{userStats.balance} PAD</p>
                )}
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
                <Wallet size={24} className="text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800 card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Staked Amount</p>
                {isLoadingStaking ? (
                  <p className="text-2xl font-bold text-blue-400">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-blue-400">{userStats.stakedAmount} PAD</p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                <Shield size={24} className="text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800 card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Tier</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-bold ${tierColors[bestTier]}`}>{bestTier}</p>
                  <Badge className={`${badgeColors[bestTier]} text-white`}>{totalNFTs} NFT</Badge>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center">
                <Trophy size={24} className="text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800 card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Next Reward In</p>
                {isLoadingStaking ? (
                  <p className="text-2xl font-bold text-yellow-400">Loading...</p>
                ) : (
                  <p className="text-2xl font-bold text-yellow-400">{formatDuration(typeof userStats.nextRewardIn === 'bigint' ? userStats.nextRewardIn : BigInt(userStats.nextRewardIn))}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-yellow-600/20 rounded-2xl flex items-center justify-center">
                <Clock size={24} className="text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Staking Progress */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp size={20} className="text-emerald-400" />
              <span>Current Stake</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingStaking ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading staking data...</p>
              </div>
            ) : positions.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/50">
                  <div>
                    <p className="font-semibold text-white">{userStats.stakedAmount} PADD-R</p>
                    <p className="text-sm text-gray-400">{userStats.currentTier} Tier • {activePositions} active positions</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white">Active</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-emerald-400">{userStats.stakingProgress}% complete</span>
                  </div>
                  <Progress value={userStats.stakingProgress} className="h-3" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-gray-800/30 rounded-xl">
                    <p className="text-sm text-gray-400">NFTs Owned</p>
                    <p className="text-lg font-bold text-purple-400">{isLoadingNFTs ? 'Loading...' : totalNFTs}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">No active staking positions</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}