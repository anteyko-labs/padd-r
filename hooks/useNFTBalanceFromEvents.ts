import { useEffect, useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { NFT_FACTORY_ABI } from '@/lib/contracts/abis';
import { NFT_FACTORY_ADDRESS, NFT_IMAGES, NFT_IMAGES_FALLBACK } from '@/lib/contracts/config';
import { formatTokenAmount, formatDate, TIER_LEVELS } from '@/lib/contracts/config';

export function useNFTBalanceFromEvents() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

          useEffect(() => {
          if (!address || !publicClient) {
            return;
          }
          let cancelled = false;
          async function fetchNFTs() {
            setIsLoading(true);
            setError(null);
      try {
        if (!publicClient) return;
        
                      // 1. Получаем баланс NFT пользователя
              const balance = await publicClient.readContract({
                address: NFT_FACTORY_ADDRESS,
                abi: NFT_FACTORY_ABI,
                functionName: 'balanceOf',
                args: [address!],
              });
        
                      // 2. Получаем total supply для итерации
              const totalSupply = await publicClient.readContract({
                address: NFT_FACTORY_ADDRESS,
                abi: NFT_FACTORY_ABI,
                functionName: 'totalSupply',
                args: [],
              });
              
              // 3. Итерируемся по всем NFT и проверяем владельца
              const userNFTs: any[] = [];
              for (let tokenId = 0; tokenId < Number(totalSupply); tokenId++) {
                try {
                  const owner = await publicClient.readContract({
                    address: NFT_FACTORY_ADDRESS,
                    abi: NFT_FACTORY_ABI,
                    functionName: 'ownerOf',
                    args: [BigInt(tokenId)],
                  });
                  
                  // Если NFT принадлежит пользователю
                  if (owner.toLowerCase() === address!.toLowerCase()) {
              
              // Получаем метаданные
              const meta: any = await publicClient.readContract({
                address: NFT_FACTORY_ADDRESS,
                abi: NFT_FACTORY_ABI,
                functionName: 'nftMetadata',
                args: [BigInt(tokenId)],
              });
              
              if (Array.isArray(meta) && meta.length >= 8) {
                const [positionId, amountStaked, lockDurationMonths, startTimestamp, tierLevel, monthIndex, nextMintOn, isInitialStakingNFT] = meta;
                const tierNumber = Number(tierLevel);
                const tierInfo = TIER_LEVELS[tierNumber as keyof typeof TIER_LEVELS];
                const startTimestampNum = Number(startTimestamp);
                const nextMintOnNum = Number(nextMintOn);
                
                // Получаем изображение из прямых ссылок
                const tierName = tierInfo?.name || 'Bronze';
                const imageUrl = NFT_IMAGES[tierName as keyof typeof NFT_IMAGES] || NFT_IMAGES_FALLBACK[tierName as keyof typeof NFT_IMAGES_FALLBACK] || '/placeholder-nft.svg';
                
                                       // Проверяем доступность изображения
                       let finalImageUrl = imageUrl;
                       try {
                         const response = await fetch(imageUrl, { method: 'HEAD' });
                         if (!response.ok) {
                           finalImageUrl = NFT_IMAGES_FALLBACK[tierName as keyof typeof NFT_IMAGES_FALLBACK] || '/placeholder-nft.svg';
                         }
                       } catch (e) {
                         finalImageUrl = NFT_IMAGES_FALLBACK[tierName as keyof typeof NFT_IMAGES_FALLBACK] || '/placeholder-nft.svg';
                       }
                
                userNFTs.push({
                  tokenId: Number(tokenId),
                  positionId,
                  amountStaked,
                  lockDurationMonths,
                  startTimestamp,
                  tierLevel: tierNumber,
                  monthIndex,
                  nextMintOn,
                  isInitialStakingNFT,
                  formattedAmountStaked: formatTokenAmount(amountStaked),
                  formattedStartDate: formatDate(startTimestamp),
                  formattedNextMintDate: formatDate(nextMintOn),
                  tierInfo,
                  isTransferable: tierNumber >= 2,
                  daysUntilNextMint: Math.max(0, Math.ceil((nextMintOnNum * 1000 - Date.now()) / (1000 * 60 * 60 * 24))),
                  image: finalImageUrl,
                  owner: address,
                  currentUser: address,
                });
              }
            }
                           } catch (e) {
                   // Silent error handling for individual NFT checks
                 }
               }
               
               if (!cancelled) {
                 setNfts(userNFTs);
               }
      } catch (e: any) {
        console.error('Error fetching NFTs:', e);
        if (!cancelled) setError(e.message || 'Failed to fetch NFTs');
                   } finally {
               if (!cancelled) {
                 setIsLoading(false);
               }
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