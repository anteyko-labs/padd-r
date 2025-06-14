'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Calendar } from 'lucide-react';

export function Roadmap() {
  const roadmapItems = [
    {
      quarter: 'Q3 2025',
      title: 'Token Launch',
      status: 'completed',
      items: [
        'PADD-R token deployment',
        'PancakeSwap listing',
        'Initial staking pools',
        'Bronze & Silver tiers',
      ],
    },
    {
      quarter: 'Q4 2025',
      title: 'NFT & Marketplace',
      status: 'in-progress',
      items: [
        'Gold & Platinum NFTs',
        'OpenSea integration',
        'Concierge MVP launch',
        'Restaurant partnerships',
      ],
    },
    {
      quarter: 'Q1 2026',
      title: 'Real Estate Integration',
      status: 'planned',
      items: [
        'Hotel booking system',
        'Property investment access',
        'Dubai expansion',
        'Mobile app launch',
      ],
    },
    {
      quarter: 'Q2 2026',
      title: 'Global Expansion',
      status: 'planned',
      items: [
        'International partnerships',
        'Multi-chain support',
        'Advanced analytics',
        'DAO governance',
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'in-progress':
        return <Clock className="text-yellow-400" size={20} />;
      default:
        return <Calendar className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-600';
      case 'in-progress':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <section id="roadmap" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Roadmap</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our journey to revolutionize luxury service access
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700 hidden md:block" />
            
            <div className="space-y-8">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-4 h-4 rounded-full border-4 border-gray-900 hidden md:block" 
                       style={{ backgroundColor: item.status === 'completed' ? '#22c55e' : item.status === 'in-progress' ? '#eab308' : '#6b7280' }} />
                  
                  <Card className="bg-gray-900/50 border-gray-800 md:ml-16 card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(item.status)}
                          <div>
                            <h3 className="text-xl font-bold text-white">{item.title}</h3>
                            <p className="text-emerald-400 font-semibold">{item.quarter}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(item.status)} text-white capitalize`}>
                          {item.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.items.map((feature, i) => (
                          <div key={i} className="flex items-center text-gray-300">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}