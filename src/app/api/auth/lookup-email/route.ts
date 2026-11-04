import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { document_id } = await req.json();
    if (!document_id) {
      return NextResponse.json({ error: 'Documento requerido' }, { status: 400 });
    }

    if (!isSupabaseAdminConfigured || !supabaseAdmin) {
      return NextResponse.json({ email: null });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('document_id', document_id.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ email: null });
    }

    return NextResponse.json({ email: data.email });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
