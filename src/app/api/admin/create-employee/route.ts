import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, document_id, role, position, department, schedule_start, schedule_end, phone, avatar_url } = body;

    if (!email || !password || !full_name || !document_id) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: email, password, full_name, document_id' },
        { status: 400 }
      );
    }

    const qrToken = `EMP-QR-${document_id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Si Supabase Admin está configurado, crear usuario en auth.users y profile
    if (isSupabaseAdminConfigured && supabaseAdmin) {
      // 1. Crear en auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: role || 'employee',
          avatar_url: avatar_url || null,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return NextResponse.json({ error: 'Este correo ya está registrado en el sistema. Inicie sesión directamente.' }, { status: 400 });
        }
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      // 2. Insertar o actualizar en la tabla profiles
      const profileData: Record<string, any> = {
        id: authUser.user.id,
        full_name,
        document_id,
        role: role || 'employee',
        email,
        phone: phone || null,
        position: position || 'Empleado',
        department: department || 'General',
        schedule_start: schedule_start || '08:00:00',
        schedule_end: schedule_end || '17:00:00',
        qr_token: qrToken,
        is_active: true,
      };

      if (avatar_url) {
        profileData.avatar_url = avatar_url;
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: authUser.user.id,
          email,
          password,
          full_name,
          document_id,
          qr_token: qrToken,
        },
      });
    }

    // Modo local / Fallback (sin keys aún)
    return NextResponse.json({
      success: true,
      user: {
        id: `local_emp_${Date.now()}`,
        email,
        password,
        full_name,
        document_id,
        qr_token: qrToken,
      },
      note: 'Creado en modo local/demo (Configura SUPABASE_SERVICE_ROLE_KEY para producción)',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error del servidor' }, { status: 500 });
  }
}
