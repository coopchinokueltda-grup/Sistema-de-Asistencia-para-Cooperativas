import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

// PUT: Actualizar datos de un empleado (incluida foto, horario, cargo, etc.)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, full_name, document_id, position, department, schedule_start, schedule_end, phone, avatar_url, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identificador de empleado no proporcionado.' }, { status: 400 });
    }

    if (isSupabaseAdminConfigured && supabaseAdmin) {
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

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Si cambió el nombre, actualizar los metadatos de auth
      if (full_name) {
        await supabaseAdmin.auth.admin.updateUserById(id, {
          user_metadata: { full_name: full_name.trim() }
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

    if (isSupabaseAdminConfigured && supabaseAdmin) {
      // 1. Eliminar de la tabla profiles
      await supabaseAdmin.from('profiles').delete().eq('id', id);

      // 2. Eliminar de auth.users si existe
      await supabaseAdmin.auth.admin.deleteUser(id).catch(() => {});

      return NextResponse.json({ success: true, message: 'Empleado eliminado exitosamente.' });
    }

    return NextResponse.json({ success: true, message: 'Empleado eliminado localmente.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar el empleado' }, { status: 500 });
  }
}
