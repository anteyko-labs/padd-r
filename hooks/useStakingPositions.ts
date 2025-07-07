'use client';

import { useAccount } from 'wagmi';
import { useReadContract, useReadContracts } from 'wagmi';
import { STAKE_MANAGER_ABI } from '@/lib/contracts/abis';
import { STAKE_MANAGER_ADDRESS, formatTokenAmount, formatDuration, formatDate, TIER_LEVELS } from '@/lib/contracts/config';

export function useStakingPositions() {
  const { address } = useAccount();
  const contractAddress = STAKE_MANAGER_ADDRESS;

  // Получаем список ID позиций пользователя
  const { data: positionIds, isLoading: isLoadingIds, refetch: refetchIds } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: STAKE_MANAGER_ABI,
    functionName: 'getUserPositions',
    args: [address!],
    query: { enabled: !!address },
  });

  // Фильтруем только bigint id
  const positionIdList: bigint[] = Array.isArray(positionIds) ? positionIds.filter((id): id is bigint => typeof id === 'bigint') : [];

  // Получаем все позиции батчем
  const { data: positionsData, isLoading: isLoadingPositions, refetch: refetchPositions } = useReadContracts({
    contracts: positionIdList.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: STAKE_MANAGER_ABI,
      functionName: 'positions',
      args: [id],
    })),
    query: { enabled: positionIdList.length > 0 },
  });

  // Получаем все награды батчем
  const { data: rewardsData, isLoading: isLoadingRewards, refetch: refetchRewards } = useReadContracts({
    contracts: positionIdList.map((id) => ({
      address: contractAddress as `0x${string}`,
      abi: STAKE_MANAGER_ABI,
      functionName: 'calculateRewards',
      args: [id],
    })),
    query: { enabled: positionIdList.length > 0 },
  });

  // Форматируем все позиции строго по индексам positionIdList
  const positions = positionIdList
    .map((id, idx) => {
      const pos = positionsData?.[idx];
      if (!pos || !pos.result) return null;
      const result: unknown = pos.result;
      if (!Array.isArray(result) || result.length < 8) return null;
      const [amount, startTime, duration, nextMintAt, tier, monthIndex, isActive, owner] = result;
      const tierNumber = Number(tier);
      const tierInfo = TIER_LEVELS[tierNumber as keyof typeof TIER_LEVELS];
      const rawRewards = rewardsData?.[idx]?.result ?? BigInt(0);
      const rewards = typeof rawRewards === 'bigint' ? rawRewards : BigInt(rawRewards);
      const now = Math.floor(Date.now() / 1000);
      const endTime = Number(startTime) + Number(duration);
      return {
        id: Number(id),
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
        formattedRewards: formatTokenAmount(typeof rewards === 'bigint' ? rewards : BigInt(rewards)),
        tierInfo,
        isMature: now >= endTime,
        secondsRemaining: Math.max(0, endTime - now),
        secondsUntilNextMint: Math.max(0, Number(nextMintAt) - now),
      };
    })
    .filter((pos): pos is NonNullable<typeof pos> => !!pos);

  // Разделяем активные и завершённые позиции
  const activePositionsArr = positions.filter(pos => pos.isActive);
  const pastPositions = positions.filter(pos => !pos.isActive);

  // Рассчитываем общую статистику
  const totalStaked = positions.reduce((sum, pos) => sum + Number(pos ? pos.formattedAmount : 0), 0);
  const totalRewards = positions.reduce((sum, pos) => sum + Number(pos ? pos.formattedRewards : 0), 0);
  const activePositions = activePositionsArr.length;

  // Новый: вычисляем максимальный tier среди всех активных позиций
  const maxTier = positions.length > 0 ? Math.max(...activePositionsArr.map(pos => pos.tier ?? 0)) : 0;
  const currentTier = TIER_LEVELS[maxTier as keyof typeof TIER_LEVELS]?.name || 'None';

  return {
    positions,
    isLoading: isLoadingIds || isLoadingPositions || isLoadingRewards,
    totalPositions: positionIds?.length || 0,
    activePositions,
    totalStaked,
    totalRewards,
    currentTier,
    nextRewardIn: positions[0]?.secondsUntilNextMint || 0,
    pastPositions,
    refetch: async () => {
      await refetchIds();
      await refetchPositions();
      await refetchRewards();
    },
  };
} 