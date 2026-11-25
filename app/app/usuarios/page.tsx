import { getCtx } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { FormUsuario } from './form';
import { cambiarActivo } from './actions';

const ROL: Record<string, string> = { admin: 'Administrador', medico: 'Médico', enfermeria: 'Enfermería', recepcion: 'Recepción' };

export default async function Usuarios() {
  const ctx = await getCtx();
  if (ctx.miembro?.rol !== 'admin') return <div className="aviso">Solo el administrador de la clínica ve esta sección.</div>;
  const sb = await supabaseServer();
  const { data } = await sb.from('miembros').select('id, user_id, rol, titulo, nombre, cedula, especialidad, activo').eq('clinica_id', ctx.miembro.clinica_id).order('creado_en');
  return (
    <>
      <div className="top"><div><h1>Usuarios</h1><div className="sub">Quién entra a {ctx.clinica?.nombre} y qué puede ver.</div></div></div>
      <div className="tb-caja"><table><thead><tr><th>Nombre</th><th>Rol</th><th>Cédula</th><th>Estado</th><th></th></tr></thead><tbody>
        {(data ?? []).map((m) => (
          <tr key={m.id}>
            <td><b>{`${m.titulo ?? ''} ${m.nombre}`.trim()}</b>{m.especialidad ? <div className="ayuda">{m.especialidad}</div> : null}</td>
            <td>{ROL[m.rol]}</td><td>{m.cedula ?? '—'}</td>
            <td><span className={`chip ${m.activo ? 'v' : 'r'}`}>{m.activo ? 'Activo' : 'Sin acceso'}</span></td>
            <td>{m.user_id !== ctx.userId && (
              <form action={cambiarActivo}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="activo" value={String(!m.activo)} />
                <button className="btn sec ch">{m.activo ? 'Quitar acceso' : 'Dar acceso'}</button></form>)}</td>
          </tr>
        ))}
      </tbody></table></div>
      <FormUsuario />
      <div className="aviso">Los usuarios nunca se borran, solo se les quita el acceso, para que la bitácora conserve quién hizo cada cosa.</div>
    </>
  );
}
