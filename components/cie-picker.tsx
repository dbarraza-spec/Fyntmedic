'use client';
import { useState } from 'react';
import { CIE10 } from '@/lib/cie10';
import { Icon } from './icon';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
type Dx = { c: string; d: string };

export function CiePicker({ name, inicial = [], max = 4, principal = false }: { name: string; inicial?: Dx[]; max?: number; principal?: boolean }) {
  const [sel, setSel] = useState<Dx[]>(inicial);
  const [q, setQ] = useState('');
  const qn = norm(q.trim()), qc = qn.replace('.', '');
  const res = qn ? CIE10.filter((x) => norm(x.c).replace('.', '').startsWith(qc) || norm(x.d).includes(qn)).slice(0, 8) : [];
  const add = (x: Dx) => { if (sel.length < max && !sel.some((y) => y.c === x.c)) setSel([...sel, x]); setQ(''); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sel.map((x, i) => <input key={x.c} type="hidden" name={`${name}${i}`} value={`${x.c} — ${x.d}`} />)}
      <div className="chips">
        {sel.length ? sel.map((x, i) => (
          <span key={x.c} className={`chip${i && principal ? ' g' : ''}`}><b>{x.c}</b> {x.d.length > 46 ? x.d.slice(0, 44) + '…' : x.d}{principal && !i ? ' · Principal' : ''}
            <button type="button" aria-label={`Quitar ${x.c}`} onClick={() => setSel(sel.filter((y) => y.c !== x.c))}>✕</button></span>
        )) : <span className="ayuda">Aún no agregas ninguno.</span>}
      </div>
      {sel.length < max && <>
        <label className="ii"><Icon n="lupa" /><span style={{ position: 'absolute', left: -9999 }}>Buscar en CIE-10</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código o nombre: E11, diabetes, faringitis…" autoComplete="off"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (res[0]) add(res[0]); } }} /></label>
        <div className="pk-res">{res.map((x) => <button type="button" key={x.c} onClick={() => add(x)}><b>{x.c}</b><span>{x.d}</span></button>)}</div>
      </>}
      <span className="ayuda">Catálogo de muestra con {CIE10.length} códigos frecuentes.</span>
    </div>
  );
}
