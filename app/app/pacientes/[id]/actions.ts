'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCtx } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { txt, dxDe } from '@/lib/form';

export async function nuevaNota(pacienteId: string) {
  const ctx = await getCtx();
  if (!ctx.miembro) throw new Error('Sin clínica');
  const sb = await supabaseServer();
  const { data, error } = await sb.from('notas').insert({ clinica_id: ctx.miembro.clinica_id, paciente_id: pacienteId }).select('id').single();
  if (error) throw new Error(error.message);
  redirect(`/app/pacientes/${pacienteId}/notas/${data.id}`);
}

const SIG = ['ta', 'fc', 'fr', 'temp', 'spo2', 'peso', 'talla', 'gluc', 'dolor'];

export async function guardarNota(_: { error?: string; ok?: string } | undefined, f: FormData) {
  const id = txt(f, 'id'), pac = txt(f, 'pac'), accion = txt(f, 'accion');
  const sb = await supabaseServer();
  const cambios: Record<string, unknown> = {
    motivo: txt(f, 'motivo'),
    signos: Object.fromEntries(SIG.map((k) => [k, txt(f, 'v_' + k)]).filter(([, v]) => v)),
    subjetivo: txt(f, 'subjetivo'),
    exploracion: txt(f, 'exploracion'),
    diagnosticos: dxDe(f, 'dx', 4),
    pronostico: txt(f, 'pronostico'),
    plan: txt(f, 'plan'),
  };
  if (accion === 'firmar') cambios.estado = 'firmada';
  const { error } = await sb.from('notas').update(cambios).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath(`/app/pacientes/${pac}`);
  if (accion === 'firmar' || accion === 'corregir') redirect(`/app/pacientes/${pac}/notas/${id}`);
  return { ok: 'Borrador guardado.' };
}

export async function agregarAddendum(f: FormData) {
  const ctx = await getCtx();
  const id = txt(f, 'id'), pac = txt(f, 'pac'), texto = txt(f, 'texto');
  if (!texto || !ctx.miembro) return;
  const sb = await supabaseServer();
  const { error } = await sb.from('addenda').insert({
    nota_id: id, clinica_id: ctx.miembro.clinica_id, texto, autor_id: ctx.userId,
    autor_nombre: `${ctx.miembro.titulo ?? ''} ${ctx.miembro.nombre}`.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/pacientes/${pac}/notas/${id}`);
}

export async function registrarEstudio(e: { paciente: string; path: string; tipo: string; nombre: string; fecha: string; laboratorio: string; resultado: string }) {
  const ctx = await getCtx();
  if (!ctx.miembro) return { error: 'Sin clínica.' };
  if (!e.path.startsWith(`${ctx.miembro.clinica_id}/${e.paciente}/`)) return { error: 'Ruta inválida.' };
  const sb = await supabaseServer();
  const { error } = await sb.from('estudios').insert({
    clinica_id: ctx.miembro.clinica_id, paciente_id: e.paciente, tipo: e.tipo, nombre: e.nombre.trim(), fecha: e.fecha,
    laboratorio: e.laboratorio.trim() || null, resultado: e.resultado.trim() || null, archivo_path: e.path, subido_por: ctx.userId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/app/pacientes/${e.paciente}`);
  return { ok: true };
}
