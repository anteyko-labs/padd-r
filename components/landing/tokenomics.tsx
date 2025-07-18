'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, PieChart } from 'lucide-react';

export function Tokenomics() {
  const distribution = [
    { label: 'Ecosystem', percent: 40, color: 'bg-emerald-500', description: 'Rewards, partnerships, utility development' },
    { label: 'Growth Reserve', percent: 25, color: 'bg-blue-500', description: 'Future expansion and strategic initiatives' },
    { label: 'Team', percent: 15, color: 'bg-purple-500', description: '24-month vesting schedule' },
    { label: 'Liquidity', percent: 10, color: 'bg-yellow-500', description: 'DEX liquidity and market making' },
    { label: 'Marketing', percent: 10, color: 'bg-orange-500', description: 'Community growth and partnerships' },
  ];

  const tokenInfo = [
    { label: 'Total Supply', value: '100,000,000 PADD-R' },
    { label: 'Initial Circulating', value: '25,000,000 PADD-R' },
    { label: 'Token Standard', value: 'BEP-20' },
    { label: 'Network', value: 'Binance Smart Chain' },
  ];

  return (
    <div>
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tokenomics</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Designed for long-term utility and ecosystem growth
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Distribution Chart */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl font-bold mb-4 flex items-center justify-center lg:justify-start">
                  <PieChart className="mr-3 text-emerald-400" size={24} />
                  Token Distribution
                </h3>
              </div>
              {distribution.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`} />
                      <span className="font-semibold text-white">{item.label}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{item.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${item.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 ml-7">{item.description}</p>
                </div>
              ))}
            </div>
            {/* Token Information */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Token Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tokenInfo.map((info, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-b-0">
                      <span className="text-gray-400">{info.label}</span>
                      <span className="text-white font-semibold">{info.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-emerald-900/20 to-emerald-800/20 border-emerald-800">
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold text-white mb-3">Important Notice</h4>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    PADD-R is a utility token designed for real-world service access. 
                    It does not represent equity, income, or investment returns. 
                    Rewards are not guaranteed and may vary based on ecosystem development.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="outline" 
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                    >
                      <ExternalLink className="mr-2" size={16} />
                      Read Whitepaper
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
                    >
                      <ExternalLink className="mr-2" size={16} />
                      View Contract
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}