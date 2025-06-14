'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ArrowUpRight, ArrowDownLeft, Gift, ExternalLink, Filter } from 'lucide-react';

export function TransactionHistory() {
  const transactions = [
    {
      id: '0x1a2b3c...',
      type: 'stake',
      amount: '8,500 PADD-R',
      date: '2024-11-15',
      time: '14:32',
      status: 'Confirmed',
      tier: 'Silver',
      hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    },
    {
      id: '0x2b3c4d...',
      type: 'reward',
      amount: 'Silver NFT',
      date: '2024-11-10',
      time: '09:15',
      status: 'Received',
      tier: 'Silver',
      hash: '0x2b3c4d5e6f7890abcdef1234567890abcdef23',
    },
    {
      id: '0x3c4d5e...',
      type: 'unstake',
      amount: '2,000 PADD-R',
      date: '2024-11-05',
      time: '16:45',
      status: 'Completed',
      tier: 'Bronze',
      hash: '0x3c4d5e6f7890abcdef1234567890abcdef34',
    },
    {
      id: '0x4d5e6f...',
      type: 'voucher',
      amount: '7% Restaurant Discount',
      date: '2024-11-01',
      time: '11:20',
      status: 'Active',
      tier: 'Silver',
      hash: null,
    },
    {
      id: '0x5e6f7g...',
      type: 'stake',
      amount: '5,000 PADD-R',
      date: '2024-10-28',
      time: '13:10',
      status: 'Confirmed',
      tier: 'Silver',
      hash: '0x5e6f7g8h9i0jabcdef1234567890abcdef45',
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'stake':
        return <ArrowUpRight size={16} className="text-emerald-400" />;
      case 'unstake':
        return <ArrowDownLeft size={16} className="text-orange-400" />;
      case 'reward':
      case 'voucher':
        return <Gift size={16} className="text-purple-400" />;
      default:
        return <History size={16} className="text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'stake':
        return 'bg-emerald-600/20';
      case 'unstake':
        return 'bg-orange-600/20';
      case 'reward':
      case 'voucher':
        return 'bg-purple-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
      case 'Received':
      case 'Active':
        return 'bg-emerald-600';
      case 'Pending':
        return 'bg-yellow-600';
      case 'Failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                <Filter size={16} className="mr-2" />
                All Types
              </Button>
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                Last 30 Days
              </Button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Total Transactions:</span>
              <span className="text-white font-semibold">{transactions.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History size={20} className="text-blue-400" />
            <span>Transaction History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.type)}`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-white capitalize">{tx.type}</p>
                      <Badge className={`text-xs ${
                        tx.tier === 'Platinum' ? 'bg-emerald-600' :
                        tx.tier === 'Gold' ? 'bg-yellow-600' :
                        tx.tier === 'Silver' ? 'bg-gray-600' : 'bg-amber-600'
                      } text-white`}>
                        {tx.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{tx.date} at {tx.time}</p>
                    {tx.hash && (
                      <p className="text-xs text-gray-500 font-mono">{tx.id}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-white mb-1">{tx.amount}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getStatusColor(tx.status)} text-white`}>
                      {tx.status}
                    </Badge>
                    {tx.hash && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-emerald-400">
                        <ExternalLink size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={20} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">13,500</p>
            <p className="text-sm text-gray-400">Total Staked</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-2xl flex items-center justify-center">
              <Gift size={20} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">8</p>
            <p className="text-sm text-gray-400">Rewards Earned</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-orange-600/20 rounded-2xl flex items-center justify-center">
              <ArrowDownLeft size={20} className="text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">2,000</p>
            <p className="text-sm text-gray-400">Total Unstaked</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}