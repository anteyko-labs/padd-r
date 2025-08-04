'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, ExternalLink, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardNFT } from './rewards-panel';
import { formatDate, formatTokenAmount } from '@/lib/contracts/config';

interface NFTModalProps {
  nft: DashboardNFT | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NFTModal({ nft, isOpen, onClose }: NFTModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!nft) return null;

  // Генерируем QR код для NFT ссылки
  const nftUrl = `${window.location.origin}/nft/${nft.tokenId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(nftUrl)}`;

  // Изображения для слайдера (основное изображение + QR код)
  const images = [
    { src: nft.image || '/placeholder-nft.svg', alt: 'NFT Image' },
    { src: qrCodeUrl, alt: 'QR Code' }
  ];

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(nftUrl);
      setCopied(true);
      toast({ title: 'Copied!', description: 'NFT link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to copy link' });
    }
  };

  const handleImportToWallet = async () => {
    try {
      // Создаем метаданные NFT для импорта
      const nftMetadata = {
        tokenId: nft.tokenId.toString(),
        name: `${nft.tierInfo?.name} NFT #${nft.tokenId}`,
        description: `PADD-R Staking NFT - ${nft.tierInfo?.name} Tier`,
        image: nft.image || '/placeholder-nft.svg',
        external_url: nftUrl,
        attributes: [
          { trait_type: 'Tier', value: nft.tierInfo?.name },
          { trait_type: 'Type', value: nft.isInitialStakingNFT ? 'Initial Staking' : 'Monthly Reward' },
          { trait_type: 'Amount Staked', value: nft.formattedAmountStaked },
          { trait_type: 'Start Date', value: nft.formattedStartDate },
        ]
      };

      // Пытаемся добавить в MetaMask
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC721',
              options: {
                address: '0x742d35Cc6Bf8fE5a02B5c4B4c8b4cB2', // NFT Factory address
                tokenId: nft.tokenId.toString(),
                image: nft.image || '/placeholder-nft.svg',
              },
            },
          });
          toast({ title: 'Success!', description: 'NFT added to MetaMask' });
        } catch (error) {
          console.error('MetaMask import error:', error);
          toast({ title: 'Info', description: 'Please manually import NFT to your wallet' });
        }
      } else {
        toast({ title: 'Info', description: 'Please manually import NFT to your wallet' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to import NFT' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nft.tierInfo?.name} NFT #${nft.tokenId}`,
          text: `Check out my PADD-R ${nft.tierInfo?.name} NFT!`,
          url: nftUrl,
        });
      } catch (error) {
        handleCopyAddress();
      }
    } else {
      handleCopyAddress();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              {nft.tierInfo?.name} NFT #{nft.tokenId}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Slider */}
          <div className="relative">
            <div className="relative h-80 bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={images[currentImageIndex].src}
                alt={images[currentImageIndex].alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-nft.svg';
                }}
              />
              
              {/* Navigation Dots */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-emerald-400' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Image Labels */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/50 text-white">
                  {currentImageIndex === 0 ? 'NFT Image' : 'QR Code'}
                </Badge>
              </div>
            </div>
          </div>

          {/* NFT Details */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`${
                    nft.tierInfo?.name === 'Platinum' ? 'bg-emerald-600' :
                    nft.tierInfo?.name === 'Gold' ? 'bg-yellow-600' :
                    nft.tierInfo?.name === 'Silver' ? 'bg-gray-600' : 'bg-amber-600'
                  } text-white`}>
                    {nft.tierInfo?.name} Tier
                  </Badge>
                  {nft.isInitialStakingNFT && (
                    <Badge className="bg-blue-600 text-white">
                      Initial Staking
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-gray-400">
                  #{nft.tokenId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Amount Staked:</span>
                  <div className="text-emerald-400 font-semibold">
                    {nft.formattedAmountStaked} PAD
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Start Date:</span>
                  <div className="text-white">
                    {nft.formattedStartDate}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Next Mint:</span>
                  <div className="text-white">
                    {nft.formattedNextMintDate}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Type:</span>
                  <div className="text-white">
                    {nft.isInitialStakingNFT ? 'Initial Staking' : 'Monthly Reward'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleImportToWallet}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="mr-2" size={16} />
              Import to Wallet
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Share2 className="mr-2" size={16} />
                Share
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCopyAddress}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {copied ? <Check className="mr-2" size={16} /> : <Copy className="mr-2" size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open(nftUrl, '_blank')}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ExternalLink className="mr-2" size={16} />
                View NFT
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 