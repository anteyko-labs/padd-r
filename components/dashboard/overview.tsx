'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wallet, Shield, Trophy, Clock, TrendingUp, Gift } from 'lucide-react';

export function Overview() {
  const userStats = {
    balance: '12,450',
    stakedAmount: '8,500',
    currentTier: 'Silver',
    nextRewardIn: 8,
    totalRewards: 156,
    stakingProgress: 60,
  };

  const recentActivity = [
    { type: 'stake', amount: '2,500 PADD-R', date: '2 hours ago', status: 'Confirmed' },
    { type: 'reward', amount: 'Silver NFT', date: '1 day ago', status: 'Received' },
    { type: 'voucher', amount: '7% Restaurant Discount', date: '3 days ago', status: 'Active' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400">Here's what's happening with your PADD-R tokens</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900/50 border-gray-800 card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Token Balance</p>
                <p className="text-2xl font-bold text-emerald-400">{userStats.balance}</p>
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
                <p className="text-2xl font-bold text-blue-400">{userStats.stakedAmount}</p>
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
                  <p className="text-2xl font-bold text-gray-300">{userStats.currentTier}</p>
                  <Badge className="bg-gray-600 text-white">NFT</Badge>
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
                <p className="text-2xl font-bold text-yellow-400">{userStats.nextRewardIn} days</p>
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
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/50">
              <div>
                <p className="font-semibold text-white">8,500 PADD-R</p>
                <p className="text-sm text-gray-400">Silver Tier • 52 days remaining</p>
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
                <p className="text-sm text-gray-400">Days Staked</p>
                <p className="text-lg font-bold text-white">38</p>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-xl">
                <p className="text-sm text-gray-400">Rewards Earned</p>
                <p className="text-lg font-bold text-emerald-400">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift size={20} className="text-purple-400" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'stake' ? 'bg-emerald-600/20' : 
                    activity.type === 'reward' ? 'bg-purple-600/20' : 'bg-yellow-600/20'
                  }`}>
                    {activity.type === 'stake' ? <TrendingUp size={16} className="text-emerald-400" /> :
                     activity.type === 'reward' ? <Gift size={16} className="text-purple-400" /> :
                     <Gift size={16} className="text-yellow-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{activity.amount}</p>
                    <p className="text-sm text-gray-400">{activity.date}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Ready to stake more?</h3>
              <p className="text-gray-300">Increase your tier and unlock better rewards</p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold transition-colors">
                Stake More
              </button>
              <button className="px-6 py-3 border border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 rounded-2xl font-semibold transition-colors">
                View Rewards
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}