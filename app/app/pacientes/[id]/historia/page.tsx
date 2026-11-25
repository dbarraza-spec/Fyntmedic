import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMiembro, veClinico, nombreCompleto, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { HistoriaForm } from './form';

export default async function Historia({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireMiembro();
  if (!veClinico(ctx.miembro.rol)) return <div className="aviso">Tu rol no tiene acceso a la historia clínica.</div>;
  const sb = await supabaseServer();
  const [{ data: p }, { data: h }] = await Promise.all([
    sb.from('pacientes').select('nombre, apellido_paterno, apellido_materno, sexo, alergias, enfermedades, cirugias').eq('id', id).maybeSingle(),
    sb.from('historias').select('datos, firmada_en, sello').eq('paciente_id', id).maybeSingle(),
  ]);
  if (!p) notFound();
  const previos = [p.alergias?.join(', '), (p.enfermedades as { c: string }[]).map((e) => e.c).join(', '), (p.cirugias ?? '').split('\n')[0]].filter(Boolean).join(' · ');
  return (
    <>
      <div className="top"><div><Link className="back" href={`/app/pacientes/${id}?tab=historia`}>← Expediente de {nombreCompleto(p)}</Link><h1>Historia clínica completa</h1><div className="sub">Apartados de la NOM-004. La ficha de identificación se toma del alta del paciente.</div></div></div>
      {h?.firmada_en && <div className="aviso ok">Firmada el {fecha(h.firmada_en)} · sello {String(h.sello).slice(0, 20)}… Ya no se puede modificar.</div>}
      <HistoriaForm pac={id} datos={(h?.datos ?? {}) as Record<string, string | boolean>} firmada={!!h?.firmada_en} fem={p.sexo === 'Femenino'} previos={previos} puedeFirmar={ctx.miembro.rol === 'medico'} />
    </>
  );
}
