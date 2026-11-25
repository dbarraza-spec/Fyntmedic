'use client';
import { useActionState, useRef } from 'react';
import { guardarHistoria } from './actions';

const HF = ['Diabetes', 'Hipertensión', 'Cardiopatías', 'Cáncer', 'Enf. tiroidea', 'Enf. renal', 'Enf. mental'], PAR = ['Padre', 'Madre', 'Hermanos', 'Abuelos', 'Hijos'];
const SIS = ['Cardiovascular', 'Respiratorio', 'Digestivo', 'Genitourinario', 'Endocrino', 'Nervioso', 'Musculoesquelético', 'Piel y anexos', 'Psicológico'];
const NP: [string, string, string[]][] = [['tab', 'Tabaquismo', ['Negado', 'Activo', 'Exfumador']], ['alc', 'Alcoholismo', ['Negado', 'Social', 'Frecuente']], ['sus', 'Otras sustancias', ['Negado', 'Sí']], ['act', 'Actividad física', ['Sedentaria', '1–2 veces/sem', '3+ veces/sem']], ['ali', 'Alimentación', ['Buena', 'Regular', 'Mala']], ['vac', 'Vacunas', ['Completas', 'Incompletas', 'Se desconoce']]];
const GO: [string, string][] = [['menarca', 'Menarca (edad)'], ['ritmo', 'Ritmo'], ['fum', 'FUM'], ['ivsa', 'IVSA (edad)'], ['g', 'Gestas'], ['pa', 'Partos'], ['ce', 'Cesáreas'], ['ab', 'Abortos'], ['mpf', 'Método anticonceptivo'], ['pap', 'Último Papanicolaou']];

export function HistoriaForm({ pac, datos, firmada, fem, previos, puedeFirmar }: { pac: string; datos: Record<string, string | boolean>; firmada: boolean; fem: boolean; previos: string; puedeFirmar: boolean }) {
  const [st, act, pending] = useActionState(guardarHistoria, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const d = (k: string) => (typeof datos[k] === 'string' ? (datos[k] as string) : '');
  const campos = ['hf_otros', 'pp', 'motivo', 'evol', 'est', 'viv', ...SIS.map((s) => 'ays_' + s), ...(fem ? GO.map((g) => 'go_' + g[0]) : [])];
  const pct = Math.round((campos.filter((k) => d(k).trim()).length / campos.length) * 100);
  const T = ({ n, l, ph }: { n: string; l: string; ph?: string }) => <label className="c">{l}<textarea className="i" name={n} defaultValue={d(n)} placeholder={ph} disabled={firmada} /></label>;
  return (
    <form ref={ref} action={act} className="col">
      <input type="hidden" name="_pac" value={pac} />
      <div className="fila"><div className="prog"><i style={{ width: `${pct}%` }} /></div><b style={{ fontSize: 13 }}>{pct}% completa</b></div>
      <fieldset disabled={firmada} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="g2"><div className="col">
        <section className="card"><h2>1 · Antecedentes heredofamiliares</h2>
          <div className="tb-caja"><table className="hf"><thead><tr><th>Enfermedad</th>{PAR.map((x) => <th key={x}>{x}</th>)}</tr></thead><tbody>
            {HF.map((e) => <tr key={e}><td><b>{e}</b></td>{PAR.map((x) => <td key={x}><input type="checkbox" name={`hf_${e}_${x}`} defaultChecked={!!datos[`hf_${e}_${x}`]} aria-label={`${e}, ${x}`} /></td>)}</tr>)}
          </tbody></table></div>
          <T n="hf_otros" l="Otros / comentarios" ph="Abuelo materno con infarto a los 60 años" />
        </section>
        <section className="card"><h2>2 · Personales no patológicos</h2>
          <div className="g3">{NP.map(([k, l, o]) => <label key={k} className="c">{l}<select className="i" name={'np_' + k} defaultValue={d('np_' + k) || o[0]}>{o.map((x) => <option key={x}>{x}</option>)}</select></label>)}</div>
          <T n="viv" l="Vivienda, servicios y convivencia" ph="Casa propia, todos los servicios, 1 mascota" />
        </section>
        <section className="card"><h2>3 · Personales patológicos</h2>
          <div className="aviso">Del alta del paciente: {previos || 'sin registro'}.</div>
          <T n="pp" l="Crónico-degenerativos, traumáticos, transfusionales, hospitalizaciones, infecciosos" />
        </section>
        {fem && <section className="card"><h2>4 · Gineco-obstétricos</h2>
          <div className="g4">{GO.map(([k, l]) => <label key={k} className="c">{l}<input className="i" name={'go_' + k} defaultValue={d('go_' + k)} /></label>)}</div>
        </section>}
      </div><div className="col">
        <section className="card"><h2>5 · Padecimiento actual</h2>
          <label className="c">Motivo de consulta<input className="i" name="motivo" defaultValue={d('motivo')} /></label>
          <T n="evol" l="Inicio, evolución y estado actual" />
        </section>
        <section className="card"><h2>6 · Interrogatorio por aparatos y sistemas</h2>
          {SIS.map((s) => <label key={s} className="c" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,150px) 1fr', alignItems: 'center', gap: 10 }}>{s}<input className="i" name={'ays_' + s} defaultValue={d('ays_' + s)} /></label>)}
          {!firmada && <div><button type="button" className="btn sec ch" onClick={() => ref.current?.querySelectorAll<HTMLInputElement>('[name^="ays_"]').forEach((i) => { if (!i.value.trim()) i.value = 'Negado'; })}>Marcar vacíos como “Negado”</button></div>}
        </section>
        <section className="card"><h2>7 · Estudios previos</h2><T n="est" l="Resultados de laboratorio y gabinete previos" ph="HbA1c 7.8 % (sep 2026)" />
          <div className="aviso">La exploración física, el diagnóstico y el plan se capturan en la nota médica.</div></section>
      </div></div>
      </fieldset>
      {st?.error && <div className="aviso er">{st.error}</div>}
      {st?.ok && <div className="aviso ok">{st.ok}</div>}
      {!firmada && <div className="barra"><span>Se guarda como borrador hasta que la firmes. Firmada ya no se puede cambiar.</span>
        <button className="btn osc" name="accion" value="guardar" disabled={pending}>Guardar</button>
        {puedeFirmar && <button className="btn" name="accion" value="firmar" disabled={pending}>Firmar historia clínica</button>}</div>}
    </form>
  );
}
