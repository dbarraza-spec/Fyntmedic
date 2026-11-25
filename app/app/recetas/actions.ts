'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireMiembro } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';

export type Med = { med: string; dosis: string; via: string; frec: string; dur: string; cant: string; ind: string; entrega: boolean };

export async function crearReceta(d: { paciente: string; nota: string | null; meds: Med[]; ind: string; peso: string; talla: string }) {
  const ctx = await requireMiembro();
  if (ctx.miembro.rol !== 'medico') return { error: 'Solo un médico puede firmar recetas.' };
  if (!ctx.miembro.cedula) return { error: 'Falta tu cédula profesional. Pídele al administrador que la capture.' };
  const meds = d.meds.map((m) => ({ ...m, med: m.med.trim() })).filter((m) => m.med);
  if (!meds.length) return { error: 'Agrega al menos un medicamento.' };
  const sb = await supabaseServer();
  const { data, error } = await sb.from('recetas').insert({
    clinica_id: ctx.miembro.clinica_id, paciente_id: d.paciente, nota_id: d.nota || null,
    medicamentos: meds.map(({ entrega: _e, ...m }) => m), indicaciones: d.ind.trim() || null, peso: d.peso || null, talla: d.talla || null,
  }).select('id').single();
  if (error) return { error: error.message };
  // Salida de inventario por lo que se entrega en el consultorio.
  const { data: inv } = await sb.from('inventario').select('id, generico, cantidad').eq('clinica_id', ctx.miembro.clinica_id).gt('cantidad', 0);
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  for (const m of meds.filter((x) => x.entrega)) {
    const x = inv?.find((i) => n(m.med).includes(n(i.generico)));
    if (x) await sb.from('inventario').update({ cantidad: x.cantidad - 1 }).eq('id', x.id);
  }
  revalidatePath(`/app/pacientes/${d.paciente}`);
  redirect(`/app/recetas/${data.id}`);
}
