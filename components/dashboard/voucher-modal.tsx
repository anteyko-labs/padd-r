'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink, Share2, Copy, Check, QrCode, Clock, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Voucher } from '@/lib/contracts/config';

interface VoucherModalProps {
  voucher: Voucher | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VoucherModal({ voucher, isOpen, onClose }: VoucherModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!voucher) return null;

  // Генерируем QR код для ваучера
  const voucherUrl = `${window.location.origin}/voucher/${voucher.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(voucherUrl)}`;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(voucherUrl);
      setCopied(true);
      toast({ title: 'Скопировано!', description: 'Ссылка на ваучер скопирована' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: 'Ошибка', description: 'Не удалось скопировать ссылку' });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: voucher.name,
          text: `Ваучер: ${voucher.name} - ${voucher.value}`,
          url: voucherUrl,
        });
      } catch (error) {
        handleCopyAddress();
      }
    } else {
      handleCopyAddress();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'car-rental':
        return '🚗';
      case 'restaurant':
        return '🍽️';
      case 'car-service':
        return '🔧';
      case 'exclusive':
        return '⭐';
      default:
        return '🎫';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'car-rental':
        return 'bg-blue-600';
      case 'restaurant':
        return 'bg-orange-600';
      case 'car-service':
        return 'bg-green-600';
      case 'exclusive':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <span>{getCategoryIcon(voucher.category)}</span>
            <span>{voucher.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="relative">
            <div className="relative h-96 bg-white rounded-lg overflow-hidden">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-qr.svg';
                }}
              />
              
              {/* Voucher Status */}
              <div className="absolute top-4 left-4">
                <Badge className={`${voucher.isUsed ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
                  {voucher.isUsed ? 'Использован' : 'Активен'}
                </Badge>
              </div>

              {/* Voucher Type */}
              <div className="absolute top-4 right-4">
                <Badge className={`${getCategoryColor(voucher.category)} text-white`}>
                  {voucher.type === 'one-time' ? 'Одноразовый' : 'Многоразовый'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Voucher Details */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getCategoryColor(voucher.category)} text-white`}>
                    {voucher.category === 'car-rental' ? 'Аренда авто' :
                     voucher.category === 'restaurant' ? 'Ресторан' :
                     voucher.category === 'car-service' ? 'Автосервис' : 'Эксклюзив'}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {voucher.value}
                  </Badge>
                </div>
                <span className="text-sm text-gray-400">
                  #{voucher.id}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Описание:</span>
                  <div className="text-white mt-1">{voucher.description}</div>
                </div>
                
                {voucher.isUsed && voucher.usedAt && (
                  <div>
                    <span className="text-gray-400 text-sm">Использован:</span>
                    <div className="text-white mt-1">
                      {new Date(voucher.usedAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Share2 className="mr-2" size={16} />
                Поделиться
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCopyAddress}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {copied ? <Check className="mr-2" size={16} /> : <Copy className="mr-2" size={16} />}
                {copied ? 'Скопировано!' : 'Копировать'}
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => window.open(voucherUrl, '_blank')}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ExternalLink className="mr-2" size={16} />
              Открыть ваучер
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 