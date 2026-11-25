import Link from 'next/link';
import { requireMiembro, fecha } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';

const ACC: Record<string, string> = { crear: 'Creó', modificar: 'Modificó', firmar: 'Firmó', corregir: 'Corrigió', consultar: 'Consultó', borrar: 'Intentó borrar' };
const TAB: Record<string, string> = { pacientes: 'expediente', notas: 'nota', addenda: 'addendum', historias: 'historia clínica', recetas: 'receta', estudios: 'estudio', citas: 'cita', inventario: 'inventario', miembros: 'usuario', clinicas: 'clínica' };

export default async function Bitacora() {
  const ctx = await requireMiembro();
  if (ctx.miembro.rol !== 'admin') return <div className="aviso">Solo el administrador ve la bitácora.</div>;
  const sb = await supabaseServer();
  const [{ data: b }, { data: ms }] = await Promise.all([
    sb.from('bitacora').select('id, creado_en, accion, tabla, user_id, paciente_id').eq('clinica_id', ctx.miembro.clinica_id).order('creado_en', { ascending: false }).limit(500),
    sb.from('miembros').select('user_id, titulo, nombre').eq('clinica_id', ctx.miembro.clinica_id),
  ]);
  const quien = (u: string | null) => { const m = ms?.find((x) => x.user_id === u); return m ? `${m.titulo ?? ''} ${m.nombre}`.trim() : '—'; };
  return (
    <>
      <div className="top"><div><h1>Bitácora de auditoría</h1><div className="sub">Todo lo que se hace queda aquí con fecha, hora y usuario. Nadie la puede modificar ni borrar.</div></div></div>
      <div className="tb-caja"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Expediente</th></tr></thead><tbody>
        {(b ?? []).map((x) => <tr key={x.id}><td>{fecha(x.creado_en)}</td><td>{quien(x.user_id)}</td><td><b>{ACC[x.accion] ?? x.accion}</b> {TAB[x.tabla] ?? x.tabla}</td><td>{x.paciente_id ? <Link href={`/app/pacientes/${x.paciente_id}`}>Abrir</Link> : '—'}</td></tr>)}
        {!b?.length && <tr><td colSpan={4}>Sin movimientos.</td></tr>}
      </tbody></table></div>
      <span className="ayuda">Se muestran los últimos 500 movimientos.</span>
    </>
  );
}
