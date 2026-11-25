'use server';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { crearCuenta } from '@/lib/usuarios';
import { txt, opt } from '@/lib/form';

export async function crearUsuario(_: { error?: string; ok?: string } | undefined, f: FormData) {
  const ctx = await getCtx();
  if (ctx.miembro?.rol !== 'admin') return { error: 'Solo el administrador de la clínica puede dar de alta usuarios.' };
  const rol = txt(f, 'rol');
  if (!['admin', 'medico', 'enfermeria', 'recepcion'].includes(rol)) return { error: 'Rol inválido.' };
  if (rol === 'medico' && !txt(f, 'cedula')) return { error: 'Para el rol Médico la cédula profesional es obligatoria.' };
  const cuenta = await crearCuenta(txt(f, 'email').toLowerCase(), String(f.get('password') ?? ''));
  if ('error' in cuenta) return { error: cuenta.error };
  const sb = await supabaseServer();
  const { error } = await sb.from('miembros').insert({
    clinica_id: ctx.miembro.clinica_id, user_id: cuenta.id, rol,
    titulo: opt(f, 'titulo'), nombre: txt(f, 'nombre'), cedula: opt(f, 'cedula'),
    especialidad: opt(f, 'especialidad'), cedula_especialidad: opt(f, 'cedula_esp'), universidad: opt(f, 'universidad'),
  });
  if (error) return { error: 'Se creó la cuenta pero no el acceso a la clínica: ' + error.message };
  revalidatePath('/app/usuarios');
  return { ok: `Listo. ${txt(f, 'nombre')} ya puede entrar con ${txt(f, 'email')} y la contraseña temporal.` };
}

export async function cambiarActivo(f: FormData) {
  const ctx = await getCtx();
  if (ctx.miembro?.rol !== 'admin') return;
  const sb = await supabaseServer();
  await sb.from('miembros').update({ activo: f.get('activo') === 'true' }).eq('id', txt(f, 'id')).eq('clinica_id', ctx.miembro.clinica_id);
  revalidatePath('/app/usuarios');
}
