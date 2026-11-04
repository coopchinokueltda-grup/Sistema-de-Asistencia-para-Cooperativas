# Control de Asistencia con Código QR
### Cooperativa Chinokue Ltda

Aplicación web progresiva (PWA) instalable en teléfonos móviles y computadoras para el control horario y registro de asistencia de personal mediante lectura de código QR y geolocalización.

Desarrollada para operar conectada a **Supabase** y desplegarse en **Vercel**.

---

## Características

- **Registro por código QR:** Permite registrar entradas y salidas enfocando con la cámara del teléfono el código de la sede o leyendo el carnet del empleado.
- **Geolocalización:** Captura coordenadas y precisión en metros de cada marcación, con enlace de consulta a mapas.
- **Zona horaria oficial:** Sellado de registros en UTC y hora local según el huso horario configurado (`America/Asuncion`).
- **Control por roles:**
  - **Administrador:** Panel con resumen del día, filtros por fecha y empleado, exportación a Excel (.xlsx), importación de nómina desde archivo y generación de carnets de identificación.
  - **Empleado:** Interfaz móvil simplificada únicamente para marcar entrada/salida y consultar su historial en modo de solo lectura.
- **PWA instalable:** Compatible con navegadores móviles y de escritorio, con funcionamiento sin conexión para consulta básica.

---

## Puesta en marcha

### 1. Base de datos en Supabase

1. Cree un proyecto en [supabase.com](https://supabase.com).
2. Ingrese a la sección **SQL Editor**.
3. Ejecute el script contenido en [`supabase/schema.sql`](./supabase/schema.sql). Esto creará las tablas `profiles`, `attendance_records`, `system_settings` y sus políticas de seguridad.
4. En **Project Settings > API**, obtenga:
   - URL del proyecto
   - Clave pública anon
   - Clave service_role (secreta)

### 2. Despliegue en Vercel

1. Suba este repositorio a GitHub.
2. Cree un nuevo proyecto en [vercel.com](https://vercel.com) e importe el repositorio.
3. Configure las variables de entorno:

| Variable | Descripción |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio para registro de cuentas |
| `NEXT_PUBLIC_DEFAULT_TIMEZONE` | `America/Asuncion` |
| `NEXT_PUBLIC_COMPANY_NAME` | `Cooperativa Chinokue Ltda` |

4. Presione **Deploy**.

---

## Uso local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) en el navegador. En el primer inicio, el sistema solicitará registrar los datos del administrador principal de la entidad.
