import 'server-only';
import { edad, nombreCompleto, urlFirmada, type Clinica } from './ctx';
import { supabaseServer } from './supabase/server';

export async function marcaDe(c: Clinica) {
  return { nombre: c.nombre, color: c.color, domicilio: c.domicilio, telefono: c.telefono, licencia: c.licencia, logoUrl: await urlFirmada('marca', c.logo_path) };
}
export function pacienteDe(p: { nombre: string; apellido_paterno: string; apellido_materno: string | null; folio: number; fecha_nacimiento: string; sexo: string; tipo_sangre: string | null; alergias: string[] | null; niega_alergias: boolean }) {
  return { nombre: nombreCompleto(p), folio: p.folio, edad: edad(p.fecha_nacimiento), sexo: p.sexo, sangre: p.tipo_sangre, alergias: p.alergias ?? [], niega: p.niega_alergias };
}
// Firma autógrafa del médico que firmó (si la subió).
export async function firmaDe(clinica: string, medicoId: string | null) {
  if (!medicoId) return null;
  const sb = await supabaseServer();
  const { data } = await sb.from('miembros').select('firma_path').eq('clinica_id', clinica).eq('user_id', medicoId).maybeSingle();
  return urlFirmada('marca', data?.firma_path ?? null);
}
