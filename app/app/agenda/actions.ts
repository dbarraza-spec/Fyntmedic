'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireMiembro, OFFSET } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { txt } from '@/lib/form';

export async function guardarCita(f: FormData) {
  const ctx = await requireMiembro();
  const id = txt(f, 'id'), pac = txt(f, 'paciente'), fecha = txt(f, 'fecha'), hora = txt(f, 'hora');
  const nombre = txt(f, 'nombre'), tel = txt(f, 'tel');
  if (!fecha || !hora || (!pac && !nombre)) redirect(`/app/agenda?d=${fecha}&error=${encodeURIComponent('Elige un paciente o escribe el nombre, y pon fecha y hora.')}`);
  const inicio = new Date(`${fecha}T${hora}:00${OFFSET}`).toISOString();
  const dur = Number(txt(f, 'dur')) || 30;
  const sb = await supabaseServer();
  const datos = { paciente_id: pac || null, nombre_nuevo: pac ? null : nombre, telefono_nuevo: pac ? null : tel || null, inicio, duracion_min: dur, motivo: txt(f, 'motivo') || null };
  const r = id ? await sb.from('citas').update(datos).eq('id', id) : await sb.from('citas').insert({ ...datos, clinica_id: ctx.miembro.clinica_id, creado_por: ctx.userId });
  if (r.error) redirect(`/app/agenda?d=${fecha}&error=${encodeURIComponent(r.error.message)}`);
  // ¿Se encima con otra?
  const fin = new Date(new Date(inicio).getTime() + dur * 60000).toISOString();
  const { data: otras } = await sb.from('citas').select('id, inicio, duracion_min').eq('clinica_id', ctx.miembro.clinica_id).neq('estado', 'cancelada').lt('inicio', fin).gte('inicio', new Date(new Date(inicio).getTime() - 8 * 3600e3).toISOString());
  const cruce = (otras ?? []).filter((c) => new Date(c.inicio).getTime() + c.duracion_min * 60000 > new Date(inicio).getTime()).length > 1;
  revalidatePath('/app/agenda');
  redirect(`/app/agenda?d=${fecha}&ok=${encodeURIComponent(cruce ? 'Cita guardada. Ojo: se encima con otra cita.' : 'Cita guardada.')}`);
}

export async function estadoCita(f: FormData) {
  await requireMiembro();
  const sb = await supabaseServer();
  await sb.from('citas').update({ estado: txt(f, 'estado') }).eq('id', txt(f, 'id'));
  revalidatePath('/app/agenda');
  redirect(`/app/agenda?d=${txt(f, 'd')}`);
}

export async function iniciarConsulta(f: FormData) {
  const ctx = await requireMiembro();
  const sb = await supabaseServer();
  const { data: c } = await sb.from('citas').select('id, paciente_id, nombre_nuevo, telefono_nuevo, motivo').eq('id', txt(f, 'id')).single();
  if (!c) redirect('/app/agenda');
  if (!c.paciente_id) {
    const q = new URLSearchParams({ nombre: c.nombre_nuevo ?? '', tel: c.telefono_nuevo ?? '', cita: c.id });
    redirect(`/app/pacientes/nuevo?${q}`);
  }
  await sb.from('citas').update({ estado: 'atendida' }).eq('id', c.id);
  if (ctx.miembro.rol !== 'medico' && ctx.miembro.rol !== 'enfermeria') redirect(`/app/pacientes/${c.paciente_id}`);
  const { data: n, error } = await sb.from('notas').insert({ clinica_id: ctx.miembro.clinica_id, paciente_id: c.paciente_id, motivo: c.motivo }).select('id').single();
  if (error || !n) redirect(`/app/pacientes/${c.paciente_id}`);
  redirect(`/app/pacientes/${c.paciente_id}/notas/${n.id}`);
}
