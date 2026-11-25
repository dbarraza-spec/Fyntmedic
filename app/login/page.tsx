'use client';
import { useActionState } from 'react';
import { entrar } from './actions';
import { LogoF } from '../logo';

export default function Login() {
  const [st, act, pending] = useActionState(entrar, undefined);
  return (
    <div className="login">
      <div className="bola" style={{ position: 'absolute', right: '8%', top: '12%', width: 220, height: 220, borderRadius: '50%', background: '#0077b6', opacity: .5, animation: 'flot 5s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', left: '10%', bottom: '14%', width: 90, height: 90, borderRadius: '50%', background: '#7CC4F0', opacity: .4, animation: 'flot 5s ease-in-out infinite', animationDelay: '1s' }} />
      <form action={act} className="md">
        <div className="fila"><LogoF size={30} /><b style={{ fontSize: 22 }}>Fynt<span style={{ color: '#0077b6' }}>Medic</span></b></div>
        <div><h1 style={{ fontSize: 26 }}>Bienvenido</h1><div className="sub">Entra a tu expediente clínico.</div></div>
        <label className="c">Correo<input className="i" name="email" type="email" autoComplete="username" required /></label>
        <label className="c">Contraseña<input className="i" name="password" type="password" autoComplete="current-password" required /></label>
        {st?.error && <div className="aviso er">{st.error}</div>}
        <button className="btn" disabled={pending}>{pending ? 'Entrando…' : 'Entrar'}</button>
        <span className="ayuda">Las cuentas las crea el administrador de tu clínica.</span>
      </form>
    </div>
  );
}
