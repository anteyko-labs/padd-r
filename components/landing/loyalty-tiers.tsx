'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Star, Gem, Zap } from 'lucide-react';
import { useWallet } from '@/hooks/use-wallet';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';

function StakingButton({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isConnected } = useWallet();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();
  const handleClick = () => {
    if (isConnected) {
      router.push('/dashboard/stake');
    } else if (openConnectModal) {
      openConnectModal();
    }
  };
  return (
    <Button onClick={handleClick} className={className} variant="outline">
      {children}
    </Button>
  );
}

export function LoyaltyTiers() {
  const tiers = [
    {
      name: 'Bronze',
      duration: '6 months - 1 year',
      dayRange: '180-365 days',
      discount: '5%',
      perks: ['Free delivery', 'Basic support'],
      nft: 'Bronze NFT',
      color: 'from-amber-600 to-amber-800',
      icon: Zap,
      popular: false,
    },
    {
      name: 'Silver',
      duration: '1 - 1.5 years',
      dayRange: '365-547 days',
      discount: '7%',
      perks: ['Car upgrades 2x/year', 'Priority booking'],
      nft: 'Silver NFT',
      color: 'from-gray-400 to-gray-600',
      icon: Star,
      popular: true,
    },
    {
      name: 'Gold',
      duration: '1.5 - 2.5 years',
      dayRange: '547-912 days',
      discount: '10%',
      perks: ['VIP restaurant access', 'Premium rentals'],
      nft: 'Gold NFT',
      color: 'from-yellow-400 to-yellow-600',
      icon: Crown,
      popular: false,
    },
    {
      name: 'Platinum',
      duration: '2.5+ years',
      dayRange: '912+ days',
      discount: '12%',
      perks: ['Track days', 'Personal manager'],
      nft: 'Platinum NFT',
      color: 'from-emerald-400 to-emerald-600',
      icon: Gem,
      popular: false,
    },
  ];

  return (
    <section id="tiers" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="container mx-auto">
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
                <div className="absolute top-3 right-3">
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
                  <div className="text-2xl font-bold mb-1">{tier.dayRange}</div>
                  <div className="text-sm opacity-90">Staking Period</div>
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
                
                <StakingButton className="w-full bg-white/20 hover:bg-white/30 text-white border-0 font-semibold">
                  Start Staking
                </StakingButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}