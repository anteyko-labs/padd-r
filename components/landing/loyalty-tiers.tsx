'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Star, Gem, Zap } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';

export function LoyaltyTiers() {
  const { isConnected, connectWallet, connectors } = useWallet();
  const router = useRouter();
  const tiers = [
    {
      name: 'Bronze',
      duration: '3 months',
      minAmount: '1000+',
      discount: '5%',
      perks: ['Free delivery', 'Basic support'],
      nft: 'Bronze NFT',
      color: 'from-amber-600 to-amber-800',
      icon: Zap,
      popular: false,
    },
    {
      name: 'Silver',
      duration: '6 months',
      minAmount: '1000+',
      discount: '7%',
      perks: ['Car upgrades 2x/year', 'Priority booking'],
      nft: 'Silver NFT',
      color: 'from-gray-400 to-gray-600',
      icon: Star,
      popular: true,
    },
    {
      name: 'Gold',
      duration: '9 months',
      minAmount: '1000+',
      discount: '10%',
      perks: ['VIP restaurant access', 'Premium rentals'],
      nft: 'Gold NFT',
      color: 'from-yellow-400 to-yellow-600',
      icon: Crown,
      popular: false,
    },
    {
      name: 'Platinum',
      duration: '12 months',
      minAmount: '1000+',
      discount: '12%',
      perks: [],
      nft: 'Platinum NFT',
      color: 'from-emerald-500 to-emerald-800',
      icon: Gem,
      popular: false,
    },
  ];

  const handleStartStaking = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!isConnected) {
      await connectWallet(connectors[0]?.id);
    }
    router.push('/dashboard/stake');
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Loyalty Tiers</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Stake longer, earn more. Unlock exclusive benefits and NFT rewards based on staking duration.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {tiers.map((tier, index) => (
          <Card 
            key={index} 
            className={`relative bg-gradient-to-br ${tier.color} border-0 text-white card-hover ${tier.popular ? 'ring-2 ring-emerald-400' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                <tier.icon size={24} className="text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
              <CardDescription className="text-white/80 font-medium">{tier.duration}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{tier.duration}</div>
                <div className="text-sm opacity-90">Staking Period</div>
                <div className="text-xs text-gray-200 mt-1">Min. {tier.minAmount} PAD</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-300 mb-1">{tier.discount}</div>
                <div className="text-sm opacity-90">Discount</div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-2 font-medium">Benefits</div>
                <div className="space-y-1">
                  {tier.perks.map((perk, i) => (
                    <Badge key={i} variant="secondary" className="mr-1 mb-1 bg-white/20 text-white border-0 text-xs">
                      {perk}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">NFT Reward</div>
                <div className="font-semibold text-yellow-300">{tier.nft}</div>
              </div>
              <Button 
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0 font-semibold"
                variant="outline"
                onClick={handleStartStaking}
              >
                Start Staking
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}