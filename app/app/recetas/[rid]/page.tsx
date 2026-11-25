import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMiembro, veClinico, nombreCompleto, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { marcaDe, pacienteDe, firmaDe } from '@/lib/pdf-data';
import { PdfBoton } from '@/components/pdf-boton';

export default async function VerReceta({ params }: { params: Promise<{ rid: string }> }) {
  const { rid } = await params;
  const ctx = await requireMiembro();
  if (!veClinico(ctx.miembro.rol)) return <div className="aviso">Tu rol no tiene acceso a recetas.</div>;
  const sb = await supabaseServer();
  const { data: r } = await sb.from('recetas').select('*, paciente:pacientes(id, nombre, apellido_paterno, apellido_materno, folio, fecha_nacimiento, sexo, tipo_sangre, alergias, niega_alergias)').eq('id', rid).maybeSingle();
  const p = (Array.isArray(r?.paciente) ? r?.paciente[0] : r?.paciente) as { id: string; nombre: string; apellido_paterno: string; apellido_materno: string | null; folio: number; fecha_nacimiento: string; sexo: string; tipo_sangre: string | null; alergias: string[] | null; niega_alergias: boolean } | undefined;
  if (!r || !p) notFound();
  const meds = r.medicamentos as { med: string; dosis?: string; via?: string; frec?: string; dur?: string; cant?: string; ind?: string }[];
  const { data: mie } = await sb.from('miembros').select('especialidad, universidad').eq('clinica_id', r.clinica_id).eq('user_id', r.medico_id).maybeSingle();
  return (
    <>
      <div className="top">
        <div><Link className="back" href="/app/recetas">← Recetas</Link><h1>Receta de {nombreCompleto(p)}</h1><div className="sub">{fecha(r.creado_en)} · {r.medico_nombre} · Céd. {r.medico_cedula}</div></div>
        <div className="fila"><span className="chip v">Sellada</span><Link className="btn sec" href={`/app/pacientes/${p.id}`}>Ver expediente</Link>
          <PdfBoton etiqueta="Descargar para imprimir" marca={await marcaDe(ctx.clinica)} paciente={pacienteDe(p)} firmaUrl={await firmaDe(r.clinica_id, r.medico_id)}
            receta={{ id: r.id, creado: r.creado_en, meds, ind: r.indicaciones, peso: r.peso, talla: r.talla, medico: r.medico_nombre, cedula: r.medico_cedula, especialidad: mie?.especialidad ?? null, universidad: mie?.universidad ?? null, sello: r.sello }} /></div>
      </div>
      <section className="card ver" style={{ gap: 0 }}>
        <h3>Rp.</h3>
        {meds.map((m, i) => <p key={i} style={{ marginBottom: 10 }}><b>{i + 1}. {m.med}</b>{m.cant ? ` — surtir ${m.cant}` : ''}{'\n'}{[m.dosis, m.via && 'vía ' + m.via.toLowerCase(), m.frec, m.dur && 'durante ' + m.dur].filter(Boolean).join(', ')}{m.ind ? '\n' + m.ind : ''}</p>)}
        {r.indicaciones && <><h3>INDICACIONES GENERALES</h3><p>{r.indicaciones}</p></>}
        <h3>SELLO</h3><p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--gris)', overflowWrap: 'anywhere' }}>{r.sello}</p>
      </section>
      <div className="aviso">Para imprimir: descarga el PDF y ábrelo; desde ahí lo mandas a la impresora o lo compartes por WhatsApp.</div>
    </>
  );
}
