'use client';

import { useAccount } from 'wagmi';
import { useReadContract, useReadContracts } from 'wagmi';
import { STAKE_MANAGER_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES, formatTokenAmount, formatDuration, formatDate, TIER_LEVELS } from '@/lib/contracts/config';

export function useStakingPositions() {
  const { address, chainId } = useAccount();
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.STAKE_MANAGER;

  // Получаем список ID позиций пользователя
  const { data: positionIds, isLoading: isLoadingIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: STAKE_MANAGER_ABI,
    functionName: 'getUserPositions',
    args: [address!],
    query: { enabled: !!address },
  });

  // Фильтруем только bigint id
  const positionIdList: bigint[] = Array.isArray(positionIds) ? positionIds.filter((id): id is bigint => typeof id === 'bigint') : [];

  // Получаем все позиции батчем
  const { data: positionsData, isLoading: isLoadingPositions } = useReadContracts({
    contracts: positionIdList.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: STAKE_MANAGER_ABI,
      functionName: 'positions',
      args: [id],
    })),
    query: { enabled: positionIdList.length > 0 },
  });

  // Получаем все награды батчем
  const { data: rewardsData, isLoading: isLoadingRewards } = useReadContracts({
    contracts: positionIdList.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: STAKE_MANAGER_ABI,
      functionName: 'calculateRewards',
      args: [id],
    })),
    query: { enabled: positionIdList.length > 0 },
  });

  // Форматируем все позиции
  const positions = (positionsData || [])
    .map((pos, idx) => {
      if (!pos || !pos.result) return null;
      const [amount, startTime, duration, nextMintAt, tier, monthIndex, isActive, owner] = pos.result;
      const tierNumber = Number(tier);
      const tierInfo = TIER_LEVELS[tierNumber as keyof typeof TIER_LEVELS];
      const rewards = rewardsData?.[idx]?.result || BigInt(0);
      return {
        id: Number(positionIdList[idx] || BigInt(0)),
        amount,
        startTime,
        duration,
        nextMintAt,
        tier: tierNumber,
        monthIndex: Number(monthIndex),
        isActive,
        owner,
        rewards,
        formattedAmount: formatTokenAmount(amount),
        formattedDuration: formatDuration(duration),
        formattedStartDate: formatDate(startTime),
        formattedNextMintDate: formatDate(nextMintAt),
        formattedRewards: formatTokenAmount(rewards),
        tierInfo,
        isMature: Date.now() >= (Number(startTime) + Number(duration)) * 1000,
        daysRemaining: Math.max(0, Math.ceil((((Number(startTime) + Number(duration)) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))),
        daysUntilNextMint: Math.max(0, Math.ceil(((Number(nextMintAt) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))),
      };
    })
    .filter((pos) => !!pos);

  // Рассчитываем общую статистику
  const totalStaked = positions.reduce((sum, pos) => sum + Number(pos.formattedAmount), 0);
  const totalRewards = positions.reduce((sum, pos) => sum + Number(pos.formattedRewards), 0);
  const activePositions = positions.filter(pos => pos.isActive).length;

  // Новый: вычисляем максимальный tier среди всех активных позиций
  const maxTier = positions.length > 0 ? Math.max(...positions.filter(pos => pos.isActive).map(pos => pos.tier ?? 0)) : 0;
  const currentTier = TIER_LEVELS[maxTier as keyof typeof TIER_LEVELS]?.name || 'None';

  return {
    positions,
    isLoading: isLoadingIds || isLoadingPositions || isLoadingRewards,
    totalPositions: positionIds?.length || 0,
    activePositions,
    totalStaked,
    totalRewards,
    currentTier,
    nextRewardIn: positions[0]?.daysUntilNextMint || 0,
  };
} 