'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { registrarEstudio } from './actions';

const TIPOS = ['Laboratorio', 'Rayos X', 'Ultrasonido', 'Tomografía', 'Resonancia', 'Electrocardiograma', 'Foto clínica', 'Otro'];

export function EstudioForm({ clinica, paciente }: { clinica: string; paciente: string }) {
  const [msg, setMsg] = useState<{ t: 'ok' | 'er'; m: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const file = f.get('archivo') as File | null;
    if (!file || !file.size) return setMsg({ t: 'er', m: 'Elige un archivo.' });
    if (file.size > 25 * 1024 * 1024) return setMsg({ t: 'er', m: 'El archivo pesa más de 25 MB.' });
    setBusy(true); setMsg(null);
    const limpio = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80);
    const path = `${clinica}/${paciente}/${crypto.randomUUID()}-${limpio}`;
    const { error } = await supabaseBrowser().storage.from('estudios').upload(path, file, { contentType: file.type });
    if (error) { setBusy(false); return setMsg({ t: 'er', m: 'No se pudo subir: ' + error.message }); }
    const r = await registrarEstudio({ paciente, path, tipo: String(f.get('tipo')), nombre: String(f.get('nombre')), fecha: String(f.get('fecha')), laboratorio: String(f.get('lab') ?? ''), resultado: String(f.get('res') ?? '') });
    setBusy(false);
    if (r?.error) return setMsg({ t: 'er', m: r.error });
    (e.target as HTMLFormElement).reset(); setMsg({ t: 'ok', m: 'Estudio guardado en el expediente.' }); router.refresh();
  }
  return (
    <form onSubmit={enviar} className="card" style={{ background: '#F8FBFF' }}><h2>Anexar estudio o imagen</h2>
      <label className="subir">Toca para elegir el archivo (PDF, JPG o PNG)<input type="file" name="archivo" accept="image/*,application/pdf" required /></label>
      <div className="g3">
        <label className="c">Tipo de estudio *<select className="i" name="tipo">{TIPOS.map((t) => <option key={t}>{t}</option>)}</select></label>
        <label className="c">Nombre del estudio *<input className="i" name="nombre" required placeholder="Biometría hemática" /></label>
        <label className="c">Fecha del estudio *<input className="i" type="date" name="fecha" required defaultValue={new Date().toISOString().slice(0, 10)} /></label>
        <label className="c">Laboratorio o gabinete<input className="i" name="lab" /></label>
      </div>
      <label className="c">Resultado o interpretación<textarea className="i" name="res" /></label>
      {msg && <div className={`aviso ${msg.t}`}>{msg.m}</div>}
      <div><button className="btn" disabled={busy}>{busy ? 'Subiendo…' : 'Guardar en el expediente'}</button></div>
    </form>
  );
}
