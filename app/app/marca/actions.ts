'use server';
import { revalidatePath } from 'next/cache';
import { requireMiembro } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { txt, opt } from '@/lib/form';

export async function guardarMarca(_: { error?: string; ok?: string } | undefined, f: FormData) {
  const ctx = await requireMiembro();
  if (ctx.miembro.rol !== 'admin') return { error: 'Solo el administrador cambia la marca.' };
  const color = txt(f, 'color');
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: 'Color inválido.' };
  const sb = await supabaseServer();
  const { error } = await sb.from('clinicas').update({ nombre: txt(f, 'nombre') || ctx.clinica.nombre, color, domicilio: opt(f, 'dir'), telefono: opt(f, 'tel'), licencia: opt(f, 'lic') }).eq('id', ctx.clinica.id);
  if (error) return { error: error.message };
  revalidatePath('/app', 'layout');
  return { ok: 'Marca guardada.' };
}

export async function guardarLogo(path: string | null) {
  const ctx = await requireMiembro();
  if (ctx.miembro.rol !== 'admin') return { error: 'Solo el administrador cambia el logo.' };
  if (path && !path.startsWith(ctx.clinica.id + '/logo')) return { error: 'Ruta inválida.' };
  const sb = await supabaseServer();
  const { error } = await sb.from('clinicas').update({ logo_path: path }).eq('id', ctx.clinica.id);
  if (error) return { error: error.message };
  revalidatePath('/app', 'layout');
  return { ok: true };
}
