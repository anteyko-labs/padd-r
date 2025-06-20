'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Shield, Info, Calculator, Clock, Trophy } from 'lucide-react';
import { usePadBalance } from '@/hooks/usePadBalance';
import { useStakingPositions } from '@/hooks/useStakingPositions';
import { TIER_LEVELS } from '@/lib/contracts/config';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { PAD_TOKEN_ABI, STAKE_MANAGER_ABI } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/config';
import { useToast } from '@/hooks/use-toast';
import { useNFTBalance } from '@/hooks/useNFTBalance';

export function StakingForm() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState('365');
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);

  const { toast } = useToast();
  const { address, chainId } = useAccount();
  const { balance, isLoading: isLoadingBalance } = usePadBalance();
  const { positions, isLoading: isLoadingPositions, totalStaked, totalRewards } = useStakingPositions();
  const { nfts, isLoading: isLoadingNFTs, totalNFTs } = useNFTBalance();

  const padTokenAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.PAD_TOKEN;
  const stakeManagerAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]?.STAKE_MANAGER;

  // Проверяем allowance
  const { data: allowance, refetch: refetchAllowance, isLoading: isLoadingAllowance } = useReadContract({
    address: padTokenAddress,
    abi: PAD_TOKEN_ABI,
    functionName: 'allowance',
    args: [address!, stakeManagerAddress],
    query: { enabled: !!address && !!stakeManagerAddress },
  });

  const { writeContractAsync } = useWriteContract();

  const stakingOptions = [
    { duration: '180', tier: 'Bronze', period: '6 months', discount: '5%', nft: 'Bronze NFT' },
    { duration: '270', tier: 'Bronze', period: '9 months', discount: '5%', nft: 'Bronze NFT' },
    { duration: '365', tier: 'Silver', period: '1 year', discount: '7%', nft: 'Silver NFT' },
    { duration: '547', tier: 'Silver', period: '1.5 years', discount: '7%', nft: 'Silver NFT' },
    { duration: '730', tier: 'Gold', period: '2 years', discount: '10%', nft: 'Gold NFT' },
    { duration: '912', tier: 'Platinum', period: '2.5 years', discount: '12%', nft: 'Platinum NFT' },
  ];

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
    const amountNum = parseFloat(stakeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({ title: 'Enter amount', description: 'Введите корректную сумму для стейкинга', });
      console.error('Invalid stakeAmount:', stakeAmount);
      return;
    }
    if (!stakeDuration || isNaN(Number(stakeDuration)) || Number(stakeDuration) <= 0) {
      toast({ title: 'Select duration', description: 'Выберите срок стейкинга', });
      console.error('Invalid stakeDuration:', stakeDuration);
      return;
    }
    const amount = BigInt(Math.floor(amountNum * 1e18));
    const duration = BigInt(Number(stakeDuration) * 24 * 60 * 60);
    try {
      setIsApproving(true);
      console.log('Checking allowance:', { allowance, amount });
      // Проверяем allowance
      if (!allowance || BigInt(allowance) < amount) {
        console.log('Calling approve...');
        const tx = await writeContractAsync({
          address: padTokenAddress,
          abi: PAD_TOKEN_ABI,
          functionName: 'approve',
          args: [stakeManagerAddress, amount],
        });
        toast({ title: 'Approve sent', description: 'Подтвердите разрешение в кошельке' });
        if (tx && tx.wait) await tx.wait();
        await refetchAllowance();
        console.log('Approve confirmed');
      }
      setIsApproving(false);
      setIsStaking(true);
      console.log('Calling createPosition...');
      const stakeTx = await writeContractAsync({
        address: stakeManagerAddress,
        abi: STAKE_MANAGER_ABI,
        functionName: 'createPosition',
        args: [amount, duration],
      });
      toast({ title: 'Staking transaction sent', description: 'Подтвердите транзакцию в кошельке' });
      if (stakeTx && stakeTx.wait) await stakeTx.wait();
      setStakeAmount('');
      toast({ title: 'Staked!', description: 'Токены успешно застейканы' });
      console.log('Staking confirmed');
    } catch (e: any) {
      setIsApproving(false);
      setIsStaking(false);
      toast({ title: 'Ошибка', description: e?.message || 'Ошибка транзакции', });
      console.error('Staking error:', e);
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
    return (Number(balance) / 1e18).toLocaleString();
  };

  const availableBalance = formatBalance(balance);

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
                          {option.duration} days • {option.discount} discount
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
            ) : positions.length > 0 ? (
              positions.map((position, index) => (
                <div key={index} className="p-4 rounded-2xl bg-gray-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{position.formattedAmount} PADD-R</p>
                      <p className="text-sm text-gray-400">
                        {position.tierInfo?.name} Tier • {position.daysRemaining} days remaining
                      </p>
                    </div>
                    <Badge className={`${
                      position.isActive ? 'bg-emerald-600' : 'bg-gray-600'
                    } text-white`}>
                      {position.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-emerald-400">
                        {Math.min(100, Math.ceil((Date.now() - Number(position.startTime) * 1000) / (Number(position.duration) * 1000 * 24 * 60 * 60) * 100))}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.ceil((Date.now() - Number(position.startTime) * 1000) / (Number(position.duration) * 1000 * 24 * 60 * 60) * 100))} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-gray-400">Started: {position.formattedStartDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Rewards: {position.formattedRewards}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No staking positions yet</p>
                <p className="text-sm text-gray-500">Start staking to earn rewards and unlock tier benefits</p>
              </div>
            )}
          </CardContent>
        </Card>
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
              {nfts.map((nft) => (
                <div key={nft.tokenId} className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">NFT #{nft.tokenId}</span>
                    <span className="text-sm text-emerald-400 font-medium">{nft.tierInfo?.name} Tier</span>
                  </div>
                  <div className="text-sm text-gray-300 mb-1">Staked: {nft.formattedAmountStaked} PAD</div>
                  <div className="text-sm text-gray-400 mb-1">Start: {nft.formattedStartDate}</div>
                  <div className="text-sm text-gray-400 mb-1">Next Mint: {nft.formattedNextMintDate}</div>
                  <div className="text-sm text-gray-400 mb-1">Month Index: {String(nft.monthIndex)}</div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-yellow-400">Не подтверждено</span>
                    <button className="px-2 py-1 bg-emerald-700 text-white rounded text-xs">Подтвердить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}