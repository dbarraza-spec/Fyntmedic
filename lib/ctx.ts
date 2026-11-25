import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export type Rol = 'admin' | 'medico' | 'enfermeria' | 'recepcion';
export type Ctx = {
  userId: string;
  email: string;
  superadmin: boolean;
  miembro: null | { clinica_id: string; rol: Rol; nombre: string; titulo: string | null; cedula: string | null };
  clinica: null | { id: string; nombre: string; color: string };
};

export async function getCtx(): Promise<Ctx> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: sa }, { data: mie }] = await Promise.all([
    sb.from('superadmins').select('user_id').eq('user_id', user.id).maybeSingle(),
    sb.from('miembros').select('clinica_id, rol, nombre, titulo, cedula').eq('user_id', user.id).eq('activo', true).order('creado_en').limit(1).maybeSingle(),
  ]);
  let clinica = null;
  if (mie) {
    const { data } = await sb.from('clinicas').select('id, nombre, color').eq('id', mie.clinica_id).single();
    clinica = data;
  }
  return { userId: user.id, email: user.email ?? '', superadmin: !!sa, miembro: mie as Ctx['miembro'], clinica };
}

export const veClinico = (r?: Rol) => r === 'admin' || r === 'medico' || r === 'enfermeria';
export const nombreCompleto = (p: { nombre: string; apellido_paterno: string; apellido_materno?: string | null }) =>
  [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
export const edad = (f: string) => {
  const n = new Date(f + 'T12:00'), h = new Date();
  let e = h.getFullYear() - n.getFullYear();
  if (h < new Date(h.getFullYear(), n.getMonth(), n.getDate())) e--;
  return e;
};
export const fecha = (t: string) => new Date(t).toLocaleString('es-MX', { timeZone: 'America/Mazatlan', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
