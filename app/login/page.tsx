'use client';
import { useActionState } from 'react';
import { entrar } from './actions';
import { LogoF } from '../logo';

export default function Login() {
  const [st, act, pending] = useActionState(entrar, undefined);
  return (
    <div className="login">
      <form action={act} className="card">
        <div className="fila"><LogoF /><b style={{ fontSize: 20 }}>Fynt<span style={{ color: 'var(--azul)' }}>Medic</span></b></div>
        <h1 style={{ fontSize: 24 }}>Iniciar sesión</h1>
        <label className="c">Correo<input className="i" name="email" type="email" autoComplete="username" required /></label>
        <label className="c">Contraseña<input className="i" name="password" type="password" autoComplete="current-password" required /></label>
        {st?.error && <div className="aviso er">{st.error}</div>}
        <button className="btn" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
        <span className="ayuda">Las cuentas las crea el administrador de tu clínica.</span>
      </form>
    </div>
  );
}
