'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { guardarFirmaPath } from './actions';

export function Firma({ clinica, user, actual }: { clinica: string; user: string; actual: string | null }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [dibujo, setDibujo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    const c = cv.current!; const r = c.getBoundingClientRect(); c.width = r.width * 2; c.height = r.height * 2;
    const x = c.getContext('2d')!; x.scale(2, 2); x.lineWidth = 2.4; x.lineCap = 'round'; x.strokeStyle = '#0f172a';
    if (actual) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => x.drawImage(im, 0, 0, r.width, r.height); im.src = actual; }
    let on = false; const pt = (e: PointerEvent) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] as const; };
    c.onpointerdown = (e) => { on = true; c.setPointerCapture(e.pointerId); const [a, b] = pt(e); x.beginPath(); x.moveTo(a, b); };
    c.onpointermove = (e) => { if (!on) return; const [a, b] = pt(e); x.lineTo(a, b); x.stroke(); setDibujo(true); };
    c.onpointerup = () => { on = false; };
  }, [actual]);
  async function guardar() {
    const c = cv.current!;
    const blob: Blob = await new Promise((ok) => c.toBlob((b) => ok(b!), 'image/png'));
    const path = `${clinica}/firmas/${user}.png`;
    const { error } = await supabaseBrowser().storage.from('marca').upload(path, blob, { contentType: 'image/png', upsert: true });
    if (error) return setMsg('No se pudo guardar: ' + error.message);
    const r = await guardarFirmaPath(path);
    setMsg(r?.error ?? 'Firma guardada. Ya sale en tus notas y recetas.'); router.refresh();
  }
  return (
    <section className="card"><h2>Firma autógrafa</h2>
      <div className="ayuda">Dibuja con el dedo o con el ratón. Sale en el PDF de cada nota y receta.</div>
      <canvas ref={cv} className="firma" aria-label="Área para firmar" />
      <div className="fila">
        <button type="button" className="btn sec ch" onClick={() => { const c = cv.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setDibujo(true); }}>Borrar</button>
        <button type="button" className="btn ch" disabled={!dibujo} onClick={guardar}>Guardar firma</button>
        {actual ? <span className="chip v">Firma guardada</span> : <span className="chip a">Sin firma</span>}
      </div>
      {msg && <div className="aviso">{msg}</div>}
    </section>
  );
}
