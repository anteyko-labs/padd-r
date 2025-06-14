'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Shield, Info, Calculator } from 'lucide-react';

export function StakingForm() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeDuration, setStakeDuration] = useState('365');

  const stakingOptions = [
    { duration: '180', tier: 'Bronze', period: '6 months', discount: '5%', nft: 'Bronze NFT' },
    { duration: '270', tier: 'Bronze', period: '9 months', discount: '5%', nft: 'Bronze NFT' },
    { duration: '365', tier: 'Silver', period: '1 year', discount: '7%', nft: 'Silver NFT' },
    { duration: '547', tier: 'Silver', period: '1.5 years', discount: '7%', nft: 'Silver NFT' },
    { duration: '730', tier: 'Gold', period: '2 years', discount: '10%', nft: 'Gold NFT' },
    { duration: '912', tier: 'Platinum', period: '2.5 years', discount: '12%', nft: 'Platinum NFT' },
  ];

  const currentStakes = [
    {
      amount: '8,500',
      tier: 'Silver',
      daysRemaining: 52,
      progress: 60,
      status: 'Active',
    },
    {
      amount: '2,000',
      tier: 'Bronze',
      daysRemaining: 12,
      progress: 85,
      status: 'Active',
    },
  ];

  const handleStake = () => {
    console.log(`Staking ${stakeAmount} tokens for ${stakeDuration} days`);
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
                placeholder="Enter amount"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
              />
              <p className="text-sm text-gray-400 mt-1">Available: 12,450 PADD-R</p>
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
              disabled={!stakeAmount || parseInt(stakeAmount) < 1}
            >
              <Shield className="mr-2" size={20} />
              Stake Tokens
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
          </CardContent>
        </Card>
      </div>

      {/* Current Stakes */}
      <div className="space-y-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Current Stakes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStakes.map((stake, index) => (
              <div key={index} className="p-4 rounded-2xl bg-gray-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{stake.amount} PADD-R</p>
                    <p className="text-sm text-gray-400">
                      {stake.tier} Tier • {stake.daysRemaining} days remaining
                    </p>
                  </div>
                  <Badge className="bg-emerald-600 text-white">{stake.status}</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-emerald-400">{stake.progress}% complete</span>
                  </div>
                  <Progress value={stake.progress} className="h-2" />
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10">
                    Unstake Early
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Staking Info */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Staking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum Stake</span>
                <span className="text-white">Any amount</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tier Based On</span>
                <span className="text-emerald-400">Staking Duration</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bronze Tier</span>
                <span className="text-white">6 months - 1 year</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Silver Tier</span>
                <span className="text-white">1 - 1.5 years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gold Tier</span>
                <span className="text-white">1.5 - 2.5 years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platinum Tier</span>
                <span className="text-white">2.5+ years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Early Unstake Penalty</span>
                <span className="text-red-400">Forfeit rewards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reward Distribution</span>
                <span className="text-white">At stake completion</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NFT Eligibility</span>
                <span className="text-emerald-400">All tiers</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}