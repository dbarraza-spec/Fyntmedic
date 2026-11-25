# FyntMedic

Expediente clínico electrónico por suscripción, con la marca de cada clínica.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `/` (`public/landing.html`) | Landing de venta. |
| `/demo` (`public/demo/`) | Demo con datos de ejemplo en el navegador. **No usar con pacientes reales.** |
| `/login`, `/app/...` | **App real** (Next.js + Supabase): login, roles, súper admin, usuarios, inicio, agenda, pacientes, expediente, notas con firma, historia clínica, estudios, recetas con PDF, inventario, Mi marca, firma del médico y bitácora. |
| `supabase/migrations/0001_esquema.sql` | Base de datos real: clínicas, 5 roles, pacientes, notas, recetas, historia clínica, estudios, agenda, inventario y bitácora. |

## Reglas que cuida la base de datos (no solo la pantalla)

- Cada clínica solo ve lo suyo (RLS).
- Recepción da altas y agenda, pero **no ve** notas, recetas, estudios ni historia clínica.
- Solo un **médico con cédula** firma notas y recetas.
- Nota firmada: se puede corregir **24 h** (la versión anterior se guarda); después solo **addendum**.
- Notas, recetas e historias **no se pueden borrar**. Las recetas no se editan.
- Cada nota y receta lleva **sello SHA-256** calculado por la base de datos.
- **Bitácora** de todo (incluida la consulta de expedientes) que nadie puede modificar.

## Variables para Vercel

Se ponen en Vercel → Project → Settings → Environment Variables. **Nunca** se suben a este repo.

| Variable | Dónde se usa |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Navegador (es pública) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Navegador (es pública, `sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Solo servidor, para crear usuarios. **Secreta** (`sb_secret_…`). |

## Pendiente (siguientes entregas)

- Catálogo CIE-10 oficial completo (requisito NOM-024).
- Cambio de contraseña y 2FA.
- Editar datos del paciente desde el expediente.
- Firma con e.firma del SAT y constancias NOM-151.
- Zona horaria por clínica (hoy fija en America/Mazatlan).
