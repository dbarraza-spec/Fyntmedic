import { CIE10 } from './cie10';
export const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
export const opt = (f: FormData, k: string) => txt(f, k) || null;
// "E11.9 — Diabetes…" o "E11.9" → {c,d}
export function dxDe(f: FormData, prefijo: string, n: number) {
  const out: { c: string; d: string }[] = [];
  for (let i = 0; i < n; i++) {
    const v = txt(f, `${prefijo}${i}`);
    if (!v) continue;
    const code = v.split(/\s+[—-]\s+/)[0].trim().toUpperCase();
    const hit = CIE10.find((x) => x.c === code);
    out.push(hit ?? { c: code, d: v.includes('—') ? v.split('—').slice(1).join('—').trim() : '' });
  }
  return out;
}
