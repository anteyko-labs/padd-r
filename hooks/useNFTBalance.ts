'use client';

import { useAccount } from 'wagmi';
import { useReadContract, useReadContracts } from 'wagmi';
import { NFT_FACTORY_ABI } from '@/lib/contracts/abis';
import { NFT_FACTORY_ADDRESS, formatTokenAmount, formatDate, TIER_LEVELS } from '@/lib/contracts/config';
import { useStakingPositions } from './useStakingPositions';

export function useNFTBalance() {
  const { address } = useAccount();
  const contractAddress = NFT_FACTORY_ADDRESS;

  // Получаем баланс NFT
  const { data: nftBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: NFT_FACTORY_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address },
  });

  // Получаем все tokenIds пользователя
  const tokenIdList = Array.from({ length: Number(nftBalance || 0) }, (_, i) => BigInt(i));
  const { data: tokenIdsData, isLoading: isLoadingTokenIds, refetch: refetchTokenIds } = useReadContracts({
    contracts: tokenIdList.map((idx) => ({
      address: contractAddress as `0x${string}`,
      abi: NFT_FACTORY_ABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [address!, idx],
    })),
    query: { enabled: !!address && tokenIdList.length > 0 },
  });
  const tokenIds = Array.isArray(tokenIdsData) ? tokenIdsData.map((res) => res.result).filter(Boolean) : [];

  // Получаем метаданные для всех tokenIds
  const { data: nftsMetaData, isLoading: isLoadingMeta, refetch: refetchMeta } = useReadContracts({
    contracts: tokenIds.map((tokenId) => ({
      address: contractAddress as `0x${string}`,
      abi: NFT_FACTORY_ABI,
      functionName: 'nftMetadata',
      args: [tokenId],
    })),
    query: { enabled: tokenIds.length > 0 },
  });

  // Форматируем и фильтруем только стейкинг-NFT (positionId > 0)
  const nfts = (Array.isArray(nftsMetaData) ? nftsMetaData.map((res, i) => {
    const meta: any = res.result;
    if (!Array.isArray(meta) || meta.length < 7) return null;
    const [positionId, amountStaked, lockDurationMonths, startTimestamp, tierLevel, monthIndex, nextMintOn] = meta;
    const tierNumber = Number(tierLevel);
    const tierInfo = TIER_LEVELS[tierNumber as keyof typeof TIER_LEVELS];
    const startTimestampNum = Number(startTimestamp);
    const nextMintOnNum = Number(nextMintOn);
    return {
      tokenId: Number(tokenIds[i] || 0),
      positionId,
      amountStaked,
      lockDurationMonths,
      startTimestamp,
      tierLevel: tierNumber,
      monthIndex,
      nextMintOn,
      formattedAmountStaked: formatTokenAmount(amountStaked),
      formattedStartDate: formatDate(startTimestamp),
      formattedNextMintDate: formatDate(nextMintOn),
      tierInfo,
      isTransferable: tierNumber >= 2,
      daysUntilNextMint: Math.max(0, Math.ceil((nextMintOnNum * 1000 - Date.now()) / (1000 * 60 * 60 * 24))),
    };
  }).filter(Boolean) : []) as any[];

  // Вычисляем максимальный tier среди всех стейкинг-NFT
  const maxTierLevelNFT = nfts.length > 0 ? Math.max(...nfts.map((nft) => nft.tierLevel)) : null;
  let maxTierLevel = maxTierLevelNFT;
  if (nfts.length === 0) {
    maxTierLevel = null;
  }
  const currentTier = maxTierLevel !== null && maxTierLevel !== undefined ? TIER_LEVELS[maxTierLevel as keyof typeof TIER_LEVELS]?.name : 'None';

  return {
    nfts,
    isLoading: isLoadingBalance || isLoadingTokenIds || isLoadingMeta,
    totalNFTs: nfts.length,
    transferableNFTs: nfts.filter((nft) => nft.isTransferable).length,
    totalStakedInNFTs: nfts.reduce((sum, nft) => sum + Number(nft.formattedAmountStaked), 0),
    currentTier,
    nextMintIn: nfts.length > 0 ? nfts[0].daysUntilNextMint : 0,
    refetch: async () => {
      await refetchBalance();
      await refetchTokenIds();
      await refetchMeta();
    },
  };
} 