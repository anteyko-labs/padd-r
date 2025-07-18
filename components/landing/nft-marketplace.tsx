'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, TrendingUp } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NFTMarketplace() {
  const nfts = [
    {
      name: 'Silver NFT',
      type: 'Tradeable NFT',
      tier: 'Silver',
      benefits: ['7% discount', 'Car upgrades 2x/year', 'Priority booking'],
      image: 'https://images.unsplash.com/photo-1616536368667-99f53a750fb8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2lsdmVyfGVufDB8fDB8fHww',
      tradeable: true,
      rarity: 'Common',
      // price: '1.2 BNB',
    },
    {
      name: 'Gold NFT',
      type: 'Tradeable NFT',
      tier: 'Gold',
      benefits: ['10% discount', 'VIP restaurant access', 'Premium rentals'],
      image: 'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z29sZHxlbnwwfHwwfHx8MA%3D%3D',
      tradeable: true,
      rarity: 'Rare',
      // price: '2.5 BNB',
    },
    {
      name: 'Platinum NFT',
      type: 'Tradeable NFT',
      tier: 'Platinum',
      benefits: ['12% discount', 'Track days', 'Personal manager'],
      image: 'https://images.unsplash.com/photo-1641580543317-4cea85891afe?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTE0fHxjcnlwdG98ZW58MHx8MHx8fDA%3D',
      tradeable: true,
      rarity: 'Legendary',
      // price: '8.0 BNB',
    },
  ];
  const { isConnected, connectWallet, connectors } = useWallet();
  const router = useRouter();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleTrade = async (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    setLoadingIndex(index);
    if (!isConnected) {
      await connectWallet(connectors[0]?.id);
      setLoadingIndex(null);
      return;
    }
    router.push('/dashboard/rewards');
    setLoadingIndex(null);
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">NFT Marketplace</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Trade your tier NFTs or showcase your exclusive access passes
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {nfts.map((nft, index) => (
            <Card key={index} className="bg-gray-900/50 border-gray-800 card-hover group overflow-hidden">
              <div className="relative">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <Badge 
                    className={`${
                      nft.rarity === 'Legendary' ? 'bg-purple-600' :
                      nft.rarity === 'Rare' ? 'bg-yellow-600' : 'bg-gray-600'
                    } text-white`}
                  >
                    {nft.rarity}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl text-white">{nft.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-600 text-emerald-400">
                    {nft.tier} Tier
                  </Badge>
                  {/* Цена убрана */}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2">Benefits</div>
                  <div className="space-y-1">
                    {nft.benefits.map((benefit, i) => (
                      <div key={i} className="text-sm text-gray-300 flex items-center">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    <Eye size={16} className="mr-1" />
                    View Details
                  </Button>
                  {nft.tradeable && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={(e) => handleTrade(e, index)}
                      disabled={loadingIndex === index}
                    >
                      <ExternalLink size={16} className="mr-1" />
                      {loadingIndex === index ? '...' : 'Trade'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Marketplace Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { label: 'Total Volume', value: '1,250 BNB', icon: TrendingUp },
            { label: 'NFTs Traded', value: '3,420', icon: ExternalLink },
            { label: 'Active Holders', value: '8,900', icon: Eye },
            { label: 'Floor Price', value: '0.8 BNB', icon: TrendingUp },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
                <stat.icon size={20} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}