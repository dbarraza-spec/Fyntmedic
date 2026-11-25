'use client';
import { useState } from 'react';
import type { Marca, Paciente, NotaPDF, RecetaPDF } from '@/lib/pdf';

type Props = { marca: Marca; paciente: Paciente; firmaUrl: string | null; etiqueta?: string; clase?: string } & ({ nota: NotaPDF } | { receta: RecetaPDF });
export function PdfBoton(props: Props) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try {
      const m = await import('@/lib/pdf');
      const firma = await m.firmaDataURL(props.firmaUrl);
      if ('nota' in props) await m.pdfNota(props.marca, props.paciente, props.nota, firma);
      else await m.pdfReceta(props.marca, props.paciente, props.receta, firma);
    } catch (e) { alert('No se pudo generar el PDF: ' + (e as Error).message); }
    setBusy(false);
  }
  return <button type="button" className={props.clase ?? 'btn'} onClick={go} disabled={busy}>{busy ? 'Generando…' : props.etiqueta ?? 'Descargar PDF'}</button>;
}
