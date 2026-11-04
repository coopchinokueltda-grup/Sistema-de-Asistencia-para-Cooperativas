import * as XLSX from 'xlsx';
import { AttendanceRecord, Profile } from '@/types';

/**
 * Exporta registros de asistencia a un archivo Excel (.xlsx) con cumplimiento legal
 */
export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  companyName: string = 'Cooperativa Chinokue Ltda',
  filterSummary: string = 'Todos los registros'
) {
  const dataRows = records.map((rec, index) => {
    const mapUrl = rec.latitude && rec.longitude 
      ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` 
      : 'No disponible';

    return {
      'N°': index + 1,
      'Fecha': rec.timestamp_local.split(' ')[0] || rec.timestamp_local,
      'Hora': rec.timestamp_local.split(' ')[1] || '',
      'Tipo de Marca': rec.record_type.toUpperCase(),
      'N° Documento (CI)': rec.employee?.document_id || 'N/A',
      'Empleado': rec.employee?.full_name || 'Desconocido',
      'Cargo / Puesto': rec.employee?.position || 'N/A',
      'Departamento': rec.employee?.department || 'General',
      'Estado': rec.status.toUpperCase().replace('_', ' '),
      'Método de Marcación': rec.scan_method === 'qr_scan' ? 'Escaneo QR Móvil' : rec.scan_method === 'kiosk_scan' ? 'Kiosco Central' : 'Manual Admin',
      'Zona Horaria Legal': rec.timezone,
      'Precisión GPS (m)': rec.accuracy ? `±${Math.round(rec.accuracy)}m` : 'N/A',
      'Coordenadas (Lat, Lng)': rec.latitude && rec.longitude ? `${rec.latitude.toFixed(6)}, ${rec.longitude.toFixed(6)}` : 'N/A',
      'Enlace Ubicación (Google Maps)': mapUrl,
      'Dispositivo': rec.device_info || 'Navegador Web',
      'IP': rec.ip_address || 'Registrado por Servidor',
      'Observaciones': rec.notes || 'Ninguna',
      'ID Auditoría': rec.id,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Auto-ajustar anchos de columnas
  const colWidths = [
    { wch: 6 },  // N°
    { wch: 12 }, // Fecha
    { wch: 10 }, // Hora
    { wch: 14 }, // Tipo
    { wch: 16 }, // Documento
    { wch: 28 }, // Empleado
    { wch: 20 }, // Cargo
    { wch: 18 }, // Departamento
    { wch: 18 }, // Estado
    { wch: 20 }, // Método
    { wch: 20 }, // Timezone
    { wch: 16 }, // Precisión
    { wch: 24 }, // Coordenadas
    { wch: 35 }, // Link Maps
    { wch: 25 }, // Dispositivo
    { wch: 18 }, // IP
    { wch: 25 }, // Observaciones
    { wch: 38 }, // ID
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencias');

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Reporte_Asistencias_${companyName.replace(/\s+/g, '_')}_${todayStr}.xlsx`);
}

/**
 * Genera y descarga una plantilla vacía de Excel para que el administrador cargue empleados
 */
export function downloadEmployeeTemplate() {
  const sampleData = [
    {
      'Nombre Completo': 'Juan Pérez González',
      'Documento CI': '4567890',
      'Email': 'juan.perez@cooperativa.com',
      'Teléfono': '0981123456',
      'Cargo': 'Cajero Principal',
      'Departamento': 'Atención al Socio',
      'Horario Entrada (HH:MM)': '08:00',
      'Horario Salida (HH:MM)': '17:00',
      'Rol (empleado/admin)': 'empleado',
    },
    {
      'Nombre Completo': 'María Carmen Benítez',
      'Documento CI': '3890123',
      'Email': 'maria.benitez@cooperativa.com',
      'Teléfono': '0971654321',
      'Cargo': 'Oficial de Créditos',
      'Departamento': 'Créditos y Cobranzas',
      'Horario Entrada (HH:MM)': '07:30',
      'Horario Salida (HH:MM)': '16:30',
      'Rol (empleado/admin)': 'empleado',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Empleados');
  XLSX.writeFile(workbook, 'Plantilla_Importar_Empleados.xlsx');
}

/**
 * Lee un archivo Excel o CSV subido y parsea la lista de empleados
 */
export async function parseEmployeesFromExcel(file: File): Promise<Partial<Profile>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet);

        const employees: Partial<Profile>[] = rawJson.map((row: any) => {
          const fullName = row['Nombre Completo'] || row['Nombre'] || row['full_name'] || '';
          const docId = String(row['Documento CI'] || row['CI'] || row['document_id'] || '').trim();
          const email = (row['Email'] || row['Correo'] || row['email'] || '').trim();
          const phone = String(row['Teléfono'] || row['Telefono'] || row['phone'] || '').trim();
          const position = row['Cargo'] || row['Puesto'] || row['position'] || 'Empleado';
          const department = row['Departamento'] || row['department'] || 'General';
          const scheduleStart = (row['Horario Entrada (HH:MM)'] || row['schedule_start'] || '08:00') + ':00';
          const scheduleEnd = (row['Horario Salida (HH:MM)'] || row['schedule_end'] || '17:00') + ':00';
          const role = (row['Rol (empleado/admin)'] || row['role'] || 'employee').toLowerCase() === 'admin' ? 'admin' : 'employee';

          return {
            full_name: fullName,
            document_id: docId,
            email: email || `${docId.toLowerCase()}@empresa.com`,
            phone,
            position,
            department,
            schedule_start: scheduleStart.substring(0, 8),
            schedule_end: scheduleEnd.substring(0, 8),
            role: role as any,
          };
        }).filter(emp => emp.full_name && emp.document_id);

        resolve(employees);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
