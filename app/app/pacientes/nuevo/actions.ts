'use server';
import { redirect } from 'next/navigation';
import { getCtx } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { txt, opt, dxDe } from '@/lib/form';

export async function crearPaciente(_: { error?: string } | undefined, f: FormData) {
  const ctx = await getCtx();
  if (!ctx.miembro) return { error: 'Tu usuario no tiene clínica.' };
  if (f.get('privacidad') !== 'on') return { error: 'Falta que el paciente acepte el aviso de privacidad.' };
  const niega = f.get('niega') === 'on';
  const sb = await supabaseServer();
  const { data, error } = await sb.from('pacientes').insert({
    clinica_id: ctx.miembro.clinica_id,
    nombre: txt(f, 'nombre'), apellido_paterno: txt(f, 'apP'), apellido_materno: opt(f, 'apM'),
    curp: opt(f, 'curp')?.toUpperCase() ?? null,
    fecha_nacimiento: txt(f, 'fnac'), sexo: txt(f, 'sexo'),
    estado_civil: opt(f, 'ecivil'), ocupacion: opt(f, 'ocup'), escolaridad: opt(f, 'escol'),
    telefono: txt(f, 'tel'), correo: opt(f, 'correo'),
    domicilio: { calle: txt(f, 'calle'), colonia: txt(f, 'col'), cp: txt(f, 'cp'), municipio: txt(f, 'mun'), estado: txt(f, 'edo') },
    contacto_emergencia: { nombre: txt(f, 'en_nombre'), parentesco: txt(f, 'en_par'), telefono: txt(f, 'en_tel') },
    tipo_sangre: opt(f, 'sangre'),
    alergias: niega ? [] : txt(f, 'alergias').split(',').map((s) => s.trim()).filter(Boolean),
    niega_alergias: niega,
    enfermedades: dxDe(f, 'enf', 3),
    cirugias: opt(f, 'cirugias'), medicamentos: opt(f, 'meds'),
    acepta_privacidad: true, acepta_whatsapp: f.get('whatsapp') === 'on',
  }).select('id').single();
  if (error) return { error: error.message.includes('curp') ? 'La CURP no tiene un formato válido.' : 'No se pudo guardar: ' + error.message };
  redirect(`/app/pacientes/${data.id}`);
}
