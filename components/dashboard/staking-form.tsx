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

// Безопасный перевод строки в wei (bigint)
function parseUnits(amount: string, decimals: number = 18): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const normalizedFraction = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole + normalizedFraction);
}

export function StakingForm() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState('365');
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [showDecimalsDialog, setShowDecimalsDialog] = useState(false);
  const [userNFTImages, setUserNFTImages] = useState<Record<string, string>>({}); // tokenId -> image
  const [nftImages, setNftImages] = useState<Record<number, string>>({}); // tokenId -> image_name
  const [stakeError, setStakeError] = useState<string | null>(null);

  const { toast } = useToast();
  const { address, chainId } = useAccount();
  const { balance, isLoading: isLoadingBalance, refetch: refetchBalance } = usePadBalance();
  const { positions, isLoading: isLoadingPositions, totalStaked, totalRewards, refetch: refetchPositions } = useStakingPositions();
  const { nfts, isLoading: isLoadingNFTs, totalNFTs } = useNFTBalance();

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

  const stakingOptions = [
    { duration: '1', tier: 'Bronze', period: '1 hour', discount: '5%', nft: 'Bronze NFT' },
    { duration: '4', tier: 'Silver', period: '4 hours', discount: '7%', nft: 'Silver NFT' },
    { duration: '7', tier: 'Gold', period: '7 hours', discount: '10%', nft: 'Gold NFT' },
    { duration: '9', tier: 'Platinum', period: '9 hours', discount: '12%', nft: 'Platinum NFT' },
    { duration: '10', tier: 'Platinum', period: '10 hours', discount: '12%', nft: 'Platinum NFT' },
  ];

  // Получить и сохранить картинку для NFT после стейкинга
  const assignNFTImage = async (address: string, tier: string) => {
    try {
      // 1. Получить неиспользованную картинку
      const res = await axios.get(`/api/nft-image?address=${address}&tier=${tier}`);
      const image = res.data.image;
      // 2. Сохранить выбранную картинку
      await axios.post('/api/nft-image', { address, tier, image });
      return image;
    } catch (e) {
      return null;
    }
  };

  const handleStake = async () => {
    console.log('handleStake called');
    console.log('address:', address);
    console.log('chainId:', chainId);
    console.log('padTokenAddress:', padTokenAddress);
    console.log('stakeManagerAddress:', stakeManagerAddress);
    console.log('writeContractAsync:', writeContractAsync);
    console.log('Stake button clicked', { stakeAmount, stakeDuration });
    if (!address || !padTokenAddress || !stakeManagerAddress) {
      toast({ title: 'Wallet not connected', description: 'Connect your wallet and select network', });
      console.error('No wallet or contract address');
      return;
    }
    if (!stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
      toast({ title: 'Enter amount', description: 'Введите корректную сумму для стейкинга', });
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
    const durationHours = Number(stakeDuration);
    const duration = BigInt(durationHours * 60 * 60); // часы -> секунды
    if (typeof window !== 'undefined') {
      console.log('handleStake:');
      console.log('stakeAmount:', stakeAmount);
      console.log('stakeDuration:', stakeDuration);
      console.log('duration (сек):', duration.toString());
      console.log('stakingOptions:', stakingOptions);
      if (durationHours < 1 || durationHours > 10) {
        console.error('Ошибка: срок должен быть от 1 до 10 часов!');
      }
    }
    if (durationHours < 1 || durationHours > 10) {
      toast({ title: 'Ошибка', description: 'Срок должен быть от 1 до 10 часов!' });
      return;
    }
    if (typeof window !== 'undefined') {
      console.log('handleStake:');
      console.log('stakeAmount:', stakeAmount);
      console.log('stakeDuration:', stakeDuration);
      console.log('duration (сек):', Number(stakeDuration) * 60 * 60);
      console.log('address:', address);
      console.log('padTokenAddress:', padTokenAddress);
      console.log('stakeManagerAddress:', stakeManagerAddress);
    }
    try {
      setIsApproving(true);
      console.log('Checking allowance:', { allowance, amount });
      // Проверяем allowance
      if (!allowance || BigInt(allowance) < amount) {
        console.log('Calling approve...');
        await writeContractAsync({
          address: padTokenAddress,
          abi: PAD_TOKEN_ABI,
          functionName: 'approve',
          args: [stakeManagerAddress, amount],
        });
        toast({ title: 'Approve sent', description: 'Подтвердите разрешение в кошельке' });
        await refetchAllowance();
        console.log('Approve confirmed');
      }
      setIsApproving(false);
      setIsStaking(true);
      console.log('Calling createPosition...');
      try {
        await writeContractAsync({
          address: stakeManagerAddress,
          abi: STAKE_MANAGER_ABI,
          functionName: 'createPosition',
          args: [amount, duration],
        });
        await refetchBalance();
        await refetchPositions();
        // --- Новый блок: получить и сохранить картинку для NFT ---
        const tier = selectedOption?.tier;
        if (address && tier) {
          const image = await assignNFTImage(address, tier);
          if (image) {
            setUserNFTImages(prev => ({ ...prev, [`${address}_${tier}_${Date.now()}`]: image }));
          }
        }
        // --- конец блока ---
      } catch (err: any) {
        if (typeof err?.message === 'string' && err.message.includes('Too many positions')) {
          toast({ title: 'Лимит позиций', description: 'Можно иметь не более 10 активных позиций. Закройте одну из существующих, чтобы создать новую.' });
          setIsStaking(false);
          return;
        }
        if (typeof window !== 'undefined') {
          console.error('createPosition error:', err);
        }
        throw err;
      }
      toast({ title: 'Staking transaction sent', description: 'Подтвердите транзакцию в кошельке' });
      setStakeAmount('');
      toast({ title: 'Staked!', description: 'Токены успешно застейканы' });
      console.log('Staking confirmed');
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

  const selectedOption = stakingOptions.find(option => option.duration === stakeDuration);

  const getTierByDuration = (days: string) => {
    const numDays = parseInt(days);
    if (numDays < 180) return 'None';
    if (numDays < 365) return 'Bronze';
    if (numDays < 547) return 'Silver';
    if (numDays < 912) return 'Gold';
    return 'Platinum';
  };

  const getDiscountByDuration = (days: string) => {
    const numDays = parseInt(days);
    if (numDays < 180) return '0%';
    if (numDays < 365) return '5%';
    if (numDays < 547) return '7%';
    if (numDays < 912) return '10%';
    return '12%';
  };

  // Форматируем баланс
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return formatTokenAmount(balance);
  };

  const availableBalance = formatBalance(balance);

  const now = Date.now() / 1000;
  const currentPositions = positions.filter(pos => pos.isActive && ((now - Number(pos.startTime)) / Number(pos.duration)) * 100 < 100);
  const pastPositions = positions.filter(pos => !pos.isActive || ((now - Number(pos.startTime)) / Number(pos.duration)) * 100 >= 100);

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

  // Проверка баланса
  const maxStake = balance ? Number(formatTokenAmount(balance)) : 0;
  const isStakeTooMuch = stakeAmount && Number(stakeAmount) > maxStake;
  const isStakeInvalid = !stakeAmount || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0 || isStakeTooMuch;

  useEffect(() => {
    if (isStakeTooMuch) {
      setStakeError('Недостаточно средств на балансе');
    } else {
      setStakeError(null);
    }
  }, [stakeAmount, maxStake]);

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
                min="0.0001"
                step="any"
                placeholder="Enter amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
              {isLoadingBalance ? (
                <p className="text-sm text-gray-400 mt-1">Loading balance...</p>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Available: {availableBalance} PADD-R</p>
              )}
              {stakeError && <div className="text-red-500 text-xs mt-1">{stakeError}</div>}
            </div>

            <div>
              <Label className="text-white">Staking Duration & Tier</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {stakingOptions.map((option) => (
                  <div
                    key={option.duration}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      stakeDuration === option.duration
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }`}
                    onClick={() => setStakeDuration(option.duration)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{option.period}</span>
                          <Badge className={`${
                            option.tier === 'Platinum' ? 'bg-emerald-600' :
                            option.tier === 'Gold' ? 'bg-yellow-600' :
                            option.tier === 'Silver' ? 'bg-gray-600' : 'bg-amber-600'
                          } text-white`}>
                            {option.tier}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          {option.duration} hours • {option.discount} discount
                        </p>
                      </div>
                      {option.nft && (
                        <div className="text-right">
                          <p className="text-sm text-emerald-400 font-medium">{option.nft}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedOption && (
              <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <Info size={16} className="text-emerald-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-emerald-400 font-medium mb-1">
                      {selectedOption.tier} Tier Benefits
                    </p>
                    <p className="text-gray-300">
                      {selectedOption.discount} discount on all services
                      {selectedOption.nft && `, ${selectedOption.nft} reward`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleStake}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
              // disabled={!stakeAmount || parseInt(stakeAmount) < 1 || isApproving || isStaking}
            >
              {isApproving ? 'Approving...' : isStaking ? 'Staking...' : <><Shield className="mr-2" size={20} />Stake Tokens</>}
            </Button>
          </CardContent>
        </Card>

        {/* Staking Calculator */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator size={20} className="text-blue-400" />
              <span>Staking Calculator</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-800/30 rounded-xl text-center">
                <p className="text-sm text-gray-400">Estimated Tier</p>
                <p className="text-lg font-bold text-white">
                  {stakeDuration ? getTierByDuration(stakeDuration) : 'None'}
                </p>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-xl text-center">
                <p className="text-sm text-gray-400">Discount Rate</p>
                <p className="text-lg font-bold text-emerald-400">
                  {stakeDuration ? getDiscountByDuration(stakeDuration) : '0%'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-800/30 rounded-xl text-center">
                <p className="text-sm text-gray-400">Total Staked</p>
                <p className="text-lg font-bold text-blue-400">
                  {isLoadingPositions ? 'Loading...' : `${totalStaked.toFixed(2)} PAD`}
                </p>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-xl text-center">
                <p className="text-sm text-gray-400">Total Rewards</p>
                <p className="text-lg font-bold text-emerald-400">
                  {isLoadingPositions ? 'Loading...' : `${totalRewards.toFixed(2)} PAD`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Stakes */}
      <div className="space-y-6">
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
              currentPositions.map((position, index) => {
                const safePosition = position as NonNullable<typeof position>;
                const nftsForPosition = nfts.filter(nft => Number(nft.positionId) === Number(safePosition.id));
                const nftImage = nftsForPosition[0] ? nftImages[nftsForPosition[0].tokenId] : undefined;
                const progress = Math.min(100, ((now - Number(safePosition.startTime)) / Number(safePosition.duration)) * 100);
                const maxRewards = Math.floor(Number(safePosition.duration) / 1800); // 30 минут = 1800 секунд
                const claimedRewards = nftsForPosition.length;
                const unclaimedRewards = Math.max(0, maxRewards - claimedRewards);
                const canClaim = unclaimedRewards > 0 && Number(safePosition.nextMintAt) < now;
                const displayClaimedRewards = claimedRewards + (canClaim ? 1 : 0);
                return (
                  <div key={index} className="p-4 rounded-2xl bg-gray-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {nftImage && (
                          <img
                            src={`/assets/${tierFolders[safePosition.tierInfo?.name]}/${nftImage}`}
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
                          Rewards: {displayClaimedRewards} / {maxRewards}
                        </span>
                      </div>
                    </div>
                    {/* Кнопка Claim NFT */}
                    {canClaim && (
                      <Button
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 w-full"
                        onClick={async () => {
                          console.log('Claim NFT clicked', safePosition.id, {
                            address: STAKE_MANAGER_ADDRESS,
                            abi: STAKE_MANAGER_ABI,
                            functionName: 'mintNextNFT',
                            args: [BigInt(safePosition.id)],
                          });
                          try {
                            const result = await writeContractAsync({
                              address: STAKE_MANAGER_ADDRESS,
                              abi: STAKE_MANAGER_ABI,
                              functionName: 'mintNextNFT',
                              args: [BigInt(safePosition.id)],
                            });
                            console.log('mintNextNFT result:', result);
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
                pastPositions.map((position, idx) => {
                  const safePosition = position as NonNullable<typeof position>;
                  const nftsForPosition = nfts.filter(nft => Number(nft.positionId) === Number(safePosition.id));
                  const progress = Math.min(100, ((now - Number(safePosition.startTime)) / Number(safePosition.duration)) * 100);
                  const rewardsCount = nftsForPosition.length;
                  const maxRewards = Math.floor(Number(safePosition.duration) / 1800); // 30 минут = 1800 секунд
                  // Определяем, можно ли забрать NFT (по таймеру)
                  const unclaimedRewards = Math.max(0, maxRewards - rewardsCount);
                  const canClaim = unclaimedRewards > 0 && Number(safePosition.nextMintAt) < now;
                  // Для отображения: если можно забрать NFT, увеличиваем rewardsCount на 1
                  const displayRewardsCount = rewardsCount + (canClaim ? 1 : 0);
                  const canUnstake = safePosition.isActive && safePosition.isMature && rewardsCount === maxRewards;
                  const canClaimAndUnstake = safePosition.isActive && safePosition.isMature && rewardsCount < maxRewards;
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
                          <span className="text-emerald-400 font-bold">Rewards: {displayRewardsCount} / {maxRewards}</span>
                        </div>
                      </div>
                      {/* Кнопка Claim NFT & Unstake если есть несобранные NFT */}
                      {canClaimAndUnstake && (
                        <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 w-full"
                          onClick={async () => {
                            try {
                              // Сначала claim NFT
                              await writeContractAsync({
                                address: STAKE_MANAGER_ADDRESS,
                                abi: STAKE_MANAGER_ABI,
                                functionName: 'mintNextNFT',
                                args: [BigInt(safePosition.id)],
                              });
                              // Затем unstake
                              await writeContractAsync({
                                address: STAKE_MANAGER_ADDRESS,
                                abi: STAKE_MANAGER_ABI,
                                functionName: 'closePosition',
                                args: [BigInt(safePosition.id)],
                              });
                              toast({ title: 'Unstaked!', description: 'Позиция успешно закрыта и NFT собран.' });
                              await refetchPositions();
                            } catch (e: any) {
                              toast({ title: 'Ошибка', description: e?.message || 'Ошибка Claim NFT & Unstake' });
                            }
                          }}
                        >
                          Claim NFT & Unstake
                        </Button>
                      )}
                      {/* Кнопка Unstake если все NFT уже собраны */}
                      {canUnstake && (
                        <Button className="mt-2 bg-emerald-600 hover:bg-emerald-700 w-full"
                          onClick={async () => {
                            try {
                              await writeContractAsync({
                                address: STAKE_MANAGER_ADDRESS,
                                abi: STAKE_MANAGER_ABI,
                                functionName: 'closePosition',
                                args: [BigInt(safePosition.id)],
                              });
                              toast({ title: 'Unstaked!', description: 'Позиция успешно закрыта.' });
                              await refetchPositions();
                            } catch (e: any) {
                              toast({ title: 'Ошибка', description: e?.message || 'Ошибка Unstake' });
                            }
                          }}
                        >
                          Unstake
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
                      <img src={`/assets/${tierFolders[nft.tierInfo?.name]}/${image}`} alt="NFT" className="w-24 h-24 object-cover rounded mb-2" />
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