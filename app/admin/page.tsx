'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Voucher } from '@/lib/contracts/config';
import { Search, Check, X, RefreshCw, Users, Ticket } from 'lucide-react';

interface AdminVoucher extends Voucher {
  userId: string;
}

export default function AdminPage() {
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const { toast } = useToast();

  // Получить все ваучеры
  const fetchAllVouchers = async () => {
    setLoading(true);
    try {
      // В реальном приложении здесь будет API для получения всех ваучеров
      // Пока используем моковые данные
      const mockVouchers: AdminVoucher[] = [
        {
          id: 'user1_car-discount-5',
          userId: 'user1',
          name: 'Скидка 5% при оплате аренды авто PADD-R',
          description: 'Скидка на все автомобили PADD-R',
          type: 'reusable',
          category: 'car-rental',
          value: '5%',
          isUsed: false,
          tierRequired: 1
        },
        {
          id: 'user1_restaurant-5',
          userId: 'user1',
          name: 'Скидка в ресторане',
          description: 'На все блюда и напитки',
          type: 'reusable',
          category: 'restaurant',
          value: '5%',
          isUsed: true,
          usedAt: '2024-01-15T10:30:00Z',
          usedBy: 'user1',
          tierRequired: 1
        },
        {
          id: 'user2_lamborghini-huracan',
          userId: 'user2',
          name: '1 день аренды Lamborghini Huracán EVO',
          description: 'Эксклюзивная аренда суперкара',
          type: 'one-time',
          category: 'exclusive',
          value: '1 день',
          isUsed: false,
          tierRequired: 2
        }
      ];
      
      setVouchers(mockVouchers);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить ваучеры' });
    } finally {
      setLoading(false);
    }
  };

  // Отметить ваучер как использованный
  const markVoucherAsUsed = async (voucherId: string, userId: string) => {
    try {
      const response = await fetch('/api/vouchers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          voucherId,
          adminKey
        }),
      });

      if (response.ok) {
        toast({ title: 'Успех', description: 'Ваучер отмечен как использованный' });
        fetchAllVouchers(); // Обновляем список
      } else {
        const error = await response.json();
        toast({ title: 'Ошибка', description: error.error || 'Не удалось отметить ваучер' });
      }
    } catch (error) {
      console.error('Error marking voucher as used:', error);
      toast({ title: 'Ошибка', description: 'Не удалось отметить ваучер' });
    }
  };

  // Фильтрация ваучеров
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = !selectedUserId || voucher.userId === selectedUserId;
    return matchesSearch && matchesUser;
  });

  // Получить уникальных пользователей
  const uniqueUsers = Array.from(new Set(vouchers.map(v => v.userId)));

  // Статистика
  const totalVouchers = vouchers.length;
  const usedVouchers = vouchers.filter(v => v.isUsed).length;
  const activeVouchers = totalVouchers - usedVouchers;

  useEffect(() => {
    fetchAllVouchers();
  }, []);

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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Админ панель - Ваучеры</h1>
            <p className="text-gray-400 mt-2">Управление ваучерами пользователей</p>
          </div>
          <Button onClick={fetchAllVouchers} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={16} />
            Обновить
          </Button>
        </div>

        {/* Admin Key Input */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <Label htmlFor="adminKey" className="text-white">Ключ администратора:</Label>
            <Input
              id="adminKey"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Введите ключ администратора"
              className="mt-2 bg-gray-800 border-gray-600 text-white"
            />
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Ticket className="text-blue-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Всего ваучеров</p>
                  <p className="text-2xl font-bold text-white">{totalVouchers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Check className="text-emerald-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Активные</p>
                  <p className="text-2xl font-bold text-white">{activeVouchers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <X className="text-red-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Использованные</p>
                  <p className="text-2xl font-bold text-white">{usedVouchers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="text-purple-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Пользователей</p>
                  <p className="text-2xl font-bold text-white">{uniqueUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search" className="text-white">Поиск:</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Поиск по названию или пользователю"
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="userFilter" className="text-white">Фильтр по пользователю:</Label>
                <select
                  id="userFilter"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-2 w-full bg-gray-800 border-gray-600 text-white rounded-md p-2"
                >
                  <option value="">Все пользователи</option>
                  {uniqueUsers.map(userId => (
                    <option key={userId} value={userId}>{userId}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vouchers List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Ваучеры ({filteredVouchers.length})</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
              <p className="text-gray-400">Загрузка ваучеров...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">Ваучеры не найдены</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredVouchers.map((voucher) => (
                <Card key={voucher.id} className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getCategoryIcon(voucher.category)}</span>
                        <div>
                          <h3 className="font-semibold text-white">{voucher.name}</h3>
                          <p className="text-sm text-gray-400">Пользователь: {voucher.userId}</p>
                        </div>
                      </div>
                      <Badge className={`${getCategoryColor(voucher.category)} text-white`}>
                        {voucher.value}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-3">{voucher.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {voucher.type === 'one-time' ? 'Одноразовый' : 'Многоразовый'}
                        </Badge>
                        <Badge className={`${voucher.isUsed ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
                          {voucher.isUsed ? 'Использован' : 'Активен'}
                        </Badge>
                      </div>
                      
                      {!voucher.isUsed && (
                        <Button
                          size="sm"
                          onClick={() => markVoucherAsUsed(voucher.id, voucher.userId)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <X className="mr-1" size={14} />
                          Использовать
                        </Button>
                      )}
                    </div>
                    
                    {voucher.isUsed && voucher.usedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Использован: {new Date(voucher.usedAt).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 