'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Car, Utensils, ConciergeBell, Building } from 'lucide-react';

export function UtilityHighlights() {
  const utilities = [
    {
      icon: Car,
      title: 'Car Rental',
      description: 'Ferrari, G63, luxury fleet',
      gradient: 'from-red-500 to-red-700',
      benefits: ['Premium vehicles', 'Priority booking', 'Exclusive models'],
    },
    {
      icon: Utensils,
      title: 'Restaurant',
      description: 'VIP tables, free delivery',
      gradient: 'from-orange-500 to-orange-700',
      benefits: ['VIP reservations', 'Free delivery', 'Chef specials'],
    },
    {
      icon: ConciergeBell,
      title: 'Concierge',
      description: 'Personal assistant services',
      gradient: 'from-purple-500 to-purple-700',
      benefits: ['24/7 support', 'Event planning', 'Travel assistance'],
    },
    {
      icon: Building,
      title: 'Real Estate',
      description: 'Hotel stays, property access',
      gradient: 'from-blue-500 to-blue-700',
      benefits: ['Luxury hotels', 'Property tours', 'Investment access'],
    },
  ];

  return (
    <div>
      <div className="text-center mb-12 pt-8 md:pt-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Utility Ecosystem</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Real-world services powered by PADD-R tokens
        </p>
      </div>
      <div className="px-4 lg:px-8 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-center justify-items-center">
          {utilities.map((utility, index) => (
            <Card 
              key={index} 
              className="group bg-gray-900/50 border-gray-800 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer card-hover overflow-hidden w-full max-w-md lg:max-w-lg"
            >
              <CardContent className="p-6 text-center relative">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${utility.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <utility.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{utility.title}</h3>
                <p className="text-gray-400 mb-4">{utility.description}</p>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="space-y-2">
                    {utility.benefits.map((benefit, i) => (
                      <div key={i} className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-1">
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}