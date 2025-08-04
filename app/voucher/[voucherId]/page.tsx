'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Voucher } from '@/lib/contracts/config';
import { ExternalLink, Share2, Copy, Check, QrCode } from 'lucide-react';

export default function VoucherPage() {
  const params = useParams();
  const voucherId = params.voucherId as string;
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // В реальном приложении здесь будет API для получения ваучера по ID
    // Пока используем моковые данные
    const mockVoucher: Voucher = {
      id: voucherId,
      name: 'Скидка 5% при оплате аренды авто PADD-R',
      description: 'Скидка на все автомобили PADD-R',
      type: 'reusable',
      category: 'car-rental',
      value: '5%',
      isUsed: false,
      tierRequired: 1
    };
    
    setVoucher(mockVoucher);
    setLoading(false);
  }, [voucherId]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: voucher?.name || 'Ваучер PADD-R',
          text: `Ваучер: ${voucher?.name} - ${voucher?.value}`,
          url: window.location.href,
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
      case 'car-rental': return '🚗';
      case 'restaurant': return '🍽️';
      case 'car-service': return '🔧';
      case 'exclusive': return '⭐';
      default: return '🎫';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'car-rental': return 'bg-blue-600';
      case 'restaurant': return 'bg-orange-600';
      case 'car-service': return 'bg-green-600';
      case 'exclusive': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка ваучера...</p>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Ваучер не найден</h1>
          <p className="text-gray-400">Ваучер с указанным ID не существует</p>
        </div>
      </div>
    );
  }

  // Генерируем QR код для ваучера
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">PADD-R Ваучер</h1>
          <p className="text-gray-400">Эксклюзивные предложения для держателей NFT</p>
        </div>

        {/* Voucher Card */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-4xl">{getCategoryIcon(voucher.category)}</span>
              <CardTitle className="text-2xl text-white">{voucher.name}</CardTitle>
            </div>
            <div className="flex justify-center space-x-2">
              <Badge className={`${getCategoryColor(voucher.category)} text-white`}>
                {voucher.category === 'car-rental' ? 'Аренда авто' :
                 voucher.category === 'restaurant' ? 'Ресторан' :
                 voucher.category === 'car-service' ? 'Автосервис' : 'Эксклюзив'}
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {voucher.value}
              </Badge>
              <Badge className={`${voucher.isUsed ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
                {voucher.isUsed ? 'Использован' : 'Активен'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Description */}
            <div className="text-center">
              <p className="text-gray-300 text-lg">{voucher.description}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-qr.svg';
                    }}
                  />
                </div>
                <div className="absolute top-2 left-2">
                  <Badge className="bg-black/50 text-white">
                    <QrCode className="mr-1" size={12} />
                    QR Code
                  </Badge>
                </div>
              </div>
            </div>

            {/* Voucher Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Тип ваучера:</span>
                  <span className="text-white">{voucher.type === 'one-time' ? 'Одноразовый' : 'Многоразовый'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Категория:</span>
                  <span className="text-white">
                    {voucher.category === 'car-rental' ? 'Аренда авто' :
                     voucher.category === 'restaurant' ? 'Ресторан' :
                     voucher.category === 'car-service' ? 'Автосервис' : 'Эксклюзив'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Значение:</span>
                  <span className="text-white font-semibold">{voucher.value}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">ID ваучера:</span>
                  <span className="text-white font-mono text-sm">#{voucher.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Статус:</span>
                  <span className={`font-semibold ${voucher.isUsed ? 'text-red-400' : 'text-emerald-400'}`}>
                    {voucher.isUsed ? 'Использован' : 'Активен'}
                  </span>
                </div>
                {voucher.isUsed && voucher.usedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Использован:</span>
                    <span className="text-white">
                      {new Date(voucher.usedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleShare}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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
                {copied ? 'Скопировано!' : 'Копировать ссылку'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('https://padd-r.com', '_blank')}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ExternalLink className="mr-2" size={16} />
                Перейти на сайт
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm">
          <p>PADD-R - Эксклюзивные ваучеры для держателей NFT</p>
          <p className="mt-2">© 2024 PADD-R. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
} 