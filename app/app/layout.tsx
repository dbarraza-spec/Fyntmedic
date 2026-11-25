import Link from 'next/link';
import { getCtx, veClinico } from '@/lib/ctx';
import { salir } from '../login/actions';
import { LogoF } from '../logo';

const ROL: Record<string, string> = { admin: 'Administrador', medico: 'Médico', enfermeria: 'Enfermería', recepcion: 'Recepción' };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const rol = ctx.miembro?.rol;
  const color = ctx.clinica?.color ?? '#0077b6';
  return (
    <div className="app" style={{ ['--azul' as string]: color }}>
      <nav className="side" aria-label="Menú">
        <div className="brand"><LogoF color={color} /><div><b>{ctx.clinica?.nombre ?? 'FyntMedic'}</b><small>con FyntMedic</small></div></div>
        {ctx.miembro && <>
          <Link className="mi" href="/app">Inicio</Link>
          <Link className="mi" href="/app/pacientes">Pacientes</Link>
          <Link className="mi" href="/app/pacientes/nuevo">Alta de paciente</Link>
          {rol === 'admin' && <Link className="mi" href="/app/usuarios">Usuarios</Link>}
        </>}
        {ctx.superadmin && <Link className="mi" href="/app/admin">Súper admin</Link>}
        <div className="yo">
          <b style={{ color: 'var(--texto)' }}>{ctx.miembro ? `${ctx.miembro.titulo ?? ''} ${ctx.miembro.nombre}`.trim() : ctx.email}</b>
          <span>{rol ? ROL[rol] : ctx.superadmin ? 'Súper admin' : 'Sin clínica'}{veClinico(rol) ? '' : rol ? ' · sin acceso a notas' : ''}</span>
          <form action={salir}><button className="btn sec ch" style={{ width: '100%' }}>Cerrar sesión</button></form>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
