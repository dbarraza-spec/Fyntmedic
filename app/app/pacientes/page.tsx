import Link from 'next/link';
import { requireMiembro } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { Icon } from '@/components/icon';
import { PacienteCard, PAC_COLS, type PacLite } from '@/components/paciente-card';

export default async function Pacientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requireMiembro();
  const q = ((await searchParams).q ?? '').replace(/[,()*%\\.]/g, ' ').trim();
  const sb = await supabaseServer();
  let query = sb.from('pacientes').select(PAC_COLS).eq('clinica_id', ctx.miembro.clinica_id).order('creado_en', { ascending: false }).limit(60);
  if (q) {
    const f = q.split(/\s+/).slice(0, 3).flatMap((w) => [`nombre.ilike.%${w}%`, `apellido_paterno.ilike.%${w}%`, `apellido_materno.ilike.%${w}%`, `telefono.ilike.%${w}%`, `curp.ilike.%${w}%`]);
    if (/^\d+$/.test(q)) f.push(`folio.eq.${Number(q)}`);
    query = query.or(f.join(','));
  }
  const { data, error } = await query;
  const lista = (data ?? []) as PacLite[];
  return (
    <>
      <div className="top">
        <div><h1>Expedientes</h1><div className="sub">Elige un paciente para ver su expediente o hacerle una nota.</div></div>
        <Link className="btn" href="/app/pacientes/nuevo">+ Alta de paciente</Link>
      </div>
      <form className="ii" role="search" style={{ maxWidth: 720 }}><Icon n="lupa" s={20} /><input name="q" defaultValue={q} placeholder="Nombre, apellido, teléfono, CURP o folio…" aria-label="Buscar paciente" autoComplete="off" /><button className="btn ch">Buscar</button></form>
      {error && <div className="aviso er">No se pudo cargar la lista: {error.message}</div>}
      {q && <span className="ayuda">{lista.length} resultado(s) para “{q}”.</span>}
      <div className="g3">{lista.map((p) => <PacienteCard key={p.id} p={p} />)}</div>
      {!lista.length && <div className="vacio">{q ? <>No encontré a nadie con “{q}”. <Link href="/app/pacientes/nuevo">Dar de alta un paciente nuevo</Link></> : 'Todavía no hay pacientes.'}</div>}
    </>
  );
}
