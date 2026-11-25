'use client';
import { useActionState } from 'react';
import { crearUsuario } from './actions';

export function FormUsuario() {
  const [st, act, pending] = useActionState(crearUsuario, undefined);
  return (
    <form action={act} className="card"><h2>Nuevo usuario</h2>
      <div className="g3">
        <label className="c">Rol *<select className="i" name="rol" required><option value="medico">Médico</option><option value="enfermeria">Enfermería</option><option value="recepcion">Recepción</option><option value="admin">Administrador</option></select></label>
        <label className="c">Título<select className="i" name="titulo"><option value="">—</option><option>Dr.</option><option>Dra.</option><option>Enf.</option><option>Lic.</option></select></label>
        <label className="c">Nombre completo *<input className="i" name="nombre" required /></label>
        <label className="c">Correo (usuario) *<input className="i" type="email" name="email" required /></label>
        <label className="c">Contraseña temporal *<input className="i" name="password" minLength={10} required /><span className="ayuda">Mínimo 10 caracteres. Pídele que la cambie.</span></label>
        <label className="c">Cédula profesional<input className="i" name="cedula" inputMode="numeric" /><span className="ayuda">Obligatoria para Médico.</span></label>
        <label className="c">Especialidad<input className="i" name="especialidad" /></label>
        <label className="c">Cédula de especialidad<input className="i" name="cedula_esp" /></label>
        <label className="c">Universidad<input className="i" name="universidad" /></label>
      </div>
      {st?.error && <div className="aviso er">{st.error}</div>}
      {st?.ok && <div className="aviso ok">{st.ok}</div>}
      <div><button className="btn" disabled={pending}>{pending ? 'Creando…' : 'Crear usuario'}</button></div>
    </form>
  );
}
