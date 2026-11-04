import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET() {
  try {
    const client = (isSupabaseAdminConfigured && supabaseAdmin) 
      ? supabaseAdmin 
      : (isSupabaseConfigured && supabase ? supabase : null);

    if (!client) {
      return NextResponse.json({
        hasAdmin: true,
        connected: false,
      });
    }

    const { data: admins, error } = await client
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) {
      return NextResponse.json({
        hasAdmin: true,
        connected: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      hasAdmin: Boolean(admins && admins.length > 0),
      connected: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      hasAdmin: true,
      connected: false,
      error: err.message,
    });
  }
}
