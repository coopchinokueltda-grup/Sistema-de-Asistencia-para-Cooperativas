import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

// PUT: Actualizar datos de un empleado (incluida foto, horario, cargo, etc.)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, full_name, document_id, position, department, schedule_start, schedule_end, phone, avatar_url, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identificador de empleado no proporcionado.' }, { status: 400 });
    }

    const client = (isSupabaseAdminConfigured && supabaseAdmin) 
      ? supabaseAdmin 
      : (isSupabaseConfigured && supabase ? supabase : null);

    if (client) {
      const updatePayload: Record<string, any> = {};
      if (full_name !== undefined) updatePayload.full_name = full_name.trim();
      if (document_id !== undefined) updatePayload.document_id = document_id.trim();
      if (position !== undefined) updatePayload.position = position.trim();
      if (department !== undefined) updatePayload.department = department.trim();
      if (schedule_start !== undefined) updatePayload.schedule_start = schedule_start;
      if (schedule_end !== undefined) updatePayload.schedule_end = schedule_end;
      if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
      if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url;
      if (is_active !== undefined) updatePayload.is_active = is_active;

      const { data, error } = await client
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.message && error.message.includes('avatar_url')) {
          return NextResponse.json({
            error: 'Falta la columna avatar_url en Supabase. Ejecute: ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
          }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Si se cuenta con cliente de administración y cambió el nombre o foto, sincronizar auth
      if (isSupabaseAdminConfigured && supabaseAdmin && full_name) {
        await supabaseAdmin.auth.admin.updateUserById(id, {
          user_metadata: { 
            full_name: full_name.trim(),
            ...(avatar_url ? { avatar_url } : {})
          }
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, profile: data });
    }

    return NextResponse.json({ success: true, profile: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar un empleado permanentemente
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Identificador de empleado no proporcionado.' }, { status: 400 });
    }

    const client = (isSupabaseAdminConfigured && supabaseAdmin) 
      ? supabaseAdmin 
      : (isSupabaseConfigured && supabase ? supabase : null);

    if (client) {
      // 1. Eliminar de la tabla profiles
      await client.from('profiles').delete().eq('id', id);

      // 2. Eliminar de auth.users si se cuenta con permisos admin
      if (isSupabaseAdminConfigured && supabaseAdmin) {
        await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});
      }

      return NextResponse.json({ success: true, message: 'Empleado eliminado exitosamente.' });
    }

    return NextResponse.json({ success: true, message: 'Empleado eliminado localmente.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar el empleado' }, { status: 500 });
  }
}
