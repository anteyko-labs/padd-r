'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, ExternalLink, Shield, Mail, Phone, MapPin, Settings } from 'lucide-react';

export function UserProfile() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notifications, setNotifications] = useState(true);

  const userInfo = {
    walletAddress: '0x742d35Cc6Bf8fE5a02B5c4B4c8b4cB2',
    joinDate: 'October 2024',
    totalStaked: '13,500 PADD-R',
    currentTier: 'Silver',
    kycStatus: 'Pending',
    rewardsEarned: 8,
  };

  const tierProgress = [
    { tier: 'Bronze', required: '6 months - 1 year', achieved: true },
    { tier: 'Silver', required: '1 - 1.5 years', achieved: true },
    { tier: 'Gold', required: '1.5 - 2.5 years', achieved: false },
    { tier: 'Platinum', required: '2.5+ years', achieved: false },
  ];

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
            <Badge className="bg-gray-600 text-white mb-4">{userInfo.currentTier} Tier</Badge>
            <p className="text-sm text-gray-400">Member since {userInfo.joinDate}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6">
            <h4 className="font-semibold text-white mb-4">Account Stats</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Staked</span>
                <span className="text-emerald-400 font-semibold">{userInfo.totalStaked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rewards Earned</span>
                <span className="text-white font-semibold">{userInfo.rewardsEarned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Tier</span>
                <span className="text-white font-semibold">{userInfo.currentTier}</span>
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
          <CardTitle>Tier Progress</CardTitle>
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
                onClick={() => setNotifications(!notifications)}
                className={notifications ? "bg-emerald-600 hover:bg-emerald-700" : "border-gray-600 text-gray-300"}
              >
                {notifications ? 'On' : 'Off'}
              </Button>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              Save Settings
            </Button>
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
                  <p className="font-medium text-white">MetaMask</p>
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
                <span className="text-white">Binance Smart Chain</span>
              </div>
            </div>

            <div>
              <Label className="text-gray-400">Preferred Location</Label>
              <div className="flex items-center space-x-2 mt-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-white">Dubai, UAE</span>
              </div>
            </div>

            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
              <ExternalLink size={16} className="mr-2" />
              View on BscScan
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}