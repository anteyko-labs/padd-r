'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Download, ExternalLink, QrCode, Eye, Star } from 'lucide-react';

export function RewardsPanel() {
  const nftRewards = [
    {
      name: 'Silver NFT',
      type: 'Tradeable NFT',
      tier: 'Silver',
      status: 'Active',
      benefits: ['7% discount', 'Car upgrades 2x/year', 'Priority booking'],
      image: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=300',
      tradeable: true,
      marketValue: '1.2 BNB',
    },
    {
      name: 'Gold NFT',
      type: 'Tradeable NFT',
      tier: 'Gold',
      status: 'Earned',
      benefits: ['10% discount', 'VIP restaurant access', 'Premium rentals'],
      image: 'https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=300',
      tradeable: true,
      marketValue: '2.5 BNB',
    },
  ];

  const vouchers = [
    {
      title: '7% Restaurant Discount',
      description: 'Valid at partner restaurants in Dubai',
      validUntil: 'Dec 31, 2025',
      status: 'Active',
      qrCode: true,
    },
    {
      title: 'Free Car Delivery',
      description: 'Complimentary delivery for luxury rentals',
      validUntil: 'Nov 30, 2025',
      status: 'Active',
      qrCode: false,
    },
    {
      title: 'VIP Table Reservation',
      description: 'Priority booking at premium venues',
      validUntil: 'Jan 15, 2026',
      status: 'Pending',
      qrCode: false,
    },
  ];

  const rewardHistory = [
    { date: '2024-11-15', reward: 'Silver NFT', type: 'NFT', status: 'Received' },
    { date: '2024-11-10', reward: '7% Restaurant Discount', type: 'Voucher', status: 'Active' },
    { date: '2024-11-05', reward: 'Free Car Delivery', type: 'Voucher', status: 'Used' },
  ];

  return (
    <div className="space-y-8">
      {/* NFT Rewards */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">NFT Collection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nftRewards.map((nft, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover overflow-hidden">
              <div className="relative">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge className={`${nft.tier === 'Gold' ? 'bg-yellow-600' : 'bg-gray-600'} text-white`}>
                    {nft.tier}
                  </Badge>
                </div>
                {nft.tradeable && (
                  <div className="absolute bottom-4 left-4">
                    <Badge className="bg-emerald-600 text-white">Tradeable</Badge>
                  </div>
                )}
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg text-white">{nft.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-600 text-emerald-400">
                    {nft.status}
                  </Badge>
                  {nft.marketValue && (
                    <span className="text-emerald-400 font-bold">{nft.marketValue}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Benefits</p>
                  <div className="space-y-1">
                    {nft.benefits.map((benefit, i) => (
                      <div key={i} className="text-sm text-gray-300 flex items-center">
                        <Star size={12} className="text-emerald-400 mr-2" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
                    <Eye size={16} className="mr-1" />
                    Details
                  </Button>
                  {nft.tradeable && (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <ExternalLink size={16} className="mr-1" />
                      Trade
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Vouchers */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Active Vouchers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.map((voucher, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover">
              <CardHeader>
                <CardTitle className="text-lg text-white">{voucher.title}</CardTitle>
                <Badge className={`w-fit ${
                  voucher.status === 'Active' ? 'bg-emerald-600' :
                  voucher.status === 'Pending' ? 'bg-yellow-600' : 'bg-gray-600'
                } text-white`}>
                  {voucher.status}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-300 text-sm">{voucher.description}</p>
                
                <div className="text-sm">
                  <span className="text-gray-400">Valid until: </span>
                  <span className="text-white">{voucher.validUntil}</span>
                </div>
                
                <div className="flex gap-2">
                  {voucher.qrCode && (
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <QrCode size={16} className="mr-1" />
                      Show QR
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`${voucher.qrCode ? 'flex-1' : 'w-full'} border-gray-600 text-gray-300`}
                  >
                    <Download size={16} className="mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Reward History */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift size={20} className="text-purple-400" />
            <span>Reward History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rewardHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/30">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Gift size={16} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.reward}</p>
                    <p className="text-sm text-gray-400">{item.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    {item.type}
                  </Badge>
                  <p className="text-sm text-gray-400 mt-1">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}