'use client';
import { useActionState, useState } from 'react';
import { guardarNota } from '../../actions';
import { CiePicker } from '@/components/cie-picker';

type Nota = { id: string; motivo: string | null; signos: Record<string, string>; subjetivo: string | null; exploracion: string | null; diagnosticos: { c: string; d: string }[]; pronostico: string | null; plan: string | null; estado: string };
export const VIT: [string, string, string, string, string][] = [['ta', 'T/A mmHg', '#FEF2F2', '#b91c1c', '120/80'], ['fc', 'FC lpm', '#FFF7ED', '#c2410c', '70'], ['fr', 'FR rpm', '#ECFEFF', '#0e7490', '16'], ['temp', 'Temp °C', '#FEFCE8', '#a16207', '36.5'], ['spo2', 'SpO₂ %', '#EFF6FF', '#1d4ed8', '98'], ['peso', 'Peso kg', '#F5F3FF', '#6d28d9', '70'], ['talla', 'Talla m', '#F5F3FF', '#6d28d9', '1.70'], ['gluc', 'Glucosa mg/dL', '#FDF2F8', '#be185d', '—'], ['dolor', 'Dolor 0–10', '#F8FAFC', '#475569', '0']];
const GUIA = 'Habitus exterior: \nCabeza y cuello: \nTórax: \nAbdomen: \nExtremidades: \nPiel y anexos: \nNeurológico: ';
const PRON = ['Bueno para la vida y la función', 'Reservado a evolución', 'Malo para la vida'];

export function NotaForm({ nota, pac, puedeFirmar, corrigiendo, medico }: { nota: Nota; pac: string; puedeFirmar: boolean; corrigiendo: boolean; medico: string }) {
  const [st, act, pending] = useActionState(guardarNota, undefined);
  const [peso, setPeso] = useState(nota.signos.peso ?? '');
  const [talla, setTalla] = useState(nota.signos.talla ?? '');
  const [expl, setExpl] = useState(nota.exploracion ?? '');
  const [pron, setPron] = useState(nota.pronostico ?? '');
  const t = parseFloat(talla) > 3 ? parseFloat(talla) / 100 : parseFloat(talla);
  const imc = parseFloat(peso) && t ? (parseFloat(peso) / (t * t)).toFixed(1) : '';
  return (
    <form action={act} className="col">
      <input type="hidden" name="id" value={nota.id} /><input type="hidden" name="pac" value={pac} />
      {corrigiendo && <div className="aviso al">Esta nota ya está firmada. Puedes corregirla dentro de las 24 h: la versión anterior se guarda y el cambio queda en la bitácora. Después solo se agregan addendums.</div>}
      <div className="g2"><div className="col">
        <section className="card"><h2>Signos vitales</h2>
          <div className="vit">
            {VIT.map(([k, l, bg, c, ph]) => (
              <label key={k} style={{ background: bg, color: c }}>{l}
                {k === 'peso' ? <input name="v_peso" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder={ph} inputMode="decimal" />
                  : k === 'talla' ? <input name="v_talla" value={talla} onChange={(e) => setTalla(e.target.value)} placeholder={ph} inputMode="decimal" />
                  : <input name={'v_' + k} defaultValue={nota.signos[k] ?? ''} placeholder={ph} inputMode="decimal" />}
              </label>
            ))}
            <label style={{ background: 'var(--verde-f)', color: 'var(--verde-t)' }}>IMC (auto)<input value={imc} readOnly tabIndex={-1} /></label>
          </div>
        </section>
        <section className="card"><h2>Motivo y padecimiento actual</h2>
          <label className="c">Motivo de consulta *<input className="i" name="motivo" defaultValue={nota.motivo ?? ''} required placeholder="Control de diabetes" /></label>
          <label className="c">Subjetivo<textarea className="i" name="subjetivo" defaultValue={nota.subjetivo ?? ''} placeholder="Qué refiere el paciente…" /></label>
        </section>
        <section className="card"><h2>Exploración física por regiones</h2>
          <textarea className="i" name="exploracion" value={expl} onChange={(e) => setExpl(e.target.value)} style={{ minHeight: 220 }} placeholder={'Habitus exterior: …\nCabeza y cuello: …\nTórax: …'} />
          <div className="fila"><button type="button" className="btn sec ch" onClick={() => setExpl(expl.trim() ? expl.trimEnd() + '\n' + GUIA : GUIA)}>Poner guía por regiones</button><span className="ayuda">Todo en un solo bloque; así sale en la nota y en el PDF.</span></div>
        </section>
      </div><div className="col">
        <section className="card"><h2>Diagnóstico · CIE-10 *</h2><CiePicker name="dx" inicial={nota.diagnosticos} max={4} principal /></section>
        <section className="card"><h2>Pronóstico</h2>
          <textarea className="i" name="pronostico" value={pron} onChange={(e) => setPron(e.target.value)} placeholder="Bueno para la vida y la función…" />
          <div className="chips">{PRON.map((o) => <button type="button" key={o} className="tab" style={{ minHeight: 36, padding: '6px 14px', fontSize: 13 }} onClick={() => setPron(o)}>{o}</button>)}</div>
        </section>
        <section className="card"><h2>Plan de tratamiento *</h2><textarea className="i" name="plan" defaultValue={nota.plan ?? ''} style={{ minHeight: 140 }} placeholder={'1. Medicamento, dosis, vía y frecuencia\n2. Indicaciones\n3. Estudios a solicitar\n4. Próxima cita'} /></section>
        <section className="card dark"><h2>Firma electrónica</h2><div className="sub">{medico}</div><div className="nota" style={{ fontSize: 13, lineHeight: 1.5 }}>Al firmar, la base de datos calcula un sello digital (SHA-256) del contenido. Si alguien cambiara un dato, el sello ya no coincidiría.</div></section>
      </div></div>
      {st?.error && <div className="aviso er">{st.error}</div>}
      {st?.ok && <div className="aviso ok">{st.ok}</div>}
      <div className="barra">
        <span>{corrigiendo ? 'Guarda la corrección: la versión anterior queda respaldada.' : 'Puedes guardar como borrador y firmar después.'}</span>
        {corrigiendo
          ? <button className="btn" name="accion" value="corregir" disabled={pending}>Guardar corrección</button>
          : <><button className="btn osc" name="accion" value="borrador" disabled={pending}>Guardar borrador</button>
              {puedeFirmar && <button className="btn" name="accion" value="firmar" disabled={pending}>Firmar y sellar</button>}</>}
      </div>
    </form>
  );
}
