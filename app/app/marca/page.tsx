import { requireMiembro, urlFirmada } from '@/lib/ctx';
import { MarcaForm } from './form';

export default async function Marca() {
  const ctx = await requireMiembro();
  if (ctx.miembro.rol !== 'admin') return <div className="aviso">Solo el administrador de la clínica cambia la marca.</div>;
  return (
    <>
      <div className="top"><div><h1>Mi marca</h1><div className="sub">Tu clínica con tu logo y tus colores en pantallas, notas y recetas.</div></div></div>
      <MarcaForm c={ctx.clinica} logoUrl={await urlFirmada('marca', ctx.clinica.logo_path)} />
    </>
  );
}
