'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Share2, Copy, Check, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatTokenAmount } from '@/lib/contracts/config';
import Link from 'next/link';

interface NFTData {
  tokenId: number;
  positionId: bigint;
  amountStaked: bigint;
  lockDurationMonths: bigint;
  startTimestamp: bigint;
  tierLevel: number;
  monthIndex: bigint;
  nextMintOn: bigint;
  isInitialStakingNFT: boolean;
  formattedAmountStaked: string;
  formattedStartDate: string;
  formattedNextMintDate: string;
  tierInfo: any;
  image?: string;
  owner?: string;
}

export default function NFTPage() {
  const params = useParams();
  const tokenId = params.tokenId as string;
  const [nft, setNft] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchNFT() {
      try {
        setLoading(true);
        const response = await fetch(`/api/nft/${tokenId}`);
        if (!response.ok) {
          throw new Error('NFT not found');
        }
        const data = await response.json();
        setNft(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load NFT');
      } finally {
        setLoading(false);
      }
    }

    if (tokenId) {
      fetchNFT();
    }
  }, [tokenId]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: 'Copied!', description: 'NFT link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy link' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nft?.tierInfo?.name} NFT #${nft?.tokenId}`,
          text: `Check out this PADD-R ${nft?.tierInfo?.name} NFT!`,
          url: window.location.href,
        });
      } catch (error) {
        handleCopyAddress();
      }
    } else {
      handleCopyAddress();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading NFT...</p>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">NFT Not Found</h1>
          <p className="text-gray-400 mb-6">The NFT you're looking for doesn't exist or has been removed.</p>
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ArrowLeft className="mr-2" size={16} />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="mr-2" size={16} />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Share2 className="mr-2" size={16} />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {copied ? <Check className="mr-2" size={16} /> : <Copy className="mr-2" size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* NFT Image */}
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={nft.image || '/placeholder-nft.svg'}
                  alt={`${nft.tierInfo?.name} NFT`}
                  className="w-full h-96 object-cover rounded-lg border border-gray-700"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-nft.svg';
                  }}
                />
                <div className="absolute top-4 left-4">
                  <Badge className={`${
                    nft.tierInfo?.name === 'Platinum' ? 'bg-emerald-600' :
                    nft.tierInfo?.name === 'Gold' ? 'bg-yellow-600' :
                    nft.tierInfo?.name === 'Silver' ? 'bg-gray-600' : 'bg-amber-600'
                  } text-white`}>
                    {nft.tierInfo?.name} Tier
                  </Badge>
                </div>
                {nft.isInitialStakingNFT && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-600 text-white">
                      Initial Staking
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* QR Code */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Share NFT</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`}
                    alt="QR Code"
                    className="mx-auto border border-gray-600 rounded-lg"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Scan to view this NFT
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* NFT Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {nft.tierInfo?.name} NFT #{nft.tokenId}
                </h1>
                <p className="text-gray-400">
                  PADD-R Staking NFT - {nft.isInitialStakingNFT ? 'Initial Staking' : 'Monthly Reward'}
                </p>
              </div>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">NFT Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Amount Staked</span>
                      <div className="text-emerald-400 font-semibold text-lg">
                        {nft.formattedAmountStaked} PAD
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Start Date</span>
                      <div className="text-white">
                        {nft.formattedStartDate}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Next Mint</span>
                      <div className="text-white">
                        {nft.formattedNextMintDate}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Type</span>
                      <div className="text-white">
                        {nft.isInitialStakingNFT ? 'Initial Staking' : 'Monthly Reward'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Tier Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Restaurant Discount</span>
                      <span className="text-emerald-400 font-semibold">{nft.tierInfo?.discount}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Hotel Discount</span>
                      <span className="text-emerald-400 font-semibold">{nft.tierInfo?.hotelDiscount}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Car Rental Discount</span>
                      <span className="text-emerald-400 font-semibold">{nft.tierInfo?.carDiscount}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    // Попытка импорта в MetaMask
                    if (typeof window !== 'undefined' && (window as any).ethereum) {
                      (window as any).ethereum.request({
                        method: 'wallet_watchAsset',
                        params: {
                          type: 'ERC721',
                          options: {
                            address: '0x742d35Cc6Bf8fE5a02B5c4B4c8b4cB2',
                            tokenId: nft.tokenId.toString(),
                            image: nft.image || '/placeholder-nft.svg',
                          },
                        },
                      }).then(() => {
                        toast({ title: 'Success!', description: 'NFT added to MetaMask' });
                      }).catch(() => {
                        toast({ title: 'Info', description: 'Please manually import NFT to your wallet' });
                      });
                    } else {
                      toast({ title: 'Info', description: 'Please manually import NFT to your wallet' });
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="mr-2" size={16} />
                  Import to Wallet
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://sepolia.etherscan.io/token/0x742d35Cc6Bf8fE5a02B5c4B4c8b4cB2?a=${nft.tokenId}`, '_blank')}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ExternalLink className="mr-2" size={16} />
                  View on Etherscan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 