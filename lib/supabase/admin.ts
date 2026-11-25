import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente con la llave SECRETA. Solo para crear usuarios de Auth,
// y SIEMPRE después de comprobar el rol de quien lo pide con su propia sesión.
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('Falta SUPABASE_SECRET_KEY en las variables de Vercel.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
