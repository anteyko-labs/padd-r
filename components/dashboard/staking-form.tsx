'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Shield, Info, Calculator, Clock, Trophy } from 'lucide-react';
import { usePadBalance } from '@/hooks/usePadBalance';
import { useStakingPositions } from '@/hooks/useStakingPositions';
import { TIER_LEVELS, formatDate, formatDuration, formatTokenAmount } from '@/lib/contracts/config';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { PAD_TOKEN_ABI, STAKE_MANAGER_ABI } from '@/lib/contracts/abis';
import { PAD_TOKEN_ADDRESS, STAKE_MANAGER_ADDRESS } from '@/lib/contracts/config';
import { useToast } from '@/hooks/use-toast';
import { useNFTBalance } from '@/hooks/useNFTBalance';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import axios from 'axios';
import { NFT_FACTORY_ABI } from '@/lib/contracts/abis';
import { NFT_FACTORY_ADDRESS } from '@/lib/contracts/config';

const tierFolders: Record<string, string> = {
  Bronze: 'tier1',
  Silver: 'tier2',
  Gold: 'tier3',
  Platinum: 'tier4',
};

const tierImages: Record<string, string> = {
  Bronze: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop&crop=center",
  Silver: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop&crop=center",
  Gold: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400&h=400&fit=crop&crop=center",
  Platinum: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=400&fit=crop&crop=center"
};

// Безопасный перевод строки в wei (bigint)
function parseUnits(amount: string, decimals: number = 18): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const normalizedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole + normalizedFraction);
}

// --- Новая функция для расчета тира ---
function calculateTier(months: number, amount: number): string {
  if (![3, 6, 9, 12].includes(months) || amount < 1000) return 'None';
  const monthsNorm = months / 12;
  const amountNorm = amount / 10000;
  const tierScore = 0.65 * monthsNorm + 0.35 * amountNorm;
  if (tierScore <= 0.2) return 'Bronze';
  if (tierScore <= 0.45) return 'Silver';
  if (tierScore <= 0.75) return 'Gold';
  return 'Platinum';
}

export function StakingForm() {
  const [stakeMonths, setStakeMonths] = useState(3);
  const [stakeAmount, setStakeAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [showDecimalsDialog, setShowDecimalsDialog] = useState(false);
  const [userNFTImages, setUserNFTImages] = useState<Record<string, string>>({}); // tokenId -> image
  const [nftImages, setNftImages] = useState<Record<number, string>>({}); // tokenId -> image_name

  const { toast } = useToast();
  const { address, chainId } = useAccount();
  const { balance, isLoading: isLoadingBalance, refetch: refetchBalance } = usePadBalance();
  const { positions, isLoading: isLoadingPositions, totalStaked, totalRewards, refetch: refetchPositions } = useStakingPositions();
  const { nfts, isLoading: isLoadingNFTs, totalNFTs, refetch: refetchNFTs } = useNFTBalance();

  const padTokenAddress = PAD_TOKEN_ADDRESS;
  const stakeManagerAddress = STAKE_MANAGER_ADDRESS;

  // Проверяем allowance
  const { data: allowance, refetch: refetchAllowance, isLoading: isLoadingAllowance } = useReadContract({
    address: padTokenAddress,
    abi: PAD_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, stakeManagerAddress],
    query: { enabled: !!address && !!stakeManagerAddress },
  });

  const { writeContractAsync } = useWriteContract();
  const { writeContractAsync: writeNFTContract } = useWriteContract();

  // --- stakingOptions больше не нужен, убираем его ---

  // Получить и сохранить картинку для NFT после стейкинга
  const assignNFTImage = async (address: string, tier: string, tokenId: string | number) => {
    try {
      // 1. Получить неиспользованную картинку
      const res = await axios.get(`/api/nft-image?address=${address}&tier=${tier}&token_id=${tokenId}`);
      const image = res.data.image;
      // 2. Сохранить выбранную картинку
      await axios.post('/api/nft-image', { address, tier, token_id: tokenId, image });
      return image;
    } catch (e) {
      return null;
    }
  };

  // --- handleStake ---
      const handleStake = async () => {
    if (!address || !padTokenAddress || !stakeManagerAddress) {
      toast({ title: 'Wallet not connected', description: 'Connect your wallet and select network', });
      console.error('No wallet or contract address');
      return;
    }
    if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) < 1000) {
      toast({ title: 'Enter amount', description: 'Минимум 1000 токенов для стейкинга', });
      console.error('Invalid stakeAmount:', stakeAmount);
      return;
    }
    // Валидация: не больше 3 знаков после запятой
    const decimalPart = stakeAmount.split('.')[1];
    if (decimalPart && decimalPart.length > 3) {
      setShowDecimalsDialog(true);
      return;
    }
    const amount = parseUnits(stakeAmount, 18);
    const months = Number(stakeMonths);
    if (amount < 1000 * 1e18) {
      toast({ title: 'Ошибка', description: 'Минимум 1000 токенов для стейкинга!' });
      return;
    }
    if (![3, 6, 9, 12].includes(months)) {
      toast({ title: 'Ошибка', description: 'Срок только 3, 6, 9 или 12 месяцев!' });
      return;
    }

    try {
      setIsApproving(true);
      // Проверяем allowance
      if (!allowance || BigInt(allowance) < amount) {
        await writeContractAsync({
          address: padTokenAddress,
          abi: PAD_TOKEN_ABI,
          functionName: 'approve',
          args: [stakeManagerAddress, amount],
        });
        toast({ title: 'Approve sent', description: 'Подтвердите разрешение в кошельке' });
        await refetchAllowance();
      }
      setIsApproving(false);
      setIsStaking(true);
      try {
        await writeContractAsync({
          address: stakeManagerAddress,
          abi: STAKE_MANAGER_ABI,
          functionName: 'createPosition',
          args: [amount, months],
        });
        await refetchBalance();
        await refetchPositions();
        // --- Новый блок: получить и сохранить картинку для NFT ---
        const tier = calculateTier(months, Number(stakeAmount));
        if (address && tier) {
          // Ждём появления нового NFT (после createPosition)
          let newNFT = null;
          for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const updatedNFTs = await refetchNFTs?.();
            if (updatedNFTs && Array.isArray(updatedNFTs)) {
              // Ищем NFT с нужным tier и amount
              newNFT = updatedNFTs.find((nft: any) => nft.tierInfo?.name === tier && String(nft.formattedAmountStaked) === String(stakeAmount));
              if (newNFT) break;
            }
          }
          if (newNFT && newNFT.tokenId) {
            const image = await assignNFTImage(address, tier, newNFT.tokenId);
            if (image) {
              setUserNFTImages(prev => ({ ...prev, [`${address}_${tier}_${newNFT.tokenId}`]: image }));
            }
          }
        }
        // --- конец блока ---
      } catch (err) {
        if (typeof window !== 'undefined') {
          console.error('createPosition error:', err);
        }
        throw err;
      }
      toast({ title: 'Staking transaction sent', description: 'Подтвердите транзакцию в кошельке' });
      setStakeAmount('');
      toast({ title: 'Staked!', description: 'Токены успешно застейканы' });
    } catch (e: any) {
      setIsApproving(false);
      setIsStaking(false);
      toast({ title: 'Ошибка', description: e?.message || 'Ошибка транзакции', });
      if (typeof window !== 'undefined') {
        console.error('Staking error:', e);
      }
      return;
    }
    setIsStaking(false);
  };

  // --- Удаляю калькулятор с часами и скидками, оставляю только отображение тира ---

  // Автоматически назначать изображение для каждого NFT
  useEffect(() => {
    async function assignImages() {
      if (!address || !nfts) return;
      for (const nft of nfts) {
        if (!nftImages[nft.tokenId]) {
          try {
            // 1. Получить или назначить изображение через API
            const res = await axios.get(`/api/nft-image?address=${address}&tier=${nft.tierInfo?.name}&token_id=${nft.tokenId}`);
            const image = res.data.image;
            if (image) {
              // 2. Сохранить связь, если это новое назначение
              await axios.post('/api/nft-image', { address, tier: nft.tierInfo?.name, token_id: nft.tokenId, image });
              setNftImages(prev => ({ ...prev, [nft.tokenId]: image }));
            }
          } catch (e) {
            // Если уже есть изображение, просто пропускаем
          }
        }
      }
    }
    assignImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfts, address]);

  const now = Date.now() / 1000;
  const currentPositions = positions.filter((pos: any) => pos.isActive && ((now - Number(pos.startTime)) / Number(pos.duration)) * 100 < 100);
  const pastPositions = positions.filter((pos: any) => !pos.isActive || ((now - Number(pos.startTime)) / Number(pos.duration)) * 100 >= 100);
  const tierName = calculateTier(Number(stakeMonths), Number(stakeAmount));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Staking Form */}
      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp size={20} className="text-emerald-400" />
              <span>Stake Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="stake-amount" className="text-white">Amount to Stake</Label>
              <Input
                id="stake-amount"
                type="number"
                min="1000"
                step="any"
                placeholder="Enter amount (min 1000)"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
              <Label className="text-white mt-4">Staking Duration (months)</Label>
              <div className="flex gap-2 mt-2">
                {[3, 6, 9, 12].map((m) => (
                  <Button key={m} variant={stakeMonths === m ? 'default' : 'outline'} onClick={() => setStakeMonths(m)}>{m} мес</Button>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-gray-400">Your Tier: </span>
                <Badge className={`ml-2 ${tierName === 'Bronze' ? 'bg-amber-600' : tierName === 'Silver' ? 'bg-gray-600' : tierName === 'Gold' ? 'bg-yellow-600' : tierName === 'Platinum' ? 'bg-emerald-600' : 'bg-gray-700'} text-white text-lg px-4 py-2`}>{tierName}</Badge>
                {tierImages[tierName] && <img src={tierImages[tierName]} alt={tierName} className="w-8 h-8 rounded" />}
              </div>
            </div>

            {/* --- Удаляю калькулятор с часами и скидками, оставляю только отображение тира --- */}

            {/* --- Удаляю калькулятор с часами и скидками, оставляю только отображение тира --- */}

            <Button 
              onClick={handleStake}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
              disabled={!stakeAmount || Number(stakeAmount) < 1000 || isApproving || isStaking}
            >
              {isApproving ? 'Approving...' : isStaking ? 'Staking...' : <><Shield className="mr-2" size={20} />Stake Tokens</>}
            </Button>
          </CardContent>
        </Card>

        {/* --- Удаляю калькулятор с часами и скидками, оставляю только отображение тира --- */}

        {/* Current Stakes */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield size={20} className="text-blue-400" />
              <span>Current Stakes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPositions ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading staking positions...</p>
              </div>
            ) : currentPositions.length > 0 ? (
              currentPositions.map((position: any, index: number) => {
                const safePosition = position as NonNullable<typeof position>;
                const nftsForPosition = nfts.filter(nft => nft.positionId === safePosition.id);
                const nftImage = nftsForPosition[0] ? (nftsForPosition[0].image || nftImages[nftsForPosition[0].tokenId]) : undefined;
                const progress = Math.min(100, ((now - Number(safePosition.startTime)) / Number(safePosition.duration)) * 100);
                const maxRewards = Math.floor(Number(safePosition.duration) / (30 * 24 * 60 * 60)); // 1 месяц = 30*24*60*60 секунд
                const claimedRewards = nftsForPosition.length;
                const unclaimedRewards = Math.max(0, maxRewards - claimedRewards);
                const canClaim = unclaimedRewards > 0 && Number(safePosition.nextMintAt) < now;
                return (
                  <div key={index} className="p-4 rounded-2xl bg-gray-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {nftImage && (
                          <img
                            src={nft.image || `/assets/${tierFolders[safePosition.tierInfo?.name]}/${nftImage}`}
                            alt="NFT"
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-white">{safePosition.formattedAmount} PADD-R</p>
                          <p className="text-sm text-gray-400">
                            {safePosition.tierInfo?.name} Tier • {formatDuration(safePosition.duration)} remaining
                          </p>
                        </div>
                      </div>
                      <Badge className={`${safePosition.isActive ? 'bg-emerald-600' : 'bg-gray-600'} text-white`}>
                        {safePosition.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-emerald-400">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-400">Started: {safePosition.formattedStartDate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Trophy size={14} className="text-emerald-400" />
                        <span className="text-emerald-400 font-bold">
                          Rewards: {claimedRewards} / {maxRewards}
                          {unclaimedRewards > 0 && (
                            <span className="ml-2 text-yellow-400">(+{unclaimedRewards} unclaimed)</span>
                          )}
                        </span>
                      </div>
                    </div>
                    {/* Кнопка Claim NFT */}
                    {canClaim && (
                      <Button
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 w-full"
                        onClick={async () => {
                          try {
                            const result = await writeContractAsync({
                              address: STAKE_MANAGER_ADDRESS,
                              abi: STAKE_MANAGER_ABI,
                              functionName: 'mintNextNFT',
                              args: [BigInt(safePosition.id)],
                            });
                            toast({ title: 'Claimed!', description: 'NFT успешно заминчен' });
                            await refetchPositions();
                          } catch (e: any) {
                            console.error('mintNextNFT error:', e);
                            toast({ title: 'Ошибка', description: e?.message || 'Ошибка mintNextNFT' });
                          }
                        }}
                      >
                        Claim NFT
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No staking positions yet</p>
                <p className="text-sm text-gray-500">Start staking to earn rewards and unlock tier benefits</p>
              </div>
            )}
          </CardContent>
        </Card>

        <hr className="my-8 border-gray-700" />

        {/* Past Stakes */}
        <div className="space-y-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield size={20} className="text-gray-400" />
                <span>Past Stakes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastPositions && pastPositions.length > 0 ? (
                pastPositions.map((position: any, idx: number) => {
                  const safePosition = position as NonNullable<typeof position>;
                  const nftsForPosition = nfts.filter(nft => nft.positionId === safePosition.id);
                  const progress = Math.min(100, ((now - Number(safePosition.startTime)) / Number(safePosition.duration)) * 100);
                  const rewardsCount = nftsForPosition.length;
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-gray-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{safePosition.formattedAmount} PADD-R</p>
                          <p className="text-sm text-gray-400">
                            {safePosition.tierInfo?.name} Tier • {formatDuration(safePosition.duration)}
                          </p>
                        </div>
                        <Badge className="bg-gray-600 text-white">Closed</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-emerald-400">100%</span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-gray-400">Started: {safePosition.formattedStartDate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Trophy size={14} className="text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Rewards: {rewardsCount}</span>
                        </div>
                      </div>
                      {/* Кнопка Claim NFT & Unstake если есть несобранные NFT */}
                      {safePosition.monthIndex > 0 && safePosition.isMature && safePosition.isActive && (
                        <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 w-full">
                          Claim NFT & Unstake
                        </Button>
                      )}
                      {/* Шторка с историей */}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-400">Show history</summary>
                        <div className="mt-2 text-sm text-gray-300">
                          <div>Staked: {safePosition.formattedAmount} PAD</div>
                          <div>Start: {safePosition.formattedStartDate}</div>
                          <div>End: {formatDate(BigInt(safePosition.startTime) + BigInt(safePosition.duration))}</div>
                          <div>Tier: {safePosition.tierInfo?.name} Tier • {formatDuration(safePosition.duration)} remaining</div>
                          <div>Rewards: {safePosition.formattedRewards}</div>
                        </div>
                      </details>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 py-8">No past stakes yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NFT Collection */}
      <div className="space-y-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">NFT Collection</h3>
          {isLoadingNFTs ? (
            <p className="text-gray-400">Loading NFTs...</p>
          ) : nfts.length === 0 ? (
            <p className="text-gray-500">You have no staking NFTs yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {nfts.map((nft) => {
                const imgKey = `${address}_${nft.tierInfo?.name}`;
                const image = userNFTImages[imgKey];
                const nftsForPosition = nfts.filter(nft => nft.positionId === nft.id);
                return (
                  <div key={nft.tokenId} className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white">NFT #{nft.tokenId}</span>
                      <span className="text-sm text-emerald-400 font-medium">{nftsForPosition.length} NFT</span>
                    </div>
                    {image && (
                      <img src={nft.image || `/assets/${tierFolders[nft.tierInfo?.name]}/${image}`} alt="NFT" className="w-24 h-24 object-cover rounded mb-2" />
                    )}
                    <div className="text-sm text-gray-300 mb-1">Staked: {nft.formattedAmountStaked} PAD</div>
                    <div className="text-sm text-gray-400 mb-1">Start: {nft.formattedStartDate}</div>
                    <div className="text-sm text-gray-400 mb-1">Next Mint: {nft.formattedNextMintDate}</div>
                    <div className="text-sm text-gray-400 mb-1">Month Index: {String(nft.monthIndex)}</div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-yellow-400">Не подтверждено</span>
                      <button className="px-2 py-1 bg-emerald-700 text-white rounded text-xs">Подтвердить</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDecimalsDialog} onOpenChange={setShowDecimalsDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-400">Too Many Decimal Places</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You can use up to <span className="text-emerald-400 font-semibold">3</span> decimal places for staking amount. Please correct your input (e.g. <span className="text-emerald-400 font-mono">1000.001</span>).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowDecimalsDialog(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}