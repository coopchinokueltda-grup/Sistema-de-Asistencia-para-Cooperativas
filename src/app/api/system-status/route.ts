import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

export async function GET() {
  try {
    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({
        hasAdmin: false,
        connected: false,
      });
    }

    const { data: admins, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (error) {
      return NextResponse.json({
        hasAdmin: false,
        connected: true,
        error: error.message,
      });
    }

    return NextResponse.json({
      hasAdmin: (admins && admins.length > 0),
      connected: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      hasAdmin: false,
      connected: false,
      error: err.message,
    });
  }
}
