import { NextRequest, NextResponse } from 'next/server';
import { supabase, getTierImages } from '@/lib/supabase';

// Маппинг тиров на папки в Supabase Storage
const tierFolders: Record<string, string> = {
  'Bronze': 'tier1',
  'Silver': 'tier2',
  'Gold': 'tier3',
  'Platinum': 'tier4',
};

// GET: получить неиспользованную картинку для пользователя, tier и token_id
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  const tier = searchParams.get('tier');
  const tokenId = searchParams.get('token_id');
  
  if (!address || !tier || !tokenId) {
    return NextResponse.json({ error: 'address, tier, token_id required' }, { status: 400 });
  }

  try {
    // Проверяем, есть ли уже изображение для этого NFT
    const { data: existing, error: existingError } = await supabase
      .from('nft_images')
      .select('image_name')
      .eq('address', address)
      .eq('tier', tier)
      .eq('token_id', tokenId)
      .single();
      
    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    
    if (existing && existing.image_name) {
      return NextResponse.json({ image: existing.image_name });
    }

    // Получаем уже использованные картинки для этого пользователя и tier
    const { data: used, error } = await supabase
      .from('nft_images')
      .select('image_name')
      .eq('address', address)
      .eq('tier', tier);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const usedImages = used?.map((u: any) => u.image_name) || [];

    // Получаем все картинки для tier из Supabase Storage
    const tierFolder = tierFolders[tier];
    if (!tierFolder) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }
    
    const allImages = await getTierImages(tierFolder);
    const available = allImages.filter(img => !usedImages.includes(img));
    
    if (available.length === 0) {
      return NextResponse.json({ error: 'no images left' }, { status: 404 });
    }
    
    const image = available[Math.floor(Math.random() * available.length)];
    return NextResponse.json({ image });
    
  } catch (error) {
    console.error('Error in NFT image API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: сохранить выбранную картинку для пользователя, tier и token_id
export async function POST(req: NextRequest) {
  const { address, tier, token_id, image } = await req.json();
  
  if (!address || !tier || !token_id || !image) {
    return NextResponse.json({ error: 'address, tier, token_id, image required' }, { status: 400 });
  }
  
  try {
    const { error } = await supabase
      .from('nft_images')
      .insert([{ address, tier, token_id, image_name: image }]);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST NFT image API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 