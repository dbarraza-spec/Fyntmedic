import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMiembro, nombreCompleto, edad, folio } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { RecetaForm } from './receta-form';

export default async function NuevaReceta({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nota?: string }> }) {
  const { id } = await params; const { nota } = await searchParams;
  const ctx = await requireMiembro();
  if (ctx.miembro.rol !== 'medico') return <div className="aviso">Solo un médico puede hacer recetas.</div>;
  const sb = await supabaseServer();
  const [{ data: p }, { data: ult }, { data: inv }, { data: n }] = await Promise.all([
    sb.from('pacientes').select('nombre, apellido_paterno, apellido_materno, fecha_nacimiento, folio, alergias').eq('id', id).maybeSingle(),
    sb.from('notas').select('signos').eq('paciente_id', id).order('creado_en', { ascending: false }).limit(5),
    sb.from('inventario').select('generico, presentacion').eq('clinica_id', ctx.miembro.clinica_id).gt('cantidad', 0),
    nota ? sb.from('notas').select('id, motivo, diagnosticos').eq('id', nota).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!p) notFound();
  const conPeso = (ult ?? []).map((x) => x.signos as Record<string, string>).find((s) => s.peso);
  return (
    <>
      <div className="top">
        <div><Link className="back" href={`/app/pacientes/${id}`}>← Expediente de {nombreCompleto(p)}</Link><h1>Receta médica</h1>
          <div className="sub">{nombreCompleto(p)} · {edad(p.fecha_nacimiento)} años · Exp. {folio(p.folio)}{n ? ` · ligada a la nota “${n.motivo ?? ''}”` : ''}</div></div>
        <span className="chip">{`${ctx.miembro.titulo ?? ''} ${ctx.miembro.nombre}`.trim()} · Céd. {ctx.miembro.cedula ?? 'falta'}</span>
      </div>
      {p.alergias?.length ? <div className="aviso er"><b>Alergias:</b> {p.alergias.join(', ')}. Te aviso si recetas algo que se parezca.</div> : null}
      <RecetaForm paciente={id} nota={n?.id ?? null} alergias={p.alergias ?? []} peso={conPeso?.peso ?? ''} talla={conPeso?.talla ?? ''}
        inventario={(inv ?? []).map((x) => `${x.generico} ${x.presentacion}`)} dx={n ? (n.diagnosticos as { c: string; d: string }[]).map((d) => `${d.c} ${d.d}`).join(' · ') : null} />
    </>
  );
}
