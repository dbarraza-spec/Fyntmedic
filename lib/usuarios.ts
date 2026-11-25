import 'server-only';
import { supabaseAdmin } from './supabase/admin';

// Crea la cuenta de acceso (Auth). Quien llama YA debe haber comprobado el rol con su propia sesión.
export async function crearCuenta(email: string, password: string) {
  if (password.length < 10) return { error: 'La contraseña temporal debe tener al menos 10 caracteres.' };
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { error: /already|registered|exists/i.test(error.message) ? 'Ese correo ya tiene cuenta.' : error.message };
  return { id: data.user.id };
}
