import { getCtx, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { FormClinica } from './form';

export default async function Admin() {
  const ctx = await getCtx();
  if (!ctx.superadmin) return <div className="aviso">Solo el súper admin ve esta sección.</div>;
  const sb = await supabaseServer();
  const { data } = await sb.from('clinicas').select('id, nombre, plan, activa, creado_en').order('creado_en', { ascending: false });
  return (
    <>
      <div className="top"><div><h1>Súper admin</h1><div className="sub">Clínicas que usan FyntMedic. Por privacidad, aquí no se ven pacientes.</div></div></div>
      <div className="tb-caja"><table><thead><tr><th>Clínica</th><th>Plan</th><th>Estado</th><th>Alta</th></tr></thead><tbody>
        {(data ?? []).map((c) => <tr key={c.id}><td><b>{c.nombre}</b></td><td>{c.plan}</td><td><span className={`chip ${c.activa ? 'v' : 'r'}`}>{c.activa ? 'Activa' : 'Suspendida'}</span></td><td>{fecha(c.creado_en)}</td></tr>)}
        {!data?.length && <tr><td colSpan={4}>Aún no hay clínicas.</td></tr>}
      </tbody></table></div>
      <FormClinica />
    </>
  );
}
