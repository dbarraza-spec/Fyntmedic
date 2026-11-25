import { requireMiembro, veClinico } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { altaProducto, moverProducto } from './actions';

export default async function Inventario({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireMiembro();
  if (!veClinico(ctx.miembro.rol)) return <div className="aviso">Tu rol no tiene acceso al inventario.</div>;
  const sb = await supabaseServer();
  const { data } = await sb.from('inventario').select('*').eq('clinica_id', ctx.miembro.clinica_id).order('generico');
  const lim = Date.now() + 45 * 864e5;
  const pronto = (x: { caducidad: string }) => new Date(x.caducidad).getTime() < lim;
  const lista = data ?? [];
  return (
    <>
      <div className="top"><div><h1>Inventario</h1><div className="sub">Medicamentos e insumos con lote y caducidad.</div></div><span className="chip a">INCLUIDO DE REGALO CON TU SUSCRIPCIÓN</span></div>
      {sp.ok && <div className="aviso ok">{sp.ok}</div>}{sp.error && <div className="aviso er">{sp.error}</div>}
      <div className="g4">
        <div className="kpi"><b>{lista.length}</b><span>Productos</span></div>
        <div className="kpi"><b style={{ color: 'var(--ama)' }}>{lista.filter((x) => x.cantidad <= x.minimo).length}</b><span>Por agotarse</span></div>
        <div className="kpi"><b style={{ color: 'var(--rojo)' }}>{lista.filter(pronto).length}</b><span>Caducan en 45 días</span></div>
      </div>
      {lista.length ? <div className="tb-caja"><table><thead><tr><th>Producto</th><th>Lote</th><th>Caduca</th><th>Existencia</th><th>Estado</th><th>Mover</th></tr></thead><tbody>
        {lista.map((x) => {
          const [c, t] = pronto(x) ? ['r', 'Caduca pronto'] : x.cantidad <= x.minimo ? ['a', 'Bajo'] : ['v', 'Suficiente'];
          return (
            <tr key={x.id}>
              <td><b>{x.generico}</b>{x.controlado && <> <span className="chip r">Controlado</span></>}<div className="ayuda">{x.presentacion}</div></td>
              <td>{x.lote}</td><td className="n">{x.caducidad.slice(0, 7).split('-').reverse().join('/')}</td><td className="n"><b>{x.cantidad}</b> {x.unidad}</td>
              <td><span className={`chip ${c}`}>{t}</span></td>
              <td><div className="fila" style={{ flexWrap: 'nowrap', gap: 6 }}>
                {[-1, 1].map((d) => <form key={d} action={moverProducto}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="d" value={d} /><button className="btn sec ch" style={{ minWidth: 44, padding: 0 }} aria-label={`${d > 0 ? 'Entrada' : 'Salida'} de ${x.generico}`}>{d > 0 ? '+' : '−'}</button></form>)}
              </div></td>
            </tr>
          );
        })}
      </tbody></table></div> : <div className="vacio">Aún no hay productos.</div>}
      <form action={altaProducto} className="card"><h2>Alta de medicamento o insumo</h2>
        <div className="chips">{['Medicamento', 'Material de curación', 'Equipo'].map((o, i) => <label key={o} className="op"><input type="radio" name="tipo" value={o} defaultChecked={!i} /><span>{o}</span></label>)}</div>
        <div className="g3">
          <label className="c">Nombre genérico *<input className="i" name="gen" required placeholder="Amoxicilina" /></label>
          <label className="c">Nombre comercial<input className="i" name="com" /></label>
          <label className="c">Presentación *<input className="i" name="pres" required placeholder="Cápsulas 500 mg, caja con 12" /></label>
          <label className="c">Lote *<input className="i" name="lote" required /></label>
          <label className="c">Caducidad *<input className="i" type="month" name="cad" required /></label>
          <label className="c">Cantidad que entra *<input className="i" type="number" min={0} name="cant" required /></label>
          <label className="c">Unidad<input className="i" name="uni" defaultValue="cajas" /></label>
          <label className="c">Existencia mínima (aviso)<input className="i" type="number" min={0} name="min" defaultValue={5} /></label>
        </div>
        <label className="chk"><input type="checkbox" name="ctrl" />Es medicamento controlado (lleva libro de control)</label>
        <div><button className="btn">Dar de alta</button></div>
      </form>
      <div className="aviso">Al recetar, si marcas “se entrega en el consultorio”, la salida se descuenta sola.</div>
    </>
  );
}
