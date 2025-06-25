'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, ExternalLink, Shield, Mail, Phone, MapPin, Settings, Trophy, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';
import { usePadBalance } from '@/hooks/usePadBalance';
import { useStakingPositions } from '@/hooks/useStakingPositions';
import { useNFTBalance } from '@/hooks/useNFTBalance';
import { TIER_LEVELS, formatDate, formatTokenAmount } from '@/lib/contracts/config';

export function UserProfile() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { address, chainId } = useAccount();
  const { balance, isLoading: isLoadingBalance } = usePadBalance();
  const { positions, isLoading: isLoadingPositions, totalStaked, totalRewards, currentTier } = useStakingPositions();
  const { totalNFTs, isLoading: isLoadingNFTs, currentTier: nftTier } = useNFTBalance();

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/profile?address=${address}`)
      .then(async res => {
        if (!res.ok) throw new Error('Network response was not ok');
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then(data => {
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setNotifications(data.notifications !== undefined ? data.notifications : true);
        setLoading(false);
      })
      .catch(err => {
        setLoading(false);
        console.error('Profile fetch error:', err);
      });
  }, [address]);

  const handleSave = async () => {
    console.log('Save button clicked!');
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, email, phone, notifications }),
      });
      if (res.ok) {
        setIsEditing(false);
        // Можно добавить toast об успехе
      } else {
        // Можно добавить toast об ошибке
      }
    } finally {
      setLoading(false);
    }
  };

  // Форматируем адрес кошелька
  const formatAddress = (address: string | undefined) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Получаем лучший тир
  let bestTier: string = String(currentTier) !== 'None' ? String(currentTier) : String(nftTier);
  if (!positions.length && (!nftTier || nftTier === 'None')) bestTier = 'No Tier';

  // Форматируем баланс
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return formatTokenAmount(balance);
  };

  const userInfo = {
    walletAddress: formatAddress(address),
    joinDate: 'October 2024',
    totalStaked: `${totalStaked.toFixed(2)} PADD-R`,
    currentTier: bestTier,
    kycStatus: 'Pending',
    rewardsEarned: totalRewards.toFixed(2),
    tokenBalance: formatBalance(balance),
    nftCount: totalNFTs,
  };

  // Определяем достигнутые тиры на основе позиций
  const achievedTiers = new Set<string>();
  positions.forEach(position => {
    if (position && position.tierInfo?.name) {
      achievedTiers.add(position.tierInfo.name);
    }
  });

  const tierProgress = [
    { tier: 'Bronze', required: '6 months - 1 year', achieved: achievedTiers.has('Bronze') },
    { tier: 'Silver', required: '1 - 1.5 years', achieved: achievedTiers.has('Silver') },
    { tier: 'Gold', required: '1.5 - 2.5 years', achieved: achievedTiers.has('Gold') },
    { tier: 'Platinum', required: '2.5+ years', achieved: achievedTiers.has('Platinum') },
  ];

  const tierColors: Record<string, string> = {
    'Bronze': 'text-amber-400',
    'Silver': 'text-gray-400',
    'Gold': 'text-yellow-400',
    'Platinum': 'text-emerald-400',
    'No Tier': 'text-gray-400',
  };
  const badgeColors: Record<string, string> = {
    'Bronze': 'bg-amber-600',
    'Silver': 'bg-gray-600',
    'Gold': 'bg-yellow-600',
    'Platinum': 'bg-emerald-600',
    'No Tier': 'bg-gray-700',
  };

  return (
    <div className="space-y-8">
      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">PADD-R Member</h3>
            <Badge className={`${badgeColors[bestTier]} text-white mb-4`}>{bestTier} Tier</Badge>
            <p className="text-sm text-gray-400">Member since {userInfo.joinDate}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <h4 className="font-semibold text-white mb-4">Account Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Token Balance</span>
                <span className="text-emerald-400 font-semibold">
                  {isLoadingBalance ? 'Loading...' : `${userInfo.tokenBalance} PAD`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Staked</span>
                <span className="text-blue-400 font-semibold">
                  {isLoadingPositions ? 'Loading...' : userInfo.totalStaked}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rewards Earned</span>
                <span className="text-white font-semibold">
                  {isLoadingPositions ? 'Loading...' : `${userInfo.rewardsEarned} PAD`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NFTs Owned</span>
                <span className="text-purple-400 font-semibold">
                  {isLoadingNFTs ? 'Loading...' : userInfo.nftCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <h4 className="font-semibold text-white mb-4">KYC Status</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-600 text-white">{userInfo.kycStatus}</Badge>
                <Shield size={16} className="text-yellow-400" />
              </div>
              <p className="text-sm text-gray-400">
                Complete KYC verification to access premium concierge services
              </p>
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                Complete KYC
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Progress */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy size={20} className="text-yellow-400" />
            <span>Tier Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {tierProgress.map((tier, index) => (
              <div key={index} className={`p-4 rounded-2xl border ${
                tier.achieved ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-700 bg-gray-800/30'
              }`}>
                <div className="text-center">
                  <h4 className={`font-semibold mb-2 ${tier.achieved ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {tier.tier}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">{tier.required}</p>
                  {tier.achieved ? (
                    <Badge className="bg-emerald-600 text-white">Achieved</Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-600 text-gray-400">Locked</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings size={20} className="text-gray-400" />
              <span>Profile Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail size={16} className="text-gray-400" />
                <span>Email (Optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone size={16} className="text-gray-400" />
                <span>Phone (Optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+971 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white mt-2"
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive updates about rewards and tier changes</p>
              </div>
              <Button
                variant={notifications ? "default" : "outline"}
                size="sm"
                onClick={() => isEditing && setNotifications(!notifications)}
                className={notifications ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-600 text-gray-300"}
                disabled={!isEditing}
              >
                {notifications ? 'On' : 'Off'}
              </Button>
            </div>

            {isEditing ? (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                Save Settings
              </Button>
            ) : (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle>Wallet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-gray-400">Connected Wallet</Label>
              <div className="flex items-center justify-between mt-2 p-3 bg-gray-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-white">Web3 Wallet</p>
                  <p className="text-sm text-gray-400 font-mono">{userInfo.walletAddress}</p>
                </div>
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <ExternalLink size={16} className="mr-1" />
                  View
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            <div>
              <Label className="text-gray-400">Network</Label>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span className="text-white">
                  {chainId === 11155111 ? 'Sepolia Testnet' : chainId === 1 ? 'Ethereum Mainnet' : `Chain ID: ${chainId}`}
                </span>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            <div>
              <Label className="text-gray-400">Account Summary</Label>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active Positions</span>
                  <span className="text-white">{positions.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total NFTs</span>
                  <span className="text-purple-400">{totalNFTs}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Tier</span>
                  <span className="font-semibold text-emerald-400">{bestTier}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}