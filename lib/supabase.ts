import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Функция для получения изображения из Supabase Storage
export async function getNFTImage(tier: string, imageName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('assets')
      .createSignedUrl(`${tier}/${imageName}`, 3600); // URL действителен 1 час
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getNFTImage:', error);
    return null;
  }
}

// Функция для получения списка изображений для тира
export async function getTierImages(tier: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('assets')
      .list(tier);
    
    if (error) {
      console.error('Error listing tier images:', error);
      return [];
    }
    
    return data?.map(file => file.name).filter(name => name.endsWith('.png') || name.endsWith('.jpg')) || [];
  } catch (error) {
    console.error('Error in getTierImages:', error);
    return [];
  }
} 