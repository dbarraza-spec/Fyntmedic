'use server';
import { revalidatePath } from 'next/cache';
import { requireMiembro } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';

export async function guardarFirmaPath(path: string) {
  const ctx = await requireMiembro();
  const sb = await supabaseServer();
  const { error } = await sb.rpc('guardar_mi_firma', { p_clinica: ctx.miembro.clinica_id, p_path: path });
  if (error) return { error: error.message };
  revalidatePath('/app/perfil');
  return { ok: true };
}
