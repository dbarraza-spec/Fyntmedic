import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCtx, veClinico, nombreCompleto, edad, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { nuevaNota } from './actions';

export default async function Expediente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCtx();
  const sb = await supabaseServer();
  const { data: p } = await sb.from('pacientes').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  await sb.rpc('registrar_consulta', { p_paciente: id }); // queda en la bitácora quién abrió el expediente
  const clinico = veClinico(ctx.miembro?.rol);
  const puedeNota = ctx.miembro?.rol === 'medico' || ctx.miembro?.rol === 'enfermeria';
  const { data: notas } = clinico
    ? await sb.from('notas').select('id, motivo, estado, firmada_en, creado_en, medico_nombre, diagnosticos').eq('paciente_id', id).order('creado_en', { ascending: false })
    : { data: null };
  const em = p.contacto_emergencia as { nombre?: string; parentesco?: string; telefono?: string };
  const crear = nuevaNota.bind(null, id);
  const ahora = Date.now();
  return (
    <>
      <Link href="/app/pacientes" style={{ fontWeight: 600, fontSize: 14 }}>← Pacientes</Link>
      <section className="card" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: '1 1 320px' }}>
          <h1>{nombreCompleto(p)}</h1>
          <div className="sub">{p.sexo} · {edad(p.fecha_nacimiento)} años · Exp. {String(p.folio).padStart(6, '0')}{p.curp ? ` · ${p.curp}` : ''}</div>
          <div className="sub">Tel. {p.telefono}{em?.nombre ? ` · Emergencia: ${em.nombre} (${em.parentesco ?? ''}) ${em.telefono ?? ''}` : ''}</div>
        </div>
        {puedeNota && <form action={crear}><button className="btn">+ Nota de evolución</button></form>}
      </section>
      <div className="g3">
        <div className="card" style={{ background: 'var(--rojo-f)', border: 0 }}><b style={{ fontSize: 12, color: 'var(--rojo-t)' }}>TIPO DE SANGRE</b><b style={{ fontSize: 24 }}>{p.tipo_sangre ?? '—'}</b></div>
        <div className="card" style={{ background: 'var(--ama-f)', border: 0 }}><b style={{ fontSize: 12, color: 'var(--ama-t)' }}>ALERGIAS</b><span>{p.alergias?.length ? p.alergias.join(', ') : p.niega_alergias ? 'Niega alergias' : 'No registradas'}</span></div>
        <div className="card" style={{ background: 'var(--azul-claro)', border: 0 }}><b style={{ fontSize: 12, color: 'var(--azul)' }}>ENFERMEDADES</b><span>{(p.enfermedades as { c: string; d: string }[]).map((e) => `${e.c} ${e.d}`).join(' · ') || 'Ninguna'}</span></div>
        <div className="card" style={{ background: '#F3E8FF', border: 0 }}><b style={{ fontSize: 12, color: '#6b21a8' }}>CIRUGÍAS</b><span style={{ whiteSpace: 'pre-line' }}>{p.cirugias || 'Ninguna'}</span></div>
      </div>
      {clinico ? (
        <section className="card"><h2>Notas de evolución</h2>
          {(notas ?? []).length === 0 && <span className="ayuda">Este paciente aún no tiene notas.</span>}
          {(notas ?? []).map((n) => {
            const edit = n.estado === 'firmada' && n.firmada_en && ahora - new Date(n.firmada_en).getTime() < 864e5;
            return (
              <Link key={n.id} href={`/app/pacientes/${id}/notas/${n.id}`} className="fila" style={{ border: '1px solid var(--borde)', borderRadius: 14, padding: '12px 14px', color: 'inherit', justifyContent: 'space-between' }}>
                <span><b>{fecha(n.creado_en)} — {n.motivo || 'Sin motivo'}</b><br /><span className="ayuda">{(n.diagnosticos as { c: string }[]).map((d) => d.c).join(', ') || 'Sin diagnóstico'}{n.medico_nombre ? ` · ${n.medico_nombre}` : ''}</span></span>
                <span className={`chip ${n.estado === 'borrador' ? 'a' : edit ? '' : 'v'}`}>{n.estado === 'borrador' ? 'Borrador' : edit ? 'Firmada · corregible 24 h' : 'Sellada'}</span>
              </Link>
            );
          })}
        </section>
      ) : (
        <div className="aviso">Tu rol no tiene acceso a las notas clínicas de este paciente.</div>
      )}
      <div className="aviso">Expediente creado el {fecha(p.creado_en)}. Se conserva al menos 5 años (NOM-004). Las notas firmadas no se borran.</div>
    </>
  );
}
