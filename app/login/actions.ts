'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export async function entrar(_: { error?: string } | undefined, form: FormData) {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({
    email: String(form.get('email') || '').trim(),
    password: String(form.get('password') || ''),
  });
  if (error) return { error: 'Correo o contraseña incorrectos.' };
  redirect('/app');
}

export async function salir() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/login');
}
