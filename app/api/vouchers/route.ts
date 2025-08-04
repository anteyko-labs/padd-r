import { NextRequest, NextResponse } from 'next/server';
import { VOUCHERS_CONFIG, Voucher } from '@/lib/contracts/config';

// Простое хранилище в памяти (в продакшене нужно использовать базу данных)
let vouchersData: { [userId: string]: Voucher[] } = {};

// Получить ваучеры пользователя
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const tierLevel = parseInt(searchParams.get('tierLevel') || '1');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Если у пользователя нет ваучеров, создаем их на основе tier
  if (!vouchersData[userId]) {
    const userVouchers = VOUCHERS_CONFIG
      .filter(voucher => voucher.tierRequired <= tierLevel)
      .map(voucher => ({
        ...voucher,
        id: `${userId}_${voucher.id}`,
        isUsed: false
      }));
    
    vouchersData[userId] = userVouchers;
  }

  return NextResponse.json({
    vouchers: vouchersData[userId],
    tierLevel
  });
}

// Отметить ваучер как использованный (для админа)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, voucherId, adminKey } = body;

    // Простая проверка админа (в продакшене нужно более надежную аутентификацию)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId || !voucherId) {
      return NextResponse.json({ error: 'User ID and Voucher ID required' }, { status: 400 });
    }

    if (!vouchersData[userId]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const voucher = vouchersData[userId].find(v => v.id === voucherId);
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    if (voucher.isUsed) {
      return NextResponse.json({ error: 'Voucher already used' }, { status: 400 });
    }

    // Отмечаем ваучер как использованный
    voucher.isUsed = true;
    voucher.usedAt = new Date().toISOString();
    voucher.usedBy = userId;

    return NextResponse.json({
      success: true,
      voucher,
      message: 'Voucher marked as used'
    });

  } catch (error) {
    console.error('Error marking voucher as used:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Сбросить ваучеры (для тестирования)
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const adminKey = searchParams.get('adminKey');

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (userId) {
    delete vouchersData[userId];
  } else {
    vouchersData = {};
  }

  return NextResponse.json({
    success: true,
    message: 'Vouchers reset'
  });
} 