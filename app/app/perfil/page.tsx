import { requireMiembro, urlFirmada } from '@/lib/ctx';
import { Firma } from './firma';

export default async function Perfil() {
  const ctx = await requireMiembro();
  const m = ctx.miembro;
  return (
    <>
      <div className="top"><div><h1>Mi firma y datos</h1><div className="sub">Estos datos se imprimen solos en cada nota y receta.</div></div></div>
      <div className="g2">
        <section className="card"><h2>Datos profesionales</h2>
          <div className="ver"><h3>NOMBRE</h3><p>{`${m.titulo ?? ''} ${m.nombre}`.trim()}</p><h3>CÉDULA PROFESIONAL</h3><p>{m.cedula ?? '—'}</p><h3>ESPECIALIDAD</h3><p>{m.especialidad ?? '—'}{m.cedula_especialidad ? ` · Céd. ${m.cedula_especialidad}` : ''}</p><h3>UNIVERSIDAD</h3><p>{m.universidad ?? '—'}</p></div>
          <div className="aviso">Para corregir estos datos, pídeselo al administrador de tu clínica.</div>
        </section>
        <Firma clinica={m.clinica_id} user={ctx.userId} actual={await urlFirmada('marca', m.firma_path)} />
      </div>
      <div className="aviso al">Por ahora la nota se sella con huella digital SHA-256. La firma con e.firma del SAT (.cer y .key) se agregará más adelante.</div>
    </>
  );
}
