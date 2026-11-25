'use client';
import { useActionState } from 'react';
import { crearPaciente } from './actions';

const SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'No sabe'];

export default function NuevoPaciente() {
  const [st, act, pending] = useActionState(crearPaciente, undefined);
  return (
    <form action={act} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="top"><div><h1>Alta de paciente</h1><div className="sub">Los campos con * son obligatorios. El folio se asigna solo.</div></div></div>
      <div className="g2">
        <section className="card"><h2>Datos personales</h2>
          <div className="g3">
            <label className="c">Nombre(s) *<input className="i" name="nombre" required /></label>
            <label className="c">Apellido paterno *<input className="i" name="apP" required /></label>
            <label className="c">Apellido materno<input className="i" name="apM" /></label>
            <label className="c">Fecha de nacimiento *<input className="i" type="date" name="fnac" required /></label>
            <label className="c">Sexo *<select className="i" name="sexo" required><option>Femenino</option><option>Masculino</option></select></label>
            <label className="c">CURP<input className="i" name="curp" maxLength={18} style={{ textTransform: 'uppercase' }} /></label>
            <label className="c">Estado civil<input className="i" name="ecivil" /></label>
            <label className="c">Ocupación<input className="i" name="ocup" /></label>
            <label className="c">Escolaridad<input className="i" name="escol" /></label>
          </div>
        </section>
        <section className="card"><h2>Contacto</h2>
          <div className="g3">
            <label className="c">Teléfono *<input className="i" name="tel" inputMode="tel" required /></label>
            <label className="c">Correo<input className="i" name="correo" type="email" /></label>
            <label className="c">Calle y número<input className="i" name="calle" /></label>
            <label className="c">Colonia<input className="i" name="col" /></label>
            <label className="c">C.P.<input className="i" name="cp" inputMode="numeric" maxLength={5} /></label>
            <label className="c">Municipio<input className="i" name="mun" /></label>
            <label className="c">Estado<input className="i" name="edo" /></label>
          </div>
          <div className="aviso" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}><b>Contacto de emergencia</b>
            <div className="g3">
              <label className="c">Nombre<input className="i" name="en_nombre" /></label>
              <label className="c">Parentesco<input className="i" name="en_par" /></label>
              <label className="c">Teléfono<input className="i" name="en_tel" inputMode="tel" /></label>
            </div>
          </div>
        </section>
        <section className="card"><h2>Datos médicos</h2>
          <label className="c">Tipo de sangre<select className="i" name="sangre" defaultValue=""><option value="">—</option>{SANGRE.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="c">Alergias<input className="i" name="alergias" placeholder="Penicilina, mariscos…" /><span className="ayuda">Sepáralas con coma.</span></label>
          <label className="fila" style={{ fontSize: 14 }}><input type="checkbox" name="niega" /> Niega alergias</label>
          <div className="c">Enfermedades actuales (CIE-10)
            {[0, 1, 2].map((i) => <input key={i} className="i" name={`enf${i}`} list="cie10-alta" placeholder="Escribe código o nombre: E11, diabetes…" />)}
          </div>
          <label className="c">Cirugías previas<textarea className="i" name="cirugias" placeholder="Una por línea: Colecistectomía, 2019" /></label>
          <label className="c">Medicamentos actuales<textarea className="i" name="meds" /></label>
        </section>
        <section className="card"><h2>Consentimiento</h2>
          <label className="fila" style={{ fontSize: 14, alignItems: 'flex-start' }}><input type="checkbox" name="privacidad" required /> El paciente acepta el aviso de privacidad y el uso de sus datos personales y de salud. *</label>
          <label className="fila" style={{ fontSize: 14 }}><input type="checkbox" name="whatsapp" /> Acepta recordatorios por WhatsApp.</label>
        </section>
      </div>
      <CieOpciones />
      {st?.error && <div className="aviso er">{st.error}</div>}
      <div className="barra"><span>Se registra quién dio de alta al paciente, con fecha y hora.</span><button className="btn" disabled={pending}>{pending ? 'Guardando…' : 'Crear expediente'}</button></div>
    </form>
  );
}

import { CIE10 } from '@/lib/cie10';
function CieOpciones() {
  return <datalist id="cie10-alta">{CIE10.map((x) => <option key={x.c} value={`${x.c} — ${x.d}`} />)}</datalist>;
}
