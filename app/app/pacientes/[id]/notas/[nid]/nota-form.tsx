'use client';
import { useActionState, useState } from 'react';
import { guardarNota } from '../../actions';
import { CIE10 } from '@/lib/cie10';

type Nota = { id: string; motivo: string | null; signos: Record<string, string>; subjetivo: string | null; exploracion: string | null; diagnosticos: { c: string; d: string }[]; pronostico: string | null; plan: string | null; estado: string };
const VIT: [string, string][] = [['ta', 'T/A mmHg'], ['fc', 'FC lpm'], ['fr', 'FR rpm'], ['temp', 'Temp °C'], ['spo2', 'SpO₂ %'], ['peso', 'Peso kg'], ['talla', 'Talla m'], ['gluc', 'Glucosa mg/dL'], ['dolor', 'Dolor 0–10']];
const GUIA = 'Habitus exterior: \nCabeza y cuello: \nTórax: \nAbdomen: \nExtremidades: \nPiel y anexos: \nNeurológico: ';

export function NotaForm({ nota, pac, puedeFirmar, corrigiendo }: { nota: Nota; pac: string; puedeFirmar: boolean; corrigiendo: boolean }) {
  const [st, act, pending] = useActionState(guardarNota, undefined);
  const [peso, setPeso] = useState(nota.signos.peso ?? '');
  const [talla, setTalla] = useState(nota.signos.talla ?? '');
  const [expl, setExpl] = useState(nota.exploracion ?? '');
  const t = parseFloat(talla) > 3 ? parseFloat(talla) / 100 : parseFloat(talla);
  const imc = parseFloat(peso) && t ? (parseFloat(peso) / (t * t)).toFixed(1) : '';
  return (
    <form action={act} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <input type="hidden" name="id" value={nota.id} /><input type="hidden" name="pac" value={pac} />
      <datalist id="cie10">{CIE10.map((x) => <option key={x.c} value={`${x.c} — ${x.d}`} />)}</datalist>
      <div className="g2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="card"><h2>Signos vitales</h2>
            <div className="vit">
              {VIT.map(([k, l]) => (
                <label key={k}>{l}
                  {k === 'peso' ? <input name="v_peso" value={peso} onChange={(e) => setPeso(e.target.value)} inputMode="decimal" />
                    : k === 'talla' ? <input name="v_talla" value={talla} onChange={(e) => setTalla(e.target.value)} inputMode="decimal" />
                    : <input name={'v_' + k} defaultValue={nota.signos[k] ?? ''} inputMode="decimal" />}
                </label>
              ))}
              <label style={{ background: 'var(--verde-f)', color: 'var(--verde-t)' }}>IMC (auto)<input value={imc} readOnly tabIndex={-1} /></label>
            </div>
          </section>
          <section className="card"><h2>Motivo y padecimiento actual</h2>
            <label className="c">Motivo de consulta *<input className="i" name="motivo" defaultValue={nota.motivo ?? ''} required /></label>
            <label className="c">Subjetivo<textarea className="i" name="subjetivo" defaultValue={nota.subjetivo ?? ''} /></label>
          </section>
          <section className="card"><h2>Exploración física por regiones</h2>
            <textarea className="i" name="exploracion" value={expl} onChange={(e) => setExpl(e.target.value)} style={{ minHeight: 200 }} />
            <div><button type="button" className="btn sec ch" onClick={() => setExpl(expl.trim() ? expl.trimEnd() + '\n' + GUIA : GUIA)}>Poner guía por regiones</button></div>
          </section>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <section className="card"><h2>Diagnóstico · CIE-10 *</h2>
            {[0, 1, 2, 3].map((i) => {
              const d = nota.diagnosticos[i];
              return <input key={i} className="i" name={`dx${i}`} list="cie10" defaultValue={d ? `${d.c} — ${d.d}` : ''} placeholder={i === 0 ? 'Principal: código o nombre (E11, diabetes…)' : 'Otro diagnóstico (opcional)'} />;
            })}
            <span className="ayuda">Catálogo de muestra; la versión final usará el CIE-10 oficial completo.</span>
          </section>
          <section className="card"><h2>Pronóstico</h2><textarea className="i" name="pronostico" defaultValue={nota.pronostico ?? ''} placeholder="Bueno para la vida y la función…" /></section>
          <section className="card"><h2>Plan de tratamiento *</h2><textarea className="i" name="plan" defaultValue={nota.plan ?? ''} style={{ minHeight: 130 }} /></section>
        </div>
      </div>
      {st?.error && <div className="aviso er">{st.error}</div>}
      {st?.ok && <div className="aviso ok">{st.ok}</div>}
      <div className="barra">
        <span>{corrigiendo ? 'Al guardar la corrección, la versión anterior queda respaldada y en la bitácora.' : 'Al firmar se calcula el sello digital; tendrás 24 h para corregir.'}</span>
        {corrigiendo
          ? <button className="btn" name="accion" value="corregir" disabled={pending}>Guardar corrección</button>
          : <>
              <button className="btn sec" name="accion" value="borrador" disabled={pending}>Guardar borrador</button>
              {puedeFirmar && <button className="btn" name="accion" value="firmar" disabled={pending}>Firmar y sellar</button>}
            </>}
      </div>
    </form>
  );
}
