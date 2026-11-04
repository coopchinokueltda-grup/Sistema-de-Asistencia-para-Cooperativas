export const DEFAULT_TIMEZONE = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'America/Asuncion';

/**
 * Obtiene la fecha y hora formateada en la zona horaria legal auditada
 */
export function getLocalTimestamp(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): {
  localISO: string;
  formattedDateTime: string;
  formattedDate: string;
  formattedTime: string;
} {
  try {
    // Formatear a componentes locales exactos
    const formatter = new Intl.DateTimeFormat('es-PY', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const map = new Map(parts.map(p => [p.type, p.value]));

    const year = map.get('year') || '2026';
    const month = map.get('month') || '01';
    const day = map.get('day') || '01';
    const hour = map.get('hour') || '00';
    const minute = map.get('minute') || '00';
    const second = map.get('second') || '00';

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hour}:${minute}:${second}`;
    const formattedDateTime = `${formattedDate} ${formattedTime}`;

    return {
      localISO: `${formattedDate}T${formattedTime}`,
      formattedDateTime,
      formattedDate,
      formattedTime,
    };
  } catch (err) {
    // Fallback estándar
    const iso = date.toISOString().replace('T', ' ').substring(0, 19);
    return {
      localISO: date.toISOString(),
      formattedDateTime: iso,
      formattedDate: iso.split(' ')[0],
      formattedTime: iso.split(' ')[1],
    };
  }
}

/**
 * Formatea una fecha ISO o timestamp para mostrarla en la interfaz en español
 */
export function formatFriendlyDate(dateStr: string, timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-PY', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formatea una hora en formato amigable (Ej: 08:30:15)
 */
export function formatFriendlyTime(dateStr: string, timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-PY', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calcula si la entrada es puntual o tardanza según el horario asignado
 */
export function evaluateAttendanceStatus(
  recordType: 'entrada' | 'salida',
  scheduleStart: string = '08:00:00',
  scheduleEnd: string = '17:00:00',
  toleranceMinutes: number = 15,
  nowDate: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): 'puntual' | 'tardanza' | 'salida_anticipada' | 'salida_normal' | 'tiempo_extra' {
  const { formattedTime } = getLocalTimestamp(nowDate, timeZone);
  const [currentH, currentM] = formattedTime.split(':').map(Number);
  const currentMinutes = currentH * 60 + currentM;

  if (recordType === 'entrada') {
    const [startH, startM] = (scheduleStart || '08:00:00').split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const maxAllowedMinutes = startMinutes + toleranceMinutes;

    if (currentMinutes <= maxAllowedMinutes) {
      return 'puntual';
    } else {
      return 'tardanza';
    }
  } else {
    // Salida
    const [endH, endM] = (scheduleEnd || '17:00:00').split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    if (currentMinutes < endMinutes - 10) {
      return 'salida_anticipada';
    } else if (currentMinutes > endMinutes + 60) {
      return 'tiempo_extra';
    } else {
      return 'salida_normal';
    }
  }
}
