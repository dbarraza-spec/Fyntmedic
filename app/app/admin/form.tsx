'use client';
import { useActionState, useState } from 'react';
import { crearClinica } from './actions';

export function FormClinica() {
  const [st, act, pending] = useActionState(crearClinica, undefined);
  const [yo, setYo] = useState(false);
  return (
    <form action={act} className="card"><h2>Nueva clínica</h2>
      <div className="g3">
        <label className="c">Nombre de la clínica *<input className="i" name="clinica" required /></label>
        <label className="c">Plan<select className="i" name="plan"><option value="consultorio">Consultorio</option><option value="profesional">Profesional</option><option value="clinica">Clínica</option><option value="hospital">Hospital</option></select></label>
        <label className="c">Nombre del administrador *<input className="i" name="nombre" required /></label>
      </div>
      <label className="fila" style={{ fontSize: 14 }}><input type="checkbox" name="yo" checked={yo} onChange={(e) => setYo(e.target.checked)} /> Yo soy el administrador (para pruebas)</label>
      {!yo && <div className="g3">
        <label className="c">Correo del administrador *<input className="i" type="email" name="email" required /></label>
        <label className="c">Contraseña temporal *<input className="i" name="password" minLength={10} required /></label>
      </div>}
      {st?.error && <div className="aviso er">{st.error}</div>}
      {st?.ok && <div className="aviso ok">{st.ok}</div>}
      <div><button className="btn" disabled={pending}>{pending ? 'Creando…' : 'Crear clínica'}</button></div>
    </form>
  );
}
