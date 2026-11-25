import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCtx, veClinico, hoyYMD, rangoDia, horaLocal, TZ, cap } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { Icon } from '@/components/icon';
import { PacienteCard, PAC_COLS, type PacLite } from '@/components/paciente-card';
import { ListaCitas, type CitaLite } from '@/components/citas';

export default async function Inicio() {
  const ctx = await getCtx();
  if (!ctx.miembro) {
    if (ctx.superadmin) redirect('/app/admin');
    return <div className="card"><h1>Tu cuenta no tiene clínica</h1><p className="sub">Pide al administrador de tu clínica que te dé de alta.</p></div>;
  }
  const cid = ctx.miembro.clinica_id, clinico = veClinico(ctx.miembro.rol);
  const sb = await supabaseServer();
  const { desde, hasta } = rangoDia(hoyYMD());
  const [pac, notasHoy, borr, inv, citas, recientes] = await Promise.all([
    sb.from('pacientes').select('id', { count: 'exact', head: true }).eq('clinica_id', cid),
    clinico ? sb.from('notas').select('id', { count: 'exact', head: true }).eq('clinica_id', cid).gte('creado_en', desde).lte('creado_en', hasta) : null,
    clinico ? sb.from('notas').select('id', { count: 'exact', head: true }).eq('clinica_id', cid).eq('estado', 'borrador') : null,
    clinico ? sb.from('inventario').select('cantidad, minimo, caducidad').eq('clinica_id', cid) : null,
    sb.from('citas').select('id, inicio, duracion_min, motivo, estado, nombre_nuevo, paciente:pacientes(id, nombre, apellido_paterno, apellido_materno)').eq('clinica_id', cid).gte('inicio', desde).lte('inicio', hasta).order('inicio'),
    sb.from('pacientes').select(PAC_COLS).eq('clinica_id', cid).order('creado_en', { ascending: false }).limit(6),
  ]);
  const lim = Date.now() + 45 * 864e5;
  const alertas = (inv?.data ?? []).filter((x) => x.cantidad <= x.minimo || new Date(x.caducidad).getTime() < lim).length;
  const h = Number(new Date().toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }));
  const nombre = `${ctx.miembro.titulo ?? ''} ${ctx.miembro.nombre}`.trim();
  return (
    <>
      <div className="top">
        <div><div className="sub" style={{ margin: 0 }}>{cap(new Date().toLocaleDateString('es-MX', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }))}</div>
          <h1>{h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}, {nombre}</h1></div>
        <Link className="btn" href="/app/agenda">+ Nueva cita</Link>
      </div>
      <section className="hero">
        <div className="bola" style={{ right: 40, top: 20, width: 120, height: 120, background: 'var(--azul)', opacity: .55 }} />
        <div className="bola" style={{ right: 180, top: 16, width: 54, height: 54, background: '#7CC4F0', opacity: .5, animationDelay: '1s' }} />
        <h2 style={{ fontSize: 20, marginBottom: 14, position: 'relative' }}>¿A quién buscas hoy?</h2>
        <form action="/app/pacientes" className="ii" role="search"><Icon n="lupa" s={20} /><input name="q" placeholder="Nombre, apellido, teléfono, CURP o folio…" aria-label="Buscar expediente" autoComplete="off" /><button className="btn">Buscar</button></form>
      </section>
      <div className="g4">
        <div className="kpi"><b>{pac.count ?? 0}</b><span>Expedientes</span></div>
        <div className="kpi"><b>{citas.data?.length ?? 0}</b><span>Citas de hoy</span></div>
        {clinico && <div className="kpi"><b>{notasHoy?.count ?? 0}</b><span>Notas de hoy</span></div>}
        {clinico && <div className="kpi"><b style={{ color: 'var(--ama)' }}>{borr?.count ?? 0}</b><span>Notas por firmar</span></div>}
        {clinico && <div className="kpi"><b style={{ color: 'var(--rojo)' }}>{alertas}</b><span>Alertas de inventario</span></div>}
      </div>
      <section className="card"><div className="fila" style={{ justifyContent: 'space-between' }}><h2>Citas de hoy</h2><Link className="btn sec ch" href="/app/agenda">Abrir agenda</Link></div>
        <ListaCitas citas={(citas.data ?? []) as unknown as CitaLite[]} horaDe={(t) => horaLocal(t)} />
      </section>
      <section className="card"><div className="fila" style={{ justifyContent: 'space-between' }}><h2>Pacientes recientes</h2><Link className="btn sec ch" href="/app/pacientes">Ver todos</Link></div>
        <div className="g3">{(recientes.data as PacLite[] ?? []).map((p) => <PacienteCard key={p.id} p={p} />)}</div>
        {!recientes.data?.length && <div className="vacio">Todavía no hay pacientes. <Link href="/app/pacientes/nuevo">Dar de alta el primero</Link></div>}
      </section>
    </>
  );
}
