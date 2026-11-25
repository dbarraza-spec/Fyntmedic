import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx, veClinico, nombreCompleto, iniciales, edad, fecha, soloFecha, folio, colorAvatar } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { nuevaNota } from './actions';
import { EstudioForm } from './estudio-form';

type Tab = 'notas' | 'historia' | 'estudios' | 'recetas' | 'bitacora';

export default async function Expediente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const ctx = await getCtx();
  const rol = ctx.miembro?.rol;
  const clinico = veClinico(rol);
  const sb = await supabaseServer();
  const { data: p } = await sb.from('pacientes').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  await sb.rpc('registrar_consulta', { p_paciente: id });

  const tabs: [Tab, string][] = clinico ? [['notas', 'Notas'], ['historia', 'Historia clínica'], ['estudios', 'Estudios'], ['recetas', 'Recetas']] : [];
  if (rol === 'admin') tabs.push(['bitacora', 'Bitácora']);
  const pedida = (await searchParams).tab as Tab | undefined;
  const tab: Tab | null = tabs.find((t) => t[0] === pedida)?.[0] ?? tabs[0]?.[0] ?? null;

  const [{ data: notas }, { data: hc }] = clinico
    ? await Promise.all([
        sb.from('notas').select('id, motivo, estado, firmada_en, creado_en, medico_nombre, diagnosticos, signos').eq('paciente_id', id).order('creado_en', { ascending: false }),
        sb.from('historias').select('firmada_en, actualizado_en').eq('paciente_id', id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  const ult = (notas ?? []).find((n) => (n.signos as Record<string, string>)?.ta) as { signos: Record<string, string> } | undefined;

  let cuerpo: React.ReactNode = null;
  const ahora = Date.now();
  if (tab === 'notas') {
    cuerpo = notas?.length ? (
      <div className="tl">{notas.map((n) => {
        const dentro = n.estado === 'firmada' && ahora - new Date(n.firmada_en).getTime() < 864e5;
        const [cls, txt, col] = n.estado === 'borrador' ? ['a', 'Borrador · falta firmar', 'var(--ama)'] : dentro ? ['', 'Firmada · corregible 24 h', 'var(--azul)'] : ['v', 'Sellada y firmada', '#16A34A'];
        return (
          <Link key={n.id} className="nt" href={`/app/pacientes/${id}/notas/${n.id}`} style={{ color: 'inherit', display: 'block' }}>
            <i style={{ background: col, boxShadow: `0 0 0 2px ${col}` }} />
            <div className="fila" style={{ justifyContent: 'space-between' }}><b>{fecha(n.creado_en)} — {n.motivo || 'Nota de evolución'}</b><span className={`chip ${cls}`}>{txt}</span></div>
            <div className="ayuda" style={{ marginTop: 4 }}>{(n.diagnosticos as { c: string; d: string }[]).map((d) => `${d.c} ${d.d}`).join(' · ') || 'Sin diagnóstico'}{n.medico_nombre ? ` · ${n.medico_nombre}` : ''}</div>
          </Link>
        );
      })}</div>
    ) : <div className="vacio">Este paciente todavía no tiene notas.</div>;
  }
  if (tab === 'historia') {
    cuerpo = (
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <div><b>{hc ? (hc.firmada_en ? `Historia clínica firmada el ${fecha(hc.firmada_en)}` : 'Historia clínica en borrador') : 'Sin historia clínica'}</b><div className="ayuda">Antecedentes, interrogatorio por aparatos y sistemas y padecimiento actual.</div></div>
        <Link className={`btn${hc ? ' sec' : ''}`} href={`/app/pacientes/${id}/historia`}>{hc ? (hc.firmada_en ? 'Ver historia clínica' : 'Continuar') : 'Hacer historia clínica'}</Link>
      </div>
    );
  }
  if (tab === 'estudios') {
    const { data: es } = await sb.from('estudios').select('id, tipo, nombre, fecha, laboratorio, resultado, archivo_path').eq('paciente_id', id).order('fecha', { ascending: false });
    const urls = await Promise.all((es ?? []).map(async (x) => x.archivo_path ? (await sb.storage.from('estudios').createSignedUrl(x.archivo_path, 3600)).data?.signedUrl ?? null : null));
    cuerpo = (
      <>
        <div className="thumbs">{(es ?? []).map((x, i) => {
          const img = /\.(png|jpe?g|webp|gif)$/i.test(x.archivo_path ?? '');
          return (
            <a key={x.id} className="th" href={urls[i] ?? '#'} target="_blank" rel="noreferrer" title={x.resultado ?? ''}>
              {img && urls[i] ? <img src={urls[i]!} alt="" /> : <em>{(x.archivo_path ?? '').split('.').pop()?.toUpperCase() ?? 'ARCHIVO'}</em>}
              <span>{x.nombre}<br /><small style={{ fontWeight: 500, color: 'var(--gris)' }}>{x.tipo} · {soloFecha(x.fecha + 'T12:00:00')}</small></span>
            </a>
          );
        })}</div>
        {!es?.length && <div className="vacio">Aún no hay estudios anexados.</div>}
        <EstudioForm clinica={p.clinica_id} paciente={id} />
      </>
    );
  }
  if (tab === 'recetas') {
    const { data: rs } = await sb.from('recetas').select('id, creado_en, medicamentos, medico_nombre').eq('paciente_id', id).order('creado_en', { ascending: false });
    cuerpo = (
      <>
        {rs?.length ? <div className="tb-caja"><table><thead><tr><th>Fecha</th><th>Medicamentos</th><th>Médico</th><th></th></tr></thead><tbody>
          {rs.map((r) => <tr key={r.id}><td>{fecha(r.creado_en)}</td><td>{(r.medicamentos as { med: string }[]).map((m) => m.med).join(', ')}</td><td>{r.medico_nombre}</td><td><Link className="btn sec ch" href={`/app/recetas/${r.id}`}>Ver / PDF</Link></td></tr>)}
        </tbody></table></div> : <div className="vacio">Este paciente no tiene recetas.</div>}
        {rol === 'medico' && <div><Link className="btn" href={`/app/pacientes/${id}/receta`}>+ Nueva receta</Link></div>}
      </>
    );
  }
  if (tab === 'bitacora') {
    const { data: b } = await sb.from('bitacora').select('id, creado_en, accion, tabla, user_id').eq('paciente_id', id).order('creado_en', { ascending: false }).limit(200);
    const { data: ms } = await sb.from('miembros').select('user_id, titulo, nombre').eq('clinica_id', p.clinica_id);
    const quien = (u: string | null) => { const m = ms?.find((x) => x.user_id === u); return m ? `${m.titulo ?? ''} ${m.nombre}`.trim() : '—'; };
    cuerpo = b?.length ? <div className="tb-caja"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Sobre</th></tr></thead><tbody>
      {b.map((x) => <tr key={x.id}><td>{fecha(x.creado_en)}</td><td>{quien(x.user_id)}</td><td><b>{x.accion}</b></td><td>{x.tabla}</td></tr>)}
    </tbody></table></div> : <div className="vacio">Sin movimientos.</div>;
  }

  const em = p.contacto_emergencia as { nombre?: string; parentesco?: string; telefono?: string };
  const box = (bg: string, c: string, t: string, v: React.ReactNode) => <div style={{ background: bg, borderRadius: 18, padding: '14px 16px' }}><div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.05em', color: c }}>{t}</div><div style={{ fontWeight: 700, marginTop: 6, whiteSpace: 'pre-line', color: c }}>{v}</div></div>;
  return (
    <>
      <Link className="back" href="/app/pacientes">← Expedientes</Link>
      <section className="card" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
        <div className="av" style={{ width: 72, height: 72, fontSize: 24, background: colorAvatar(p.id) }}>{iniciales(p)}</div>
        <div style={{ flex: '1 1 300px' }}>
          <h1>{nombreCompleto(p)}</h1>
          <div className="sub">{p.sexo} · {edad(p.fecha_nacimiento)} años ({soloFecha(p.fecha_nacimiento + 'T12:00:00')}) · Exp. {folio(p.folio)}{p.curp ? ` · ${p.curp}` : ''}</div>
          <div className="sub">Tel. {p.telefono}{em?.nombre ? ` · Emergencia: ${em.nombre}${em.parentesco ? ` (${em.parentesco})` : ''} ${em.telefono ?? ''}` : ''}</div>
        </div>
        <div className="fila">
          {rol === 'medico' && <Link className="btn borde ch" href={`/app/pacientes/${id}/receta`}>+ Receta</Link>}
          {(rol === 'medico' || rol === 'enfermeria') && <form action={nuevaNota.bind(null, id)}><button className="btn">+ Nota de evolución</button></form>}
        </div>
      </section>
      <div className="g4">
        {box('var(--rojo-f)', 'var(--rojo-t)', 'TIPO DE SANGRE', <span style={{ fontSize: 26, fontWeight: 800 }}>{p.tipo_sangre ?? '—'}</span>)}
        {box('var(--ama-f)', 'var(--ama-t)', 'ALERGIAS', p.alergias?.length ? p.alergias.join('\n') : p.niega_alergias ? 'Niega alergias' : 'No registradas')}
        {box('var(--azul-claro)', 'var(--azul)', 'ENFERMEDADES ACTUALES', (p.enfermedades as { c: string; d: string }[]).map((e) => `${e.c} ${e.d.split(',')[0]}`).join('\n') || 'Ninguna registrada')}
        {box('#F3E8FF', '#6b21a8', 'CIRUGÍAS', p.cirugias || 'Ninguna')}
        {clinico && box('var(--verde-f)', 'var(--verde-t)', 'ÚLTIMOS SIGNOS', ult ? `TA ${ult.signos.ta ?? '—'} · FC ${ult.signos.fc ?? '—'}\nTemp ${ult.signos.temp ?? '—'} °C · SpO₂ ${ult.signos.spo2 ?? '—'}%` : 'Sin registro')}
      </div>
      {tab ? (
        <section className="card">
          <div className="tabs">{tabs.map(([k, l]) => <Link key={k} className={`tab${tab === k ? ' on' : ''}`} href={`/app/pacientes/${id}?tab=${k}`}>{l}</Link>)}</div>
          {cuerpo}
        </section>
      ) : <div className="aviso">Tu rol no tiene acceso a las notas clínicas de este paciente.</div>}
      <div className="aviso">Expediente creado el {soloFecha(p.creado_en)}. Se conserva al menos 5 años (NOM-004). Las notas firmadas no se borran.</div>
    </>
  );
}
