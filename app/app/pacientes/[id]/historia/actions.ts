'use server';
import { revalidatePath } from 'next/cache';
import { requireMiembro } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';

export async function guardarHistoria(_: { error?: string; ok?: string } | undefined, f: FormData) {
  const ctx = await requireMiembro();
  const pac = String(f.get('_pac')), accion = String(f.get('accion'));
  const datos: Record<string, string | boolean> = {};
  for (const [k, v] of f.entries()) if (!k.startsWith('_') && k !== 'accion' && !k.startsWith('$')) datos[k] = v === 'on' ? true : String(v);
  const sb = await supabaseServer();
  const { error } = await sb.from('historias').upsert({
    paciente_id: pac, clinica_id: ctx.miembro.clinica_id, datos,
    ...(accion === 'firmar' ? { firmada_en: new Date().toISOString() } : {}),
  }, { onConflict: 'paciente_id' });
  if (error) return { error: error.message };
  revalidatePath(`/app/pacientes/${pac}/historia`);
  return { ok: accion === 'firmar' ? 'Historia clínica firmada.' : 'Historia clínica guardada.' };
}
