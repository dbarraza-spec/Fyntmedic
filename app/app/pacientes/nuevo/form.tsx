'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { crearPaciente } from './actions';
import { CiePicker } from '@/components/cie-picker';

const SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sabe'];
const I = ({ n, l, ...r }: { n: string; l: string } & React.InputHTMLAttributes<HTMLInputElement>) => <label className="c">{l}<input className="i" name={n} {...r} /></label>;

export type Pre = { nombre: string; apP: string; apM: string; tel: string; cita: string };
export function NuevoPacienteForm({ pre }: { pre: Pre }) {
  const [st, act, pending] = useActionState(crearPaciente, undefined);
  return (
    <form action={act} className="col">
      <input type="hidden" name="cita" value={pre.cita} />
      <div className="top"><div><Link className="back" href="/app/pacientes">← Expedientes</Link><h1>Alta de paciente</h1><div className="sub">Los campos con * son obligatorios. El número de expediente se asigna solo.</div></div></div>
      <div className="g2"><div className="col">
        <section className="card"><h2>1 · Datos personales</h2>
          <div className="g3"><I n="nombre" l="Nombre(s) *" required defaultValue={pre.nombre} /><I n="apP" l="Apellido paterno *" required defaultValue={pre.apP} /><I n="apM" l="Apellido materno" defaultValue={pre.apM} /></div>
          <label className="c">CURP<input className="i" name="curp" maxLength={18} style={{ textTransform: 'uppercase' }} autoComplete="off"
            onChange={(e) => {
              const v = e.target.value.toUpperCase(); const f = e.target.form;
              if (f && v.length === 18 && /^[A-Z]{4}\d{6}[HM]/.test(v)) {
                let y = +v.slice(4, 6); y += y > new Date().getFullYear() % 100 ? 1900 : 2000;
                (f.elements.namedItem('fnac') as HTMLInputElement).value = `${y}-${v.slice(6, 8)}-${v.slice(8, 10)}`;
                (f.elements.namedItem('sexo') as HTMLSelectElement).value = v[10] === 'H' ? 'Masculino' : 'Femenino';
              }
            }} /><span className="ayuda">Con los 18 caracteres se llenan solos la fecha de nacimiento y el sexo.</span></label>
          <div className="g3"><I n="fnac" l="Fecha de nacimiento *" type="date" required />
            <label className="c">Sexo *<select className="i" name="sexo" required><option>Femenino</option><option>Masculino</option></select></label>
            <I n="ecivil" l="Estado civil" /><I n="ocup" l="Ocupación" /><I n="escol" l="Escolaridad" /></div>
        </section>
        <section className="card"><h2>2 · Contacto y domicilio</h2>
          <div className="g3"><I n="tel" l="Teléfono celular *" inputMode="tel" required defaultValue={pre.tel} /><I n="correo" l="Correo" type="email" /></div>
          <div className="g3"><I n="calle" l="Calle y número" /><I n="col" l="Colonia" /><I n="cp" l="C.P." inputMode="numeric" maxLength={5} /><I n="mun" l="Municipio" /><I n="edo" l="Estado" defaultValue="Sinaloa" /></div>
          <div className="aviso" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><b>Contacto de emergencia</b>
            <div className="g3"><I n="en_nombre" l="Nombre" /><I n="en_par" l="Parentesco" /><I n="en_tel" l="Teléfono" inputMode="tel" /></div></div>
        </section></div>
      <div className="col">
        <section className="card"><h2>3 · Datos médicos importantes</h2>
          <div className="c">Tipo de sangre<div className="chips">{SANGRE.map((s) => <label key={s} className="op"><input type="radio" name="sangre" value={s} /><span>{s}</span></label>)}</div></div>
          <label className="c">Alergias<input className="i" name="alergias" placeholder="Penicilina, mariscos…" /><span className="ayuda">Sepáralas con coma.</span></label>
          <label className="chk"><input type="checkbox" name="niega" />Niega alergias</label>
          <div className="c">Enfermedades actuales (CIE-10)<CiePicker name="enf" max={6} /></div>
          <label className="c">Cirugías previas<textarea className="i" name="cirugias" placeholder="Una por línea: Colecistectomía, 2019" /></label>
          <label className="c">Medicamentos que toma<textarea className="i" name="meds" /></label>
        </section>
        <section className="card"><h2>4 · Consentimiento</h2>
          <label className="chk"><input type="checkbox" name="privacidad" required />El paciente acepta el aviso de privacidad y el uso de sus datos personales y de salud. *</label>
          <label className="chk"><input type="checkbox" name="whatsapp" />Acepta recordatorios de citas por WhatsApp.</label>
        </section></div></div>
      {st?.error && <div className="aviso er">{st.error}</div>}
      <div className="barra"><span>Al guardar se crea el expediente y queda registrado quién lo dio de alta.</span><button className="btn" disabled={pending}>{pending ? 'Guardando…' : 'Crear expediente'}</button></div>
    </form>
  );
}
