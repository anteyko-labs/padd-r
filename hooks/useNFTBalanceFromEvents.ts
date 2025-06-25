import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { NFT_FACTORY_ABI } from '@/lib/contracts/abis';
import { NFT_FACTORY_ADDRESS } from '@/lib/contracts/config';
import { formatTokenAmount, formatDate, TIER_LEVELS } from '@/lib/contracts/config';

export function useNFTBalanceFromEvents() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !publicClient) return;
    let cancelled = false;
    async function fetchNFTs() {
      setIsLoading(true);
      setError(null);
      try {
        if (!publicClient) return;
        // 1. Получаем все события NFTMinted для пользователя
        // Используем abi и имя события для фильтрации
        const logs = await publicClient.getLogs({
          address: NFT_FACTORY_ADDRESS,
          event: (NFT_FACTORY_ABI as any).find((e: any) => e.type === 'event' && e.name === 'NFTMinted'),
          args: { to: address },
          fromBlock: BigInt(0),
          toBlock: 'latest',
        });
        const tokenIds = logs.map((log: any) => log.args.tokenId);
        // 2. Получаем метаданные по каждому tokenId
        const metaPromises = tokenIds.map(async (tokenId: bigint) => {
          try {
            if (!publicClient) return null;
            const meta: any = await publicClient.readContract({
              address: NFT_FACTORY_ADDRESS,
              abi: NFT_FACTORY_ABI,
              functionName: 'nftMetadata',
              args: [tokenId],
            });
            if (!Array.isArray(meta) || meta.length < 7) return null;
            const [positionId, amountStaked, lockDurationMonths, startTimestamp, tierLevel, monthIndex, nextMintOn] = meta;
            const tierNumber = Number(tierLevel);
            const tierInfo = TIER_LEVELS[tierNumber as keyof typeof TIER_LEVELS];
            const startTimestampNum = Number(startTimestamp);
            const nextMintOnNum = Number(nextMintOn);
            return {
              tokenId: Number(tokenId),
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
          } catch (e) {
            return null;
          }
        });
        const nftsMeta = (await Promise.all(metaPromises)).filter(Boolean);
        if (!cancelled) setNfts(nftsMeta);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to fetch NFTs');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchNFTs();
    return () => { cancelled = true; };
  }, [address, publicClient]);

  return {
    nfts,
    isLoading,
    error,
    totalNFTs: nfts.length,
    transferableNFTs: nfts.filter((nft) => nft.isTransferable).length,
    totalStakedInNFTs: nfts.reduce((sum, nft) => sum + Number(nft.formattedAmountStaked), 0),
    currentTier:
      nfts.length > 0
        ? TIER_LEVELS[Math.max(...nfts.map((nft) => nft.tierLevel)) as keyof typeof TIER_LEVELS]?.name
        : 'None',
    nextMintIn: nfts.length > 0 ? nfts[0].daysUntilNextMint : 0,
    refetch: () => {}, // можно реализовать вручную, если нужно
  };
} 