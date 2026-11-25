'use client';
import { jsPDF } from 'jspdf';

export type Marca = { nombre: string; color: string; domicilio: string | null; telefono: string | null; licencia: string | null; logoUrl: string | null };
export type Paciente = { nombre: string; folio: number; edad: number; sexo: string; sangre: string | null; alergias: string[]; niega: boolean };
export type NotaPDF = { id: string; creado: string; motivo: string | null; signos: Record<string, string>; subjetivo: string | null; exploracion: string | null; dx: { c: string; d: string }[]; pronostico: string | null; plan: string | null; firmada: string | null; medico: string | null; cedula: string | null; sello: string | null; addenda: { t: string; autor: string; texto: string }[] };
export type RecetaPDF = { id: string; creado: string; meds: { med: string; dosis?: string; via?: string; frec?: string; dur?: string; cant?: string; ind?: string }[]; ind: string | null; peso: string | null; talla: string | null; medico: string; cedula: string; especialidad: string | null; universidad: string | null; sello: string };

const TZ = 'America/Mazatlan';
const fh = (t: string) => new Date(t).toLocaleString('es-MX', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const rgb = (h: string): [number, number, number] => { const x = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)) as [number, number, number]; };
const VIT: [string, string][] = [['ta', 'T/A mmHg'], ['fc', 'FC lpm'], ['fr', 'FR rpm'], ['temp', 'Temp °C'], ['spo2', 'SpO2 %'], ['peso', 'Peso kg'], ['talla', 'Talla m'], ['gluc', 'Glucosa mg/dL'], ['dolor', 'Dolor 0-10']];

async function aDataURL(url: string | null) {
  if (!url) return null;
  try { const b = await (await fetch(url)).blob(); return await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(b); }); } catch { return null; }
}
function logoF(color: string) {
  const c = document.createElement('canvas'); c.width = 168; c.height = 204; const x = c.getContext('2d')!; x.scale(6, 6); x.fillStyle = color;
  ['M8 2 L26 0 Q22 9 12 10 L9 10 Z', 'M6 13 L23 11 Q19 20 10 21 L7 21 Z', 'M4 24 L13 23 Q10 31 2 34 Z'].forEach((d) => x.fill(new Path2D(d)));
  return c.toDataURL('image/png');
}
const fmt = (d: string) => (d.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG');

async function base(m: Marca, titulo: string, folio: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' }); const W = 612, M = 48; let y = M; const col = rgb(m.color);
  const logo = await aDataURL(m.logoUrl); let lx = M;
  if (logo) { try { doc.addImage(logo, fmt(logo), M, y - 6, 44, 44); lx = M + 54; } catch { /* sin logo */ } }
  else { doc.addImage(logoF(m.color), 'PNG', M, y - 6, 34, 41); lx = M + 46; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(15, 23, 42); doc.text(m.nombre, lx, y + 10);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
  doc.text([m.domicilio, [m.telefono && 'Tel. ' + m.telefono, m.licencia].filter(Boolean).join(' · ')].filter(Boolean).join('\n') || 'Expediente clínico electrónico', lx, y + 23);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...col); doc.text(titulo, W - M, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text(folio, W - M, y + 24, { align: 'right' });
  y += 46; doc.setDrawColor(...col); doc.setLineWidth(3); doc.line(M, y, W - M, y); y += 14;
  return { doc, W, M, y, col };
}
function pie(doc: jsPDF, txt: string) {
  const n = doc.getNumberOfPages(), f = logoF('#0077b6');
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setDrawColor(226, 232, 240); doc.setLineWidth(.8); doc.line(48, 744, 564, 744);
    doc.addImage(f, 'PNG', 48, 751, 11, 13.4); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(15, 23, 42); doc.text('Fynt', 63, 761);
    doc.setTextColor(0, 119, 182); doc.text('Medic', 63 + doc.getTextWidth('Fynt'), 761);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139); doc.text(doc.splitTextToSize(txt, 360), 120, 754); doc.text(`Página ${i} de ${n}`, 564, 761, { align: 'right' });
  }
}
function ficha(doc: jsPDF, M: number, W: number, y: number, filas: [string, string][]) {
  doc.setFillColor(244, 248, 252); const alto = Math.ceil(filas.length / 2) * 17 + 12; doc.roundedRect(M, y, W - 2 * M, alto, 8, 8, 'F'); doc.setFontSize(9.5); doc.setTextColor(15, 23, 42);
  filas.forEach(([k, v], i) => { const cx = M + 12 + (i % 2) * ((W - 2 * M) / 2), cy = y + 17 + Math.floor(i / 2) * 17; doc.setFont('helvetica', 'bold'); doc.text(k + ':', cx, cy); const w = doc.getTextWidth(k + ':  '); doc.setFont('helvetica', 'normal'); doc.text(String(v), cx + w, cy); });
  return y + alto + 16;
}
function bajar(doc: jsPDF, nombre: string) { doc.save(nombre); }

export async function pdfNota(m: Marca, p: Paciente, n: NotaPDF, firma: string | null) {
  const B = await base(m, 'NOTA DE EVOLUCIÓN', `Folio ${String(p.folio).padStart(6, '0')}-${n.id.slice(0, 4).toUpperCase()}`); const { doc, W, M, col } = B; let y = B.y;
  const nl = (h: number) => { if (y + h > 730) { doc.addPage(); y = M; } };
  y = ficha(doc, M, W, y, [['Paciente', p.nombre], ['Expediente', String(p.folio).padStart(6, '0')], ['Edad / sexo', `${p.edad} años · ${p.sexo}`], ['Fecha y hora', fh(n.creado)], ['Tipo de sangre', p.sangre ?? '—'], ['Alergias', p.alergias.join(', ') || (p.niega ? 'Niega' : 'No registradas')]]);
  const sec = (t: string, txt: string | null | undefined) => {
    if (!txt) return; doc.setFontSize(10); const l = doc.splitTextToSize(txt, W - 2 * M); nl(26 + l.length * 13);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...col); doc.text(t, M, y); y += 13;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42); l.forEach((x: string) => { nl(13); doc.text(x, M, y); y += 13; }); y += 8;
  };
  const s = n.signos; const pe = parseFloat(s.peso), ta = parseFloat(s.talla) > 3 ? parseFloat(s.talla) / 100 : parseFloat(s.talla);
  sec('SIGNOS VITALES', VIT.filter(([k]) => s[k]).map(([k, l]) => `${l}: ${s[k]}`).join('  ·  ') + (pe && ta ? `  ·  IMC: ${(pe / (ta * ta)).toFixed(1)}` : ''));
  sec('SUBJETIVO / PADECIMIENTO ACTUAL', n.subjetivo); sec('EXPLORACIÓN FÍSICA', n.exploracion);
  sec('DIAGNÓSTICO (CIE-10)', n.dx.map((d, i) => `${d.c}  ${d.d}${i ? '' : ' (principal)'}`).join('\n')); sec('PRONÓSTICO', n.pronostico); sec('PLAN DE TRATAMIENTO', n.plan);
  n.addenda.forEach((a) => sec(`ADDENDUM · ${fh(a.t)} · ${a.autor}`, a.texto));
  nl(110); y += 10; doc.setDrawColor(226, 232, 240); doc.setLineWidth(1); doc.line(M, y, W - M, y); y += 12;
  if (firma) { try { doc.addImage(firma, 'PNG', M, y, 150, 50); } catch { /* sin firma */ } }
  y += 54; doc.setDrawColor(15, 23, 42); doc.line(M, y, M + 220, y); y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.text(n.medico ?? '', M, y); y += 13;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text('Cédula profesional ' + (n.cedula ?? ''), M, y); y += 12;
  doc.text(n.firmada ? 'Firmada el ' + fh(n.firmada) : 'BORRADOR — sin firma', M, y); y += 12;
  doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.text(doc.splitTextToSize('Sello digital SHA-256: ' + (n.sello ?? '—'), W - 2 * M), M, y);
  pie(doc, 'Documento sellado conforme a NOM-004-SSA3-2012. No editable: las correcciones se agregan como addendum con fecha, hora y usuario.');
  bajar(doc, `nota-${String(p.folio).padStart(6, '0')}-${n.creado.slice(0, 10)}.pdf`);
}

export async function pdfReceta(m: Marca, p: Paciente, r: RecetaPDF, firma: string | null) {
  const B = await base(m, 'RECETA MÉDICA', `Folio RX-${String(p.folio).padStart(6, '0')}-${r.id.slice(0, 4).toUpperCase()}`); const { doc, W, M, col } = B; let y = B.y;
  const nl = (h: number) => { if (y + h > 730) { doc.addPage(); y = M; } };
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(15, 23, 42); doc.text(r.medico, M, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139);
  const pr = [r.especialidad, 'Cédula profesional ' + r.cedula, r.universidad ? 'Egresado(a) de ' + r.universidad : ''].filter(Boolean) as string[];
  doc.text(pr, M, y + 12); y += 12 + pr.length * 10 + 8;
  y = ficha(doc, M, W, y, [['Paciente', p.nombre], ['Fecha', fh(r.creado)], ['Edad / sexo', `${p.edad} años · ${p.sexo}`], ['Peso / talla', [r.peso && r.peso + ' kg', r.talla && r.talla + ' m'].filter(Boolean).join(' · ') || '—']]) - 4;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...(p.alergias.length ? [185, 28, 28] as [number, number, number] : [21, 128, 61] as [number, number, number]));
  doc.text('Alergias: ' + (p.alergias.join(', ') || (p.niega ? 'niega' : 'no registradas')), M, y); y += 24;
  doc.setFont('times', 'bolditalic'); doc.setFontSize(22); doc.setTextColor(...col); doc.text('Rp.', M, y); y += 18;
  r.meds.forEach((x, i) => {
    const det = [x.dosis, x.via && 'vía ' + x.via.toLowerCase(), x.frec, x.dur && 'durante ' + x.dur].filter(Boolean).join(', ');
    doc.setFontSize(10); const l1 = doc.splitTextToSize(det, W - 2 * M - 18), l2 = x.ind ? doc.splitTextToSize(x.ind, W - 2 * M - 18) : []; nl(30 + (l1.length + l2.length) * 13);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(15, 23, 42); doc.text(`${i + 1}. ${x.med}`, M, y);
    if (x.cant) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.text('Surtir: ' + x.cant, W - M, y, { align: 'right' }); }
    y += 14; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(51, 65, 85); l1.forEach((t: string) => { doc.text(t, M + 18, y); y += 13; });
    doc.setFont('helvetica', 'italic'); l2.forEach((t: string) => { doc.text(t, M + 18, y); y += 13; }); y += 10;
  });
  if (r.ind) { doc.setFontSize(10); const l = doc.splitTextToSize(r.ind, W - 2 * M); nl(24 + l.length * 13); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...col); doc.text('INDICACIONES GENERALES', M, y); y += 13; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42); l.forEach((t: string) => { doc.text(t, M, y); y += 13; }); }
  nl(120); y = Math.max(y + 16, 600);
  if (firma) { try { doc.addImage(firma, 'PNG', W / 2 - 75, y - 4, 150, 50); } catch { /* sin firma */ } }
  y += 50; doc.setDrawColor(15, 23, 42); doc.setLineWidth(1); doc.line(W / 2 - 120, y, W / 2 + 120, y); y += 13;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text(r.medico, W / 2, y, { align: 'center' }); y += 12;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(100, 116, 139); doc.text('Céd. prof. ' + r.cedula, W / 2, y, { align: 'center' }); y += 14;
  doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.text('Sello digital SHA-256: ' + r.sello, W / 2, y, { align: 'center', maxWidth: W - 2 * M });
  pie(doc, 'Receta expedida electrónicamente. Los medicamentos controlados requieren receta especial con código de barras de COFEPRIS.');
  bajar(doc, `receta-${String(p.folio).padStart(6, '0')}-${r.creado.slice(0, 10)}.pdf`);
}

export async function firmaDataURL(url: string | null) { return aDataURL(url); }
