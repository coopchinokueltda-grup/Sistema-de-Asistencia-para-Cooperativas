import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { getLocalTimestamp, evaluateAttendanceStatus, DEFAULT_TIMEZONE } from '@/lib/timezone';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      employee_id, 
      record_type, 
      latitude, 
      longitude, 
      accuracy, 
      scan_method = 'qr_scan', 
      notes = null,
      schedule_start = '08:00:00',
      schedule_end = '17:00:00',
      tolerance_minutes = 15,
      timezone = DEFAULT_TIMEZONE
    } = body;

    if (!employee_id || !record_type) {
      return NextResponse.json(
        { error: 'Parámetros obligatorios faltantes: employee_id y record_type' },
        { status: 400 }
      );
    }

    // 1. Obtener la hora del servidor y calcular hora local con timezone legal auditado
    const serverNow = new Date();
    const { localISO, formattedDateTime } = getLocalTimestamp(serverNow, timezone);

    // 2. Evaluar estado legal (Puntual, Tardanza, etc.)
    const status = evaluateAttendanceStatus(
      record_type,
      schedule_start,
      schedule_end,
      tolerance_minutes,
      serverNow,
      timezone
    );

    // 3. Capturar IP y Device Info del request
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Dispositivo Web PWA';

    // 4. Si Supabase está conectado, guardar en la base de datos
    if (isSupabaseAdminConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('attendance_records')
        .insert({
          employee_id,
          record_type,
          timestamp_utc: serverNow.toISOString(),
          timestamp_local: formattedDateTime,
          timezone,
          latitude: latitude || null,
          longitude: longitude || null,
          accuracy: accuracy || null,
          device_info: userAgent,
          ip_address: ip,
          scan_method,
          status,
          notes,
        })
        .select('*, employee:profiles(*)')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, record: data });
    }

    // Modo local / Fallback
    const localRecord = {
      id: `att_${Date.now()}`,
      employee_id,
      record_type,
      timestamp_utc: serverNow.toISOString(),
      timestamp_local: formattedDateTime,
      timezone,
      latitude: latitude || null,
      longitude: longitude || null,
      accuracy: accuracy || null,
      device_info: userAgent,
      ip_address: ip,
      scan_method,
      status,
      notes,
      created_at: serverNow.toISOString(),
    };

    return NextResponse.json({ success: true, record: localRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al procesar asistencia' }, { status: 500 });
  }
}
