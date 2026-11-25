# FyntMedic

Expediente clínico electrónico por suscripción, con la marca de cada clínica.

## Qué hay aquí

| Ruta | Qué es |
|---|---|
| `index.html` | Landing de venta (lo que se ve en el dominio). |
| `demo/` | Demo funcional con datos de ejemplo guardados en el navegador. **No usar con pacientes reales.** |
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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navegador (es pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor. **Secreta.** |
