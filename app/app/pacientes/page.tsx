import Link from 'next/link';
import { getCtx, nombreCompleto, edad } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';

export default async function Pacientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await getCtx();
  if (!ctx.miembro) return <div className="card">Sin clínica asignada.</div>;
  const q = ((await searchParams).q ?? '').replace(/[,()*%\\]/g, ' ').trim();
  const sb = await supabaseServer();
  let query = sb.from('pacientes')
    .select('id, folio, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, telefono, tipo_sangre, alergias, niega_alergias, enfermedades')
    .eq('clinica_id', ctx.miembro.clinica_id)
    .order('creado_en', { ascending: false })
    .limit(60);
  if (q) {
    const f = [`nombre.ilike.%${q}%`, `apellido_paterno.ilike.%${q}%`, `apellido_materno.ilike.%${q}%`, `telefono.ilike.%${q}%`, `curp.ilike.%${q}%`];
    if (/^\d+$/.test(q)) f.push(`folio.eq.${Number(q)}`);
    query = query.or(f.join(','));
  }
  const { data: lista, error } = await query;
  return (
    <>
      <div className="top">
        <div><h1>Pacientes</h1><div className="sub">{ctx.clinica?.nombre}</div></div>
        <Link className="btn" href="/app/pacientes/nuevo">+ Alta de paciente</Link>
      </div>
      <form className="fila" role="search">
        <input className="i" name="q" defaultValue={q} placeholder="Nombre, apellido, teléfono, CURP o folio" style={{ flex: '1 1 320px' }} aria-label="Buscar paciente" />
        <button className="btn sec">Buscar</button>
      </form>
      {error && <div className="aviso er">No se pudo cargar la lista: {error.message}</div>}
      <div className="g3">
        {(lista ?? []).map((p) => (
          <Link key={p.id} href={`/app/pacientes/${p.id}`} className="card" style={{ color: 'inherit', gap: 8 }}>
            <b>{nombreCompleto(p)}</b>
            <span className="ayuda">{edad(p.fecha_nacimiento)} años · Exp. {String(p.folio).padStart(6, '0')} · Tel. {p.telefono}</span>
            <div className="fila" style={{ gap: 6 }}>
              {p.tipo_sangre && <span className="chip r">{p.tipo_sangre}</span>}
              {p.alergias?.length ? <span className="chip a">Alergia: {p.alergias.join(', ')}</span> : p.niega_alergias ? <span className="chip v">Sin alergias</span> : null}
              {(p.enfermedades as { c: string }[]).slice(0, 2).map((e) => <span key={e.c} className="chip">{e.c}</span>)}
            </div>
          </Link>
        ))}
      </div>
      {lista && lista.length === 0 && <div className="card" style={{ textAlign: 'center', color: 'var(--gris)' }}>{q ? `Nadie coincide con “${q}”.` : 'Todavía no hay pacientes.'}</div>}
    </>
  );
}
