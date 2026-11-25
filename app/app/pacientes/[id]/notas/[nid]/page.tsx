import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireMiembro, veClinico, nombreCompleto, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { marcaDe, pacienteDe, firmaDe } from '@/lib/pdf-data';
import { PdfBoton } from '@/components/pdf-boton';
import { agregarAddendum } from '../../actions';
import { NotaForm, VIT } from './nota-form';

export default async function NotaPage({ params }: { params: Promise<{ id: string; nid: string }> }) {
  const { id, nid } = await params;
  const ctx = await requireMiembro();
  if (!veClinico(ctx.miembro.rol)) return <div className="aviso">Tu rol no tiene acceso a las notas clínicas.</div>;
  const sb = await supabaseServer();
  const [{ data: n }, { data: p }, { data: add }, { count: versiones }] = await Promise.all([
    sb.from('notas').select('*').eq('id', nid).eq('paciente_id', id).maybeSingle(),
    sb.from('pacientes').select('nombre, apellido_paterno, apellido_materno, folio, fecha_nacimiento, sexo, tipo_sangre, alergias, niega_alergias').eq('id', id).maybeSingle(),
    sb.from('addenda').select('id, texto, autor_nombre, creado_en').eq('nota_id', nid).order('creado_en'),
    sb.from('notas_versiones').select('id', { count: 'exact', head: true }).eq('nota_id', nid),
  ]);
  if (!n || !p) notFound();
  const rol = ctx.miembro.rol;
  const dentro24 = n.estado === 'firmada' && Date.now() - new Date(n.firmada_en).getTime() < 864e5;
  const corrigiendo = dentro24 && n.medico_id === ctx.userId;
  const editable = n.estado === 'borrador' ? (rol === 'medico' || rol === 'enfermeria') : corrigiendo;
  const s = n.signos as Record<string, string>;
  const yo = `${ctx.miembro.titulo ?? ''} ${ctx.miembro.nombre}`.trim() + (ctx.miembro.cedula ? ` · Céd. prof. ${ctx.miembro.cedula}` : ' · falta tu cédula');
  const firmada = n.estado === 'firmada';
  return (
    <>
      <div className="top">
        <div><Link className="back" href={`/app/pacientes/${id}`}>← Expediente de {nombreCompleto(p)}</Link>
          <h1>{editable && !corrigiendo ? 'Nota de evolución' : corrigiendo ? 'Corregir nota firmada' : n.motivo || 'Nota de evolución'}</h1>
          <div className="sub">{fecha(n.creado_en)}{n.medico_nombre ? ` · ${n.medico_nombre} · Céd. ${n.medico_cedula}` : ''}</div></div>
        <div className="fila">
          <span className={`chip ${n.estado === 'borrador' ? 'a' : dentro24 ? '' : 'v'}`}>{n.estado === 'borrador' ? 'Borrador' : dentro24 ? 'Firmada · corregible 24 h' : 'Sellada y firmada'}</span>
          {firmada && rol === 'medico' && <Link className="btn borde ch" href={`/app/pacientes/${id}/receta?nota=${nid}`}>Hacer receta</Link>}
          {firmada && <PdfBoton clase="btn ch" marca={await marcaDe(ctx.clinica)} paciente={pacienteDe(p)} firmaUrl={await firmaDe(ctx.miembro.clinica_id, n.medico_id)}
            nota={{ id: n.id, creado: n.creado_en, motivo: n.motivo, signos: s, subjetivo: n.subjetivo, exploracion: n.exploracion, dx: n.diagnosticos, pronostico: n.pronostico, plan: n.plan, firmada: n.firmada_en, medico: n.medico_nombre, cedula: n.medico_cedula, sello: n.sello, addenda: (add ?? []).map((a) => ({ t: a.creado_en, autor: a.autor_nombre ?? '', texto: a.texto })) }} />}
        </div>
      </div>
      {p.alergias?.length ? <div className="aviso er"><b>Alergias:</b> {p.alergias.join(', ')}</div> : null}
      {editable ? (
        <NotaForm nota={n} pac={id} puedeFirmar={rol === 'medico'} corrigiendo={corrigiendo} medico={yo} />
      ) : (
        <section className="card ver" style={{ gap: 0 }}>
          <h3>SIGNOS VITALES</h3><p>{VIT.filter(([k]) => s[k]).map(([k, l]) => `${l.split(' ')[0]} ${s[k]}`).join(' · ') || '—'}</p>
          {n.subjetivo && <><h3>SUBJETIVO / PADECIMIENTO ACTUAL</h3><p>{n.subjetivo}</p></>}
          {n.exploracion && <><h3>EXPLORACIÓN FÍSICA</h3><p>{n.exploracion}</p></>}
          <h3>DIAGNÓSTICO (CIE-10)</h3><p>{(n.diagnosticos as { c: string; d: string }[]).map((d, i) => `${d.c} ${d.d}${i ? '' : ' (principal)'}`).join('\n') || '—'}</p>
          {n.pronostico && <><h3>PRONÓSTICO</h3><p>{n.pronostico}</p></>}
          {n.plan && <><h3>PLAN DE TRATAMIENTO</h3><p>{n.plan}</p></>}
          {n.sello && <><h3>FIRMA</h3><p>{n.medico_nombre} · Céd. prof. {n.medico_cedula}{'\n'}Firmada el {fecha(n.firmada_en)}{'\n'}<span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--gris)', overflowWrap: 'anywhere' }}>Sello {n.sello}</span></p></>}
          {!!versiones && <p className="ayuda" style={{ marginTop: 10 }}>{versiones} corrección(es) con la versión anterior respaldada.</p>}
        </section>
      )}
      {firmada && (
        <section className="card"><h2>Addendum</h2>
          <span className="ayuda">Para aclarar o completar sin tocar la nota original. Cada addendum lleva fecha, hora y quién lo escribió.</span>
          {(add ?? []).map((a) => <div key={a.id} className="aviso"><b>{fecha(a.creado_en)} · {a.autor_nombre}</b><br />{a.texto}</div>)}
          {rol === 'medico' && (
            <form action={agregarAddendum} className="col" style={{ gap: 10 }}>
              <input type="hidden" name="id" value={nid} /><input type="hidden" name="pac" value={id} />
              <textarea className="i" name="texto" required placeholder="Ej. Se recibió resultado de HbA1c: 7.8 %" />
              <div><button className="btn borde">Agregar addendum</button></div>
            </form>
          )}
        </section>
      )}
    </>
  );
}
