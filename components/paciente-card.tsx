import Link from 'next/link';
import { nombreCompleto, iniciales, edad, folio, colorAvatar, fecha } from '@/lib/ctx';

export type PacLite = { id: string; folio: number; nombre: string; apellido_paterno: string; apellido_materno: string | null; fecha_nacimiento: string; tipo_sangre: string | null; alergias: string[] | null; niega_alergias: boolean; enfermedades: { c: string }[]; telefono: string; creado_en?: string };
export function PacienteCard({ p }: { p: PacLite }) {
  return (
    <Link className="pac" href={`/app/pacientes/${p.id}`}>
      <div className="fila" style={{ gap: 12, flexWrap: 'nowrap' }}>
        <div className="av" style={{ background: colorAvatar(p.id) }}>{iniciales(p)}</div>
        <div><b>{nombreCompleto(p)}</b><div className="ayuda">{edad(p.fecha_nacimiento)} años · Exp. {folio(p.folio)}</div></div>
      </div>
      <div className="chips">
        {p.tipo_sangre && <span className="chip r">{p.tipo_sangre}</span>}
        {p.alergias?.length ? <span className="chip a">Alergia: {p.alergias.join(', ')}</span> : p.niega_alergias ? <span className="chip v">Sin alergias</span> : null}
        {p.enfermedades.slice(0, 2).map((e) => <span key={e.c} className="chip">{e.c}</span>)}
      </div>
      <span className="ayuda">Tel. {p.telefono}{p.creado_en ? ` · alta ${fecha(p.creado_en)}` : ''}</span>
    </Link>
  );
}
export const PAC_COLS = 'id, folio, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, tipo_sangre, alergias, niega_alergias, enfermedades, telefono, creado_en';
