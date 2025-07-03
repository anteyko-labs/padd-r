'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, ArrowUpRight, ArrowDownLeft, Gift, ExternalLink, Filter, Clock, Trophy } from 'lucide-react';
import { useContext } from 'react';
import { DashboardDataContext } from './layout';
import { formatTokenAmount } from '@/lib/contracts/config';

type Transaction = {
  id: string;
  type: string;
  amount: string;
  date: string;
  time: string;
  status: string;
  tier: any;
  hash: string | null;
  rewards?: string;
  stakedAmount?: string;
};

export function TransactionHistory() {
  const { padBalance, stakingPositions, nftBalance } = useContext(DashboardDataContext);
  const {
    positions = [],
    isLoading: isLoadingPositions,
    totalStaked,
    totalRewards,
  } = stakingPositions;
  const {
    nfts = [],
    isLoading: isLoadingNFTs,
    totalNFTs,
  } = nftBalance;
  const { balance, isLoading: isLoadingBalance } = padBalance;

  // Генерируем транзакции на основе реальных данных
  const generateTransactions = () => {
    const transactions: Transaction[] = [];
    positions.filter((position: any) => !!position).forEach((position: any, index: number) => {
      const safePosition = position as NonNullable<typeof position>;
      transactions.push({
        id: `stake-${safePosition.id}`,
        type: 'stake',
        amount: `${safePosition.formattedAmount} PADD-R`,
        date: safePosition.formattedStartDate,
        time: '',
        status: safePosition.isActive ? 'Confirmed' : 'Completed',
        tier: safePosition.tierInfo?.name || 'Unknown',
        hash: `0x${safePosition.id.toString().padStart(64, '0')}`,
        rewards: safePosition.formattedRewards,
      });
    });
    nfts.forEach((nft: any, index: number) => {
      transactions.push({
        id: `nft-${nft.tokenId}`,
        type: 'reward',
        amount: `${nft.tierInfo?.name} NFT`,
        date: nft.formattedStartDate,
        time: '',
        status: 'Received',
        tier: nft.tierInfo?.name || 'Unknown',
        hash: null,
        stakedAmount: nft.formattedAmountStaked,
      });
    });
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const transactions = generateTransactions();

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

  // Форматируем баланс
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0';
    return formatTokenAmount(balance);
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
          {isLoadingPositions || isLoadingNFTs ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading transaction history...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <History size={24} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Transactions Yet</h3>
              <p className="text-gray-400">Start staking to see your transaction history</p>
            </div>
          ) : (
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
                      {'rewards' in tx && tx.rewards && (
                        <p className="text-xs text-emerald-400">Rewards: {tx.rewards}</p>
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
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
              <ArrowUpRight size={20} className="text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {isLoadingPositions ? 'Loading...' : totalStaked.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400">Total Staked</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-600/20 rounded-2xl flex items-center justify-center">
              <Gift size={20} className="text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {isLoadingNFTs ? 'Loading...' : totalNFTs}
            </p>
            <p className="text-sm text-gray-400">NFTs Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-yellow-600/20 rounded-2xl flex items-center justify-center">
              <Trophy size={20} className="text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {isLoadingPositions ? 'Loading...' : totalRewards.toFixed(2)}
            </p>
            <p className="text-sm text-gray-400">Total Rewards</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-lg text-emerald-400 font-bold">Total NFTs Earned: {totalNFTs}</div>
    </div>
  );
}