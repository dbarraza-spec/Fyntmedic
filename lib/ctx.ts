import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export type Rol = 'admin' | 'medico' | 'enfermeria' | 'recepcion';
export type Clinica = { id: string; nombre: string; color: string; logo_path: string | null; domicilio: string | null; telefono: string | null; licencia: string | null };
export type Ctx = {
  userId: string;
  email: string;
  superadmin: boolean;
  miembro: null | { id: string; clinica_id: string; rol: Rol; nombre: string; titulo: string | null; cedula: string | null; especialidad: string | null; universidad: string | null; cedula_especialidad: string | null; firma_path: string | null };
  clinica: null | Clinica;
};

export const TZ = 'America/Mazatlan';

export async function getCtx(): Promise<Ctx> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: sa }, { data: mie }] = await Promise.all([
    sb.from('superadmins').select('user_id').eq('user_id', user.id).maybeSingle(),
    sb.from('miembros').select('id, clinica_id, rol, nombre, titulo, cedula, especialidad, universidad, cedula_especialidad, firma_path').eq('user_id', user.id).eq('activo', true).order('creado_en').limit(1).maybeSingle(),
  ]);
  let clinica: Clinica | null = null;
  if (mie) {
    const { data } = await sb.from('clinicas').select('id, nombre, color, logo_path, domicilio, telefono, licencia').eq('id', mie.clinica_id).single();
    clinica = data;
  }
  return { userId: user.id, email: user.email ?? '', superadmin: !!sa, miembro: mie as Ctx['miembro'], clinica };
}

export async function requireMiembro() {
  const ctx = await getCtx();
  if (!ctx.miembro || !ctx.clinica) redirect('/app');
  return ctx as Ctx & { miembro: NonNullable<Ctx['miembro']>; clinica: Clinica };
}

export const veClinico = (r?: Rol) => r === 'admin' || r === 'medico' || r === 'enfermeria';
export const nombreCompleto = (p: { nombre: string; apellido_paterno: string; apellido_materno?: string | null }) =>
  [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
export const iniciales = (p: { nombre: string; apellido_paterno: string }) => (p.nombre[0] ?? '') + (p.apellido_paterno[0] ?? '');
export const folio = (n: number) => String(n).padStart(6, '0');
export const edad = (f: string) => {
  const n = new Date(f + 'T12:00'), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) e--;
  return e;
};
export const fecha = (t: string) => new Date(t).toLocaleString('es-MX', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const soloFecha = (t: string) => new Date(t).toLocaleDateString('es-MX', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const COLS = ['#0077b6', '#ea580c', '#7c3aed', '#0d9488', '#db2777', '#15803d', '#b45309'];
export const colorAvatar = (id: string) => COLS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLS.length];

// URL firmada (1 h) para archivos privados de Storage.
export async function urlFirmada(bucket: string, path: string | null) {
  if (!path) return null;
  const sb = await supabaseServer();
  const { data } = await sb.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

// Mazatlán no cambia de horario desde 2022 (UTC-7 todo el año).
export const OFFSET = '-07:00';
export const hoyYMD = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
export const rangoDia = (ymd: string) => ({ desde: new Date(`${ymd}T00:00:00${OFFSET}`).toISOString(), hasta: new Date(`${ymd}T23:59:59${OFFSET}`).toISOString() });
export const horaLocal = (t: string) => new Date(t).toLocaleTimeString('es-MX', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
