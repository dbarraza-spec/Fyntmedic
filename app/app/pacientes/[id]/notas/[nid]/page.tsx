import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx, veClinico, nombreCompleto, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { agregarAddendum } from '../../actions';
import { NotaForm } from './nota-form';

export default async function NotaPage({ params }: { params: Promise<{ id: string; nid: string }> }) {
  const { id, nid } = await params;
  const ctx = await getCtx();
  if (!veClinico(ctx.miembro?.rol)) return <div className="aviso">Tu rol no tiene acceso a las notas clínicas.</div>;
  const sb = await supabaseServer();
  const [{ data: n }, { data: p }, { data: add }, { count: versiones }] = await Promise.all([
    sb.from('notas').select('*').eq('id', nid).eq('paciente_id', id).maybeSingle(),
    sb.from('pacientes').select('nombre, apellido_paterno, apellido_materno, alergias').eq('id', id).maybeSingle(),
    sb.from('addenda').select('id, texto, autor_nombre, creado_en').eq('nota_id', nid).order('creado_en'),
    sb.from('notas_versiones').select('id', { count: 'exact', head: true }).eq('nota_id', nid),
  ]);
  if (!n || !p) notFound();
  const rol = ctx.miembro!.rol;
  const dentro24 = n.estado === 'firmada' && Date.now() - new Date(n.firmada_en).getTime() < 864e5;
  const corrigiendo = dentro24 && n.medico_id === ctx.userId;
  const editable = n.estado === 'borrador' ? (rol === 'medico' || rol === 'enfermeria') : corrigiendo;
  const s = n.signos as Record<string, string>;
  return (
    <>
      <Link href={`/app/pacientes/${id}`} style={{ fontWeight: 600, fontSize: 14 }}>← Expediente de {nombreCompleto(p)}</Link>
      <div className="top">
        <div><h1>{n.estado === 'borrador' ? 'Nota de evolución' : n.motivo || 'Nota de evolución'}</h1><div className="sub">Creada {fecha(n.creado_en)}{n.medico_nombre ? ` · ${n.medico_nombre} · Céd. ${n.medico_cedula}` : ''}</div></div>
        <span className={`chip ${n.estado === 'borrador' ? 'a' : dentro24 ? '' : 'v'}`}>{n.estado === 'borrador' ? 'Borrador' : dentro24 ? 'Firmada · corregible 24 h' : 'Sellada'}</span>
      </div>
      {p.alergias?.length ? <div className="aviso er"><b>Alergias:</b> {p.alergias.join(', ')}</div> : null}
      {editable ? (
        <NotaForm nota={n} pac={id} puedeFirmar={rol === 'medico'} corrigiendo={corrigiendo} />
      ) : (
        <section className="card ver" style={{ gap: 0 }}>
          <h3>SIGNOS VITALES</h3><p>{Object.entries(s).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' · ') || '—'}</p>
          {n.subjetivo && <><h3>SUBJETIVO</h3><p>{n.subjetivo}</p></>}
          {n.exploracion && <><h3>EXPLORACIÓN FÍSICA</h3><p>{n.exploracion}</p></>}
          <h3>DIAGNÓSTICO (CIE-10)</h3><p>{(n.diagnosticos as { c: string; d: string }[]).map((d, i) => `${d.c} ${d.d}${i ? '' : ' (principal)'}`).join('\n')}</p>
          {n.pronostico && <><h3>PRONÓSTICO</h3><p>{n.pronostico}</p></>}
          {n.plan && <><h3>PLAN</h3><p>{n.plan}</p></>}
          {n.sello && <><h3>SELLO SHA-256</h3><p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: 'var(--gris)', overflowWrap: 'anywhere' }}>{n.sello}</p></>}
          {!!versiones && <p className="ayuda" style={{ marginTop: 10 }}>{versiones} corrección(es) con la versión anterior respaldada.</p>}
        </section>
      )}
      {n.estado === 'firmada' && (
        <section className="card"><h2>Addendum</h2>
          <span className="ayuda">Aclaraciones posteriores, sin tocar la nota. Llevan fecha, hora y autor.</span>
          {(add ?? []).map((a) => <div key={a.id} className="aviso"><b>{fecha(a.creado_en)} · {a.autor_nombre}</b><br />{a.texto}</div>)}
          {rol === 'medico' && (
            <form action={agregarAddendum} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input type="hidden" name="id" value={nid} /><input type="hidden" name="pac" value={id} />
              <textarea className="i" name="texto" required placeholder="Ej. Se recibió resultado de HbA1c: 7.8 %" />
              <div><button className="btn sec">Agregar addendum</button></div>
            </form>
          )}
        </section>
      )}
    </>
  );
}
