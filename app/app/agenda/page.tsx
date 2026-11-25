import Link from 'next/link';
import { requireMiembro, hoyYMD, horaLocal, nombreCompleto, OFFSET, TZ, cap } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { ECOL, nombreCita, ListaCitas, type CitaLite } from '@/components/citas';
import { guardarCita, estadoCita, iniciarConsulta } from './actions';

const H0 = 8, H1 = 21, SLOTS = (H1 - H0) * 2, DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const p2 = (n: number) => String(n).padStart(2, '0');
const sumar = (ymd: string, d: number) => { const x = new Date(ymd + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + d); return x.toISOString().slice(0, 10); };
const lunes = (ymd: string) => { const x = new Date(ymd + 'T12:00:00Z'); return sumar(ymd, -((x.getUTCDay() + 6) % 7)); };
const ymdLocal = (t: string) => new Date(t).toLocaleDateString('en-CA', { timeZone: TZ });
const minLocal = (t: string) => { const [h, m] = horaLocal(t).split(':').map(Number); return h * 60 + m; };
const largo = (ymd: string) => cap(new Date(ymd + 'T12:00:00Z').toLocaleDateString('es-MX', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }));

type Sp = { d?: string; nueva?: string; cita?: string; editar?: string; ok?: string; error?: string };
export default async function Agenda({ searchParams }: { searchParams: Promise<Sp> }) {
  const sp = await searchParams;
  const ctx = await requireMiembro();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(sp.d ?? '') ? sp.d! : hoyYMD();
  const ini = lunes(dia), dias = [...Array(7)].map((_, i) => sumar(ini, i)), hoy = hoyYMD();
  const sb = await supabaseServer();
  const [{ data: cs }, { data: pacs }] = await Promise.all([
    sb.from('citas').select('id, inicio, duracion_min, motivo, estado, nombre_nuevo, telefono_nuevo, paciente:pacientes(id, nombre, apellido_paterno, apellido_materno, telefono, alergias)').eq('clinica_id', ctx.miembro.clinica_id)
      .gte('inicio', new Date(`${ini}T00:00:00${OFFSET}`).toISOString()).lt('inicio', new Date(`${sumar(ini, 7)}T00:00:00${OFFSET}`).toISOString()).order('inicio'),
    sb.from('pacientes').select('id, nombre, apellido_paterno, apellido_materno, folio').eq('clinica_id', ctx.miembro.clinica_id).order('apellido_paterno').limit(1000),
  ]);
  const citas = (cs ?? []) as unknown as (CitaLite & { telefono_nuevo: string | null; paciente: (CitaLite['paciente'] & { telefono: string; alergias: string[] }) | null })[];

  // Carriles para citas encimadas.
  const lane: Record<string, { l: number; n: number }> = {};
  for (const d of dias) {
    const del = citas.filter((c) => ymdLocal(c.inicio) === d).sort((a, b) => minLocal(a.inicio) - minLocal(b.inicio));
    let grp: typeof del = [], ends: number[] = [], fin = -1;
    const cerrar = () => grp.forEach((c) => (lane[c.id].n = ends.length));
    for (const c of del) {
      const a = minLocal(c.inicio), z = a + c.duracion_min;
      if (a >= fin && grp.length) { cerrar(); grp = []; ends = []; }
      let l = ends.findIndex((e) => e <= a); if (l < 0) { l = ends.length; ends.push(z); } else ends[l] = z;
      lane[c.id] = { l, n: 1 }; grp.push(c); fin = Math.max(fin, z);
    }
    cerrar();
  }

  const sel = sp.cita ? citas.find((c) => c.id === sp.cita) ?? null : null;
  const edit = sp.editar ? citas.find((c) => c.id === sp.editar) ?? null : null;
  const nueva = sp.nueva && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sp.nueva) ? sp.nueva : null;
  const form = edit ? { id: edit.id, fecha: ymdLocal(edit.inicio), hora: horaLocal(edit.inicio), dur: edit.duracion_min, pac: edit.paciente?.id ?? '', nombre: edit.nombre_nuevo ?? '', tel: edit.telefono_nuevo ?? '', motivo: edit.motivo ?? '' }
    : nueva ? { id: '', fecha: nueva.slice(0, 10), hora: nueva.slice(11), dur: 30, pac: '', nombre: '', tel: '', motivo: '' } : null;
  const ahoraMin = minLocal(new Date().toISOString()), iHoy = dias.indexOf(hoy);
  const q = (o: Record<string, string>) => '/app/agenda?' + new URLSearchParams({ d: dia, ...o });

  return (
    <>
      <div className="top"><div><h1>Agenda</h1><div className="sub">Toca un espacio vacío para agendar, o una cita para verla.</div></div>
        <Link className="btn" href={q({ nueva: `${dia}T09:00` })}>+ Nueva cita</Link></div>
      {sp.ok && <div className="aviso ok">{sp.ok}</div>}
      {sp.error && <div className="aviso er">{sp.error}</div>}

      {form && (
        <form action={guardarCita} className="card" style={{ borderColor: 'var(--azul)' }}>
          <div className="fila" style={{ justifyContent: 'space-between' }}><h2>{form.id ? 'Cambiar cita' : 'Nueva cita'}</h2><Link className="btn sec ch" href={q({})}>Cerrar</Link></div>
          <input type="hidden" name="id" value={form.id} />
          <label className="c">Paciente<select className="i" name="paciente" defaultValue={form.pac}><option value="">— Paciente nuevo (sin expediente) —</option>
            {(pacs ?? []).map((p) => <option key={p.id} value={p.id}>{nombreCompleto(p)} · Exp. {String(p.folio).padStart(6, '0')}</option>)}</select></label>
          <div className="g3"><label className="c">Nombre (si es nuevo)<input className="i" name="nombre" defaultValue={form.nombre} /></label><label className="c">Teléfono<input className="i" name="tel" defaultValue={form.tel} inputMode="tel" /></label></div>
          <div className="g3"><label className="c">Fecha *<input className="i" type="date" name="fecha" defaultValue={form.fecha} required /></label>
            <label className="c">Hora *<input className="i" type="time" name="hora" defaultValue={form.hora} step={900} required /></label>
            <label className="c">Duración<select className="i" name="dur" defaultValue={String(form.dur)}>{[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}</select></label></div>
          <label className="c">Motivo<input className="i" name="motivo" defaultValue={form.motivo} placeholder="Control, primera vez, revisión de estudios…" /></label>
          <div><button className="btn">Guardar cita</button></div>
        </form>
      )}

      {sel && (() => {
        const k = ECOL[sel.estado] ?? ECOL.programada;
        return (
          <section className="card" style={{ borderColor: k[1] }}>
            <div className="fila" style={{ justifyContent: 'space-between' }}><h2>{nombreCita(sel)}</h2><Link className="btn sec ch" href={q({})}>Cerrar</Link></div>
            <div className="fila"><span className="chip" style={{ background: k[0], color: 'var(--texto-2)' }}>{k[2]}</span><span className="ayuda">{largo(ymdLocal(sel.inicio))} · {horaLocal(sel.inicio)} · {sel.duracion_min} min</span></div>
            <div className="aviso">{sel.motivo || 'Consulta'}{sel.paciente ? <><br />Tel. {sel.paciente.telefono}{sel.paciente.alergias?.length ? <> · <b>Alergias:</b> {sel.paciente.alergias.join(', ')}</> : null}</> : <><br />Paciente nuevo{sel.telefono_nuevo ? ` · Tel. ${sel.telefono_nuevo}` : ''}</>}</div>
            <div className="g3">
              <form action={iniciarConsulta}><input type="hidden" name="id" value={sel.id} /><button className="btn" style={{ width: '100%' }}>{sel.paciente ? 'Iniciar consulta' : 'Dar de alta y consultar'}</button></form>
              {(['confirmada', 'no_asistio', 'cancelada'] as const).map((e) => (
                <form key={e} action={estadoCita}><input type="hidden" name="id" value={sel.id} /><input type="hidden" name="estado" value={e} /><input type="hidden" name="d" value={dia} />
                  <button className="btn sec" style={{ width: '100%', color: e === 'cancelada' ? 'var(--rojo-t)' : undefined }}>{e === 'confirmada' ? 'Confirmar' : e === 'no_asistio' ? 'No asistió' : 'Cancelar cita'}</button></form>
              ))}
              <Link className="btn sec" href={q({ editar: sel.id })}>Cambiar fecha u hora</Link>
              {sel.paciente && <Link className="btn sec" href={`/app/pacientes/${sel.paciente.id}`}>Ver expediente</Link>}
            </div>
            <div className="ayuda">Mensaje para el paciente: “Le recordamos su cita en {ctx.clinica.nombre} el {largo(ymdLocal(sel.inicio))} a las {horaLocal(sel.inicio)}.”</div>
          </section>
        );
      })()}

      <section className="card">
        <div className="fila" style={{ justifyContent: 'space-between' }}>
          <div className="fila"><Link className="btn sec ch" href={`/app/agenda?d=${sumar(ini, -7)}`} aria-label="Semana anterior">←</Link><Link className="btn sec ch" href="/app/agenda">Hoy</Link><Link className="btn sec ch" href={`/app/agenda?d=${sumar(ini, 7)}`} aria-label="Semana siguiente">→</Link>
            <b style={{ fontSize: 16 }}>{largo(dias[0]).split(', ')[1]} al {largo(dias[6]).split(', ')[1]}</b></div>
          <span className="ayuda">{citas.filter((c) => c.estado !== 'cancelada').length} cita(s) esta semana · {H0}:00 a {H1}:00</span>
        </div>
        <div className="chips">{Object.values(ECOL).map(([bg, c, l]) => <span key={l} className="chip" style={{ background: bg, color: 'var(--texto-2)' }}><i style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}</span>)}</div>
        <div className="ag-caja"><div className="ag">
          <div className="hr" style={{ gridRow: 1 }} />
          {dias.map((d, i) => <Link key={d} className={`dh${d === hoy ? ' hoy' : ''}`} style={{ gridColumn: i + 2 }} href={`/app/agenda?d=${d}`}>{DIAS[i]}<b>{Number(d.slice(8))}</b></Link>)}
          {[...Array(SLOTS)].flatMap((_, k) => {
            const h = H0 + Math.floor(k / 2), mm = k % 2 ? '30' : '00';
            return [
              ...(k % 2 ? [] : [<div key={'h' + k} className="hr" style={{ gridRow: k + 2 }}>{h}:00</div>]),
              ...dias.map((d, i) => <Link key={d + k} className={`sl${k % 2 ? ' m' : ''}`} style={{ gridRow: k + 2, gridColumn: i + 2 }} href={q({ d, nueva: `${d}T${p2(h)}:${mm}` })} aria-label={`Agendar ${DIAS[i]} ${Number(d.slice(8))} a las ${h}:${mm}`} />),
            ];
          })}
          {citas.map((c) => {
            const i = dias.indexOf(ymdLocal(c.inicio)); if (i < 0) return null;
            const st = Math.round((minLocal(c.inicio) - H0 * 60) / 30); if (st < 0 || st >= SLOTS) return null;
            const sp2 = Math.max(1, Math.round(c.duracion_min / 30)), L = lane[c.id] ?? { l: 0, n: 1 }, k = ECOL[c.estado] ?? ECOL.programada;
            return (
              <Link key={c.id} className="ct" href={q({ cita: c.id })}
                style={{ gridRow: `${st + 2} / span ${Math.min(sp2, SLOTS - st)}`, gridColumn: i + 2, justifySelf: 'start', width: `calc(${100 / L.n}% - 6px)`, marginLeft: `calc(${(100 * L.l) / L.n}% + 3px)`, background: k[0], borderLeftColor: k[1], color: 'var(--texto)', textDecoration: c.estado === 'cancelada' ? 'line-through' : 'none', opacity: c.estado === 'cancelada' ? .7 : 1 }}>
                {horaLocal(c.inicio)} {nombreCita(c)}{sp2 > 1 && c.motivo ? <><br /><span style={{ fontWeight: 500, color: 'var(--texto-2)' }}>{c.motivo}</span></> : null}
              </Link>
            );
          })}
          {iHoy >= 0 && ahoraMin >= H0 * 60 && ahoraMin < H1 * 60 && <div className="ahora" style={{ gridRow: Math.floor((ahoraMin - H0 * 60) / 30) + 2, marginTop: ((ahoraMin - H0 * 60) / 30 % 1) * 30 }} />}
        </div></div>
      </section>
      <section className="card"><h2>{largo(dia)}</h2>
        <ListaCitas citas={citas.filter((c) => ymdLocal(c.inicio) === dia)} horaDe={horaLocal} />
      </section>
    </>
  );
}
