import { NuevoPacienteForm } from './form';

export default async function NuevoPaciente({ searchParams }: { searchParams: Promise<{ nombre?: string; tel?: string; cita?: string }> }) {
  const sp = await searchParams;
  const partes = (sp.nombre ?? '').trim().split(/\s+/).filter(Boolean);
  const tres = partes.length > 2;
  return <NuevoPacienteForm pre={{
    nombre: tres ? partes.slice(0, -2).join(' ') : partes[0] ?? '',
    apP: tres ? partes[partes.length - 2] : partes[1] ?? '',
    apM: tres ? partes[partes.length - 1] : '',
    tel: sp.tel ?? '', cita: sp.cita ?? '',
  }} />;
}
