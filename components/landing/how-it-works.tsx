'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Shield, Gift, Trophy } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Wallet,
      title: 'Buy',
      description: 'Purchase PADD-R tokens on PancakeSwap',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Stake',
      description: 'Lock tokens for 3, 6, 9, 12 months to unlock tiers',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Gift,
      title: 'Get Rewards',
      description: 'Earn NFTs and exclusive benefits based on staking duration',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Trophy,
      title: 'Spend or Trade',
      description: 'Use benefits or sell NFTs',
      color: 'from-yellow-500 to-yellow-600',
    },
  ];

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Simple steps to unlock real-world luxury experiences based on staking duration
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <Card 
            key={index} 
            className="bg-gray-900/50 border-gray-800 text-center card-hover group"
          >
            <CardContent className="pt-8 pb-6">
              <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <step.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.description}</p>
              <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {index + 1}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Tier System</h3>
          <p className="text-gray-400">Your tier depends on how long you stake, not how much</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-amber-600/10 border border-amber-600/20 rounded-2xl">
            <div className="text-amber-400 font-bold text-lg mb-1">Bronze</div>
            <div className="text-sm text-gray-300">3 months</div>
            <div className="text-xs text-amber-400 mt-1">5% discount</div>
          </div>
          <div className="text-center p-4 bg-gray-600/10 border border-gray-600/20 rounded-2xl">
            <div className="text-gray-400 font-bold text-lg mb-1">Silver</div>
            <div className="text-sm text-gray-300">6 months</div>
            <div className="text-xs text-gray-400 mt-1">7% discount</div>
          </div>
          <div className="text-center p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-2xl">
            <div className="text-yellow-400 font-bold text-lg mb-1">Gold</div>
            <div className="text-sm text-gray-300">9 months</div>
            <div className="text-xs text-yellow-400 mt-1">10% discount</div>
          </div>
          <div className="text-center p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl">
            <div className="text-emerald-400 font-bold text-lg mb-1">Platinum</div>
            <div className="text-sm text-gray-300">12 months</div>
            <div className="text-xs text-emerald-400 mt-1">12% discount</div>
          </div>
        </div>
      </div>
    </div>
  );
}