'use client';
import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { guardarMarca, guardarLogo } from './actions';
import { LogoF } from '@/app/logo';

const SW: [string, string][] = [['Azul Fynt', '#0077b6'], ['Turquesa', '#0d9488'], ['Violeta', '#7c3aed'], ['Rosa', '#db2777'], ['Coral', '#ea580c'], ['Verde', '#15803d']];
type C = { id: string; nombre: string; color: string; domicilio: string | null; telefono: string | null; licencia: string | null };

export function MarcaForm({ c, logoUrl }: { c: C; logoUrl: string | null }) {
  const [st, act, pending] = useActionState(guardarMarca, undefined);
  const [color, setColor] = useState(c.color);
  const [nombre, setNombre] = useState(c.nombre);
  const [logo, setLogo] = useState(logoUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  async function subir(file: File) {
    if (file.size > 2 * 1024 * 1024) return setMsg('El logo debe pesar menos de 2 MB.');
    const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z]/g, '');
    const path = `${c.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabaseBrowser().storage.from('marca').upload(path, file, { contentType: file.type });
    if (error) return setMsg('No se pudo subir: ' + error.message);
    const r = await guardarLogo(path);
    if (r?.error) return setMsg(r.error);
    setLogo(URL.createObjectURL(file)); setMsg('Logo guardado.'); router.refresh();
  }
  return (
    <div className="g2" style={{ ['--marca' as string]: color }}>
      <form action={act} className="card"><h2>Identidad</h2>
        <label className="c">Nombre de la clínica<input className="i" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></label>
        <label className="c">Domicilio (sale en recetas y notas)<input className="i" name="dir" defaultValue={c.domicilio ?? ''} /></label>
        <div className="g3"><label className="c">Teléfono<input className="i" name="tel" defaultValue={c.telefono ?? ''} /></label><label className="c">Licencia sanitaria / aviso<input className="i" name="lic" defaultValue={c.licencia ?? ''} /></label></div>
        <div className="c">Color principal
          <input type="hidden" name="color" value={color} />
          <div className="g3">{SW.map(([n, h]) => <button type="button" key={h} className={`sw${color === h ? ' on' : ''}`} style={{ ['--sc' as string]: h }} onClick={() => setColor(h)}><i />{n}</button>)}</div>
          <label className="fila" style={{ fontWeight: 500 }}>Color exacto de tu manual de marca <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 56, height: 40, border: 0, background: 'none' }} /></label>
        </div>
        {st?.error && <div className="aviso er">{st.error}</div>}{st?.ok && <div className="aviso ok">{st.ok}</div>}
        <div><button className="btn" disabled={pending}>{pending ? 'Guardando…' : 'Guardar marca'}</button></div>
      </form>
      <section className="card"><h2>Logo y vista previa</h2>
        <label className="subir">{logo ? <img src={logo} alt="Logo actual" style={{ maxHeight: 70, display: 'block', margin: '0 auto 6px' }} /> : null}Subir logo (PNG o JPG, fondo transparente)
          <input type="file" accept="image/png,image/jpeg" onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} /></label>
        {logo && <div><button type="button" className="btn sec ch" onClick={async () => { await guardarLogo(null); setLogo(null); router.refresh(); }}>Quitar logo</button></div>}
        {msg && <div className="aviso">{msg}</div>}
        <div style={{ border: '1px solid var(--borde)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ background: 'var(--marino)', padding: 18, color: '#fff' }}><b>¿A quién buscas hoy?</b><div style={{ background: '#fff', borderRadius: 99, padding: '10px 16px', marginTop: 10, color: 'var(--gris)', fontSize: 13 }}>Nombre, CURP, teléfono…</div></div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fila"><span className="btn ch">Botón principal</span><span className="chip">Etiqueta</span><span className="tab on">Pestaña</span></div>
            <div style={{ borderBottom: '3px solid var(--azul)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div className="fila">{logo ? <img src={logo} alt="" style={{ height: 34 }} /> : <LogoF color={color} />}<b>{nombre}</b></div><b style={{ color: 'var(--azul)', fontSize: 13 }}>NOTA DE EVOLUCIÓN</b></div>
            <div className="ayuda">Así se verá el encabezado del PDF.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
