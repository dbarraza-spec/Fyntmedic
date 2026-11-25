'use server';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { crearCuenta } from '@/lib/usuarios';
import { txt } from '@/lib/form';

export async function crearClinica(_: { error?: string; ok?: string } | undefined, f: FormData) {
  const ctx = await getCtx();
  if (!ctx.superadmin) return { error: 'Solo el súper admin puede crear clínicas.' };
  const sb = await supabaseServer();
  const email = txt(f, 'email').toLowerCase();
  let adminId: string | null = null;
  if (f.get('yo') === 'on') adminId = ctx.userId;
  else {
    const cuenta = await crearCuenta(email, String(f.get('password') ?? ''));
    if ('error' in cuenta) return { error: cuenta.error };
    adminId = cuenta.id;
  }
  const { error } = await sb.rpc('crear_clinica', { p_nombre: txt(f, 'clinica'), p_admin: adminId, p_admin_nombre: txt(f, 'nombre'), p_plan: txt(f, 'plan') });
  if (error) return { error: error.message };
  revalidatePath('/app/admin');
  return { ok: `Clínica “${txt(f, 'clinica')}” creada.` };
}
