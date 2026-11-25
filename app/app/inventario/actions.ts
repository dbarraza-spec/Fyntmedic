'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireMiembro } from '@/lib/ctx';
import { supabaseServer } from '@/lib/supabase/server';
import { txt, opt } from '@/lib/form';

export async function altaProducto(f: FormData) {
  const ctx = await requireMiembro();
  const sb = await supabaseServer();
  const cad = txt(f, 'cad');
  const { error } = await sb.from('inventario').insert({
    clinica_id: ctx.miembro.clinica_id, tipo: txt(f, 'tipo') || 'Medicamento', generico: txt(f, 'gen'), comercial: opt(f, 'com'),
    presentacion: txt(f, 'pres'), lote: txt(f, 'lote'), caducidad: cad.length === 7 ? `${cad}-01` : cad,
    cantidad: Number(txt(f, 'cant')) || 0, minimo: Number(txt(f, 'min')) || 0, unidad: txt(f, 'uni') || 'piezas', controlado: f.get('ctrl') === 'on',
  });
  revalidatePath('/app/inventario');
  redirect('/app/inventario?' + new URLSearchParams(error ? { error: error.message } : { ok: 'Producto dado de alta.' }));
}

export async function moverProducto(f: FormData) {
  await requireMiembro();
  const sb = await supabaseServer();
  const { data: x } = await sb.from('inventario').select('cantidad').eq('id', txt(f, 'id')).single();
  if (x) await sb.from('inventario').update({ cantidad: Math.max(0, x.cantidad + Number(txt(f, 'd'))) }).eq('id', txt(f, 'id'));
  revalidatePath('/app/inventario');
}
