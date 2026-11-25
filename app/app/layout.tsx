import { getCtx, veClinico, urlFirmada } from '@/lib/ctx';
import { salir } from '../login/actions';
import { LogoF } from '../logo';
import { Nav, type Item } from '@/components/nav';

const ROL: Record<string, string> = { admin: 'Administrador', medico: 'Médico', enfermeria: 'Enfermería', recepcion: 'Recepción' };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx();
  const rol = ctx.miembro?.rol;
  const color = ctx.clinica?.color ?? '#0077b6';
  const logo = await urlFirmada('marca', ctx.clinica?.logo_path ?? null);
  const items: Item[] = [];
  if (ctx.miembro) {
    items.push({ href: '/app', label: 'Inicio', icon: 'home' }, { href: '/app/agenda', label: 'Agenda', icon: 'cal' },
      { href: '/app/pacientes', label: 'Expedientes', icon: 'doc' }, { href: '/app/pacientes/nuevo', label: 'Alta de paciente', icon: 'user' });
    if (veClinico(rol)) items.push({ href: '/app/recetas', label: 'Recetas', icon: 'rx' }, { href: '/app/inventario', label: 'Inventario', icon: 'box', tag: 'REGALO' });
    if (rol === 'medico') items.push({ href: '/app/perfil', label: 'Mi firma', icon: 'pen' });
    if (rol === 'admin') items.push({ href: '/app/marca', label: 'Mi marca', icon: 'pal' }, { href: '/app/usuarios', label: 'Usuarios', icon: 'team' }, { href: '/app/bitacora', label: 'Bitácora', icon: 'log' });
  }
  if (ctx.superadmin) items.push({ href: '/app/admin', label: 'Súper admin', icon: 'star' });
  return (
    <div className="app" style={{ ['--marca' as string]: color }}>
      <nav className="side" aria-label="Menú">
        <div className="brand">{logo ? <img src={logo} alt="" /> : <LogoF color={color} />}<div><b>{ctx.clinica?.nombre ?? 'FyntMedic'}</b><small>con FyntMedic</small></div></div>
        <Nav items={items} />
        <div className="demo" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span><b style={{ color: 'var(--texto)' }}>{ctx.miembro ? `${ctx.miembro.titulo ?? ''} ${ctx.miembro.nombre}`.trim() : ctx.email}</b><br />{rol ? ROL[rol] : ctx.superadmin ? 'Súper admin' : 'Sin clínica'}</span>
          <form action={salir}><button className="btn sec ch" style={{ width: '100%' }}>Cerrar sesión</button></form>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
