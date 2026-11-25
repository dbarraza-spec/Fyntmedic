import Link from 'next/link';

export type CitaLite = { id: string; inicio: string; duracion_min: number; motivo: string | null; estado: string; nombre_nuevo: string | null; paciente: { id: string; nombre: string; apellido_paterno: string; apellido_materno: string | null } | null };
export const ECOL: Record<string, [string, string, string]> = {
  programada: ['#EAF2FF', '#0077b6', 'Programada'], confirmada: ['#DCFCE7', '#16A34A', 'Confirmada'], atendida: ['#F1F5F9', '#64748B', 'Atendida'],
  no_asistio: ['#FEF3C7', '#F59E0B', 'No asistió'], cancelada: ['#FEE2E2', '#DC2626', 'Cancelada'],
};
export const nombreCita = (c: CitaLite) => c.paciente ? [c.paciente.nombre, c.paciente.apellido_paterno, c.paciente.apellido_materno].filter(Boolean).join(' ') : (c.nombre_nuevo ?? 'Sin nombre');

export function ListaCitas({ citas, horaDe }: { citas: CitaLite[]; horaDe: (t: string) => string }) {
  if (!citas.length) return <div className="vacio">No hay citas este día.</div>;
  return (
    <div className="dl">{citas.map((c) => {
      const k = ECOL[c.estado] ?? ECOL.programada;
      return (
        <Link key={c.id} className="ci" href={`/app/agenda?cita=${c.id}&d=${new Date(c.inicio).toLocaleDateString('en-CA', { timeZone: 'America/Mazatlan' })}`}>
          <span className="h">{horaDe(c.inicio)}</span>
          <span style={{ flex: 1 }}><b>{nombreCita(c)}</b><span className="ayuda" style={{ display: 'block' }}>{c.motivo || 'Consulta'} · {c.duracion_min} min{c.paciente ? '' : ' · paciente nuevo'}</span></span>
          <span className="chip" style={{ background: k[0], color: 'var(--texto-2)' }}>{k[2]}</span>
        </Link>
      );
    })}</div>
  );
}
