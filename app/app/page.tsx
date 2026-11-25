import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';

export default async function Inicio() {
  const ctx = await getCtx();
  if (ctx.miembro) redirect('/app/pacientes');
  if (ctx.superadmin) redirect('/app/admin');
  return (
    <div className="card">
      <h1>Tu cuenta no tiene clínica</h1>
      <p className="sub">Pide al administrador de tu clínica que te dé de alta.</p>
    </div>
  );
}
