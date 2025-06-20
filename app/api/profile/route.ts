export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('PROFILE API POST CALLED, body:', body);
    console.log('SUPABASE ENV:', process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { address, email, phone, notifications } = body;
    const { error, data } = await supabase
      .from('profiles')
      .upsert({ address, email, phone, notifications }, { onConflict: 'address' });
    console.log('Supabase upsert result:', { error, data });
    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ success: false, error: error.message, details: error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API route error:', e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    console.log('PROFILE API GET CALLED, address:', address);
    if (!address) return NextResponse.json({ error: 'No address' }, { status: 400 });
    const { data, error } = await supabase
      .from('profiles')
      .select('email, phone, notifications')
      .eq('address', address)
      .single();
    console.log('Supabase select result:', { error, data });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || {});
  } catch (e) {
    console.error('API route GET error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
} 