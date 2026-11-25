import Link from 'next/link';
import { requireMiembro, veClinico, nombreCompleto, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { Icon } from '@/components/icon';

export default async function Recetas({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requireMiembro();
  if (!veClinico(ctx.miembro.rol)) return <div className="aviso">Tu rol no tiene acceso a recetas.</div>;
  const q = ((await searchParams).q ?? '').trim();
  const sb = await supabaseServer();
  const { data } = await sb.from('recetas').select('id, creado_en, medicamentos, medico_nombre, paciente:pacientes(id, nombre, apellido_paterno, apellido_materno, folio)').eq('clinica_id', ctx.miembro.clinica_id).order('creado_en', { ascending: false }).limit(300);
  type Row = { id: string; creado_en: string; medicamentos: { med: string }[]; medico_nombre: string; paciente: { id: string; nombre: string; apellido_paterno: string; apellido_materno: string | null; folio: number } | null };
  const rows = (data ?? []) as unknown as Row[];
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const lista = rows.filter((r) => !q || n(`${r.paciente ? nombreCompleto(r.paciente) : ''} ${(r.medicamentos as { med: string }[]).map((m) => m.med).join(' ')}`).includes(n(q)));
  return (
    <>
      <div className="top"><div><h1>Recetas</h1><div className="sub">Todas quedan guardadas en el expediente de cada paciente y se pueden volver a descargar.</div></div>
        {ctx.miembro.rol === 'medico' && <Link className="btn" href="/app/pacientes">+ Nueva receta (elige paciente)</Link>}</div>
      <form className="ii" role="search" style={{ maxWidth: 720 }}><Icon n="lupa" s={20} /><input name="q" defaultValue={q} placeholder="Buscar por paciente o medicamento…" aria-label="Buscar receta" /><button className="btn ch">Buscar</button></form>
      {lista.length ? <div className="tb-caja"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Medicamentos</th><th>Médico</th><th></th></tr></thead><tbody>
        {lista.map((r) => <tr key={r.id}><td>{fecha(r.creado_en)}</td><td><b>{r.paciente ? nombreCompleto(r.paciente) : '—'}</b></td><td>{(r.medicamentos as { med: string }[]).map((m) => m.med).join(', ')}</td><td>{r.medico_nombre}</td><td><Link className="btn sec ch" href={`/app/recetas/${r.id}`}>Ver / PDF</Link></td></tr>)}
      </tbody></table></div> : <div className="vacio">{q ? 'Sin resultados.' : 'Aún no hay recetas.'}</div>}
    </>
  );
}
