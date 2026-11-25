'use client';
import { useState, useTransition } from 'react';
import { crearReceta, type Med } from '@/app/app/recetas/actions';

const VIAS = ['Oral', 'Sublingual', 'Bucal', 'Tópica', 'Oftálmica', 'Ótica', 'Nasal', 'Inhalada', 'Intramuscular', 'Intravenosa', 'Subcutánea', 'Rectal', 'Vaginal'];
const vacia = (): Med => ({ med: '', dosis: '', via: 'Oral', frec: '', dur: '', cant: '', ind: '', entrega: false });
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function RecetaForm({ paciente, nota, alergias, peso, talla, inventario, dx }: { paciente: string; nota: string | null; alergias: string[]; peso: string; talla: string; inventario: string[]; dx: string | null }) {
  const [meds, setMeds] = useState<Med[]>([vacia()]);
  const [err, setErr] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string[] | null>(null);
  const [pending, start] = useTransition();
  const set = (i: number, k: keyof Med, v: string | boolean) => setMeds(meds.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  function enviar(f: FormData, forzar = false) {
    setErr(null);
    const choca = alergias.filter((a) => meds.some((m) => norm(m.med).includes(norm(a).replace(/s$/, ''))));
    if (choca.length && !forzar) { setAviso(choca); return; }
    setAviso(null);
    start(async () => {
      const r = await crearReceta({ paciente, nota, meds, ind: String(f.get('ind') ?? ''), peso: String(f.get('peso') ?? ''), talla: String(f.get('talla') ?? '') });
      if (r?.error) setErr(r.error);
    });
  }
  return (
    <form action={(f) => enviar(f)} className="col">
      <datalist id="invlist">{inventario.map((x) => <option key={x} value={x} />)}</datalist>
      <div className="g2"><div className="col">
        {meds.map((m, i) => (
          <section key={i} className="card" style={{ background: '#F8FBFF', gap: 10 }}>
            <div className="fila" style={{ justifyContent: 'space-between' }}><b>Medicamento {i + 1}</b>{meds.length > 1 && <button type="button" className="btn sec ch" onClick={() => setMeds(meds.filter((_, j) => j !== i))}>Quitar</button>}</div>
            <label className="c">Nombre genérico, forma y concentración *<input className="i" list="invlist" value={m.med} onChange={(e) => set(i, 'med', e.target.value)} placeholder="Amoxicilina cápsulas 500 mg" required /></label>
            <div className="g3">
              <label className="c">Dosis<input className="i" value={m.dosis} onChange={(e) => set(i, 'dosis', e.target.value)} placeholder="1 cápsula" /></label>
              <label className="c">Vía<select className="i" value={m.via} onChange={(e) => set(i, 'via', e.target.value)}>{VIAS.map((v) => <option key={v}>{v}</option>)}</select></label>
              <label className="c">Cada cuánto<input className="i" value={m.frec} onChange={(e) => set(i, 'frec', e.target.value)} placeholder="cada 8 horas" /></label>
              <label className="c">Por cuánto tiempo<input className="i" value={m.dur} onChange={(e) => set(i, 'dur', e.target.value)} placeholder="7 días" /></label>
              <label className="c">Cantidad a surtir<input className="i" value={m.cant} onChange={(e) => set(i, 'cant', e.target.value)} placeholder="1 caja con 21" /></label>
            </div>
            <label className="c">Indicaciones<input className="i" value={m.ind} onChange={(e) => set(i, 'ind', e.target.value)} placeholder="Tomar después de los alimentos" /></label>
            <label className="chk"><input type="checkbox" checked={m.entrega} onChange={(e) => set(i, 'entrega', e.target.checked)} />Se entrega en el consultorio (descuenta 1 del inventario)</label>
          </section>
        ))}
        <div><button type="button" className="btn sec" onClick={() => setMeds([...meds, vacia()])}>+ Agregar otro medicamento</button></div>
      </div><div className="col">
        <section className="card"><h2>Datos del paciente en la receta</h2>
          <div className="g3"><label className="c">Peso kg<input className="i" name="peso" defaultValue={peso} /></label><label className="c">Talla m<input className="i" name="talla" defaultValue={talla} /></label></div>
          {dx && <div className="aviso">Diagnóstico: {dx}</div>}
        </section>
        <section className="card"><h2>Indicaciones generales</h2><textarea className="i" name="ind" placeholder="Dieta, reposo, signos de alarma, próxima cita…" /></section>
        <section className="card dark"><h2>Firma</h2><div className="nota" style={{ fontSize: 13 }}>La receta se guarda sellada y no se puede modificar. Si hay un error, se hace una nueva.</div></section>
      </div></div>
      {aviso && (
        <div className="aviso er" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span>El paciente es alérgico a <b>{aviso.join(', ')}</b> y la receta lo menciona. ¿Seguro que quieres guardarla así?</span>
          <div className="fila"><button type="button" className="btn sec ch" onClick={() => setAviso(null)}>Revisar</button>
            <button type="button" className="btn peligro ch" onClick={(e) => enviar(new FormData(e.currentTarget.form!), true)}>Guardar de todos modos</button></div>
        </div>
      )}
      {err && <div className="aviso er">{err}</div>}
      <div className="barra"><span>Al guardar queda en el expediente y en Recetas, lista para descargar e imprimir.</span><button className="btn" disabled={pending}>{pending ? 'Guardando…' : 'Guardar y firmar receta'}</button></div>
    </form>
  );
}
