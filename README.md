# OCEOM by E-MOTION®

> Donde el océano interior despierta. Tecnología emocional para la evolución humana.

Ecosistema digital premium del método **E-MOTION®** de Valeria Rueda Caicedo:
un santuario digital inmersivo para procesos de sanación neuroemocional,
corporal y energética.

## Stack

- **Next.js 16** (App Router, RSC) · React 19 · TypeScript estricto
- **Tailwind CSS v4** + design system OCEOM (glassmorphism, océano/cosmos)
- **Supabase** — Auth · Postgres · Storage · Realtime · pgvector (RAG de AURA)
- **motion** (Framer Motion) · **lucide-react** · **zod**
- Video privado: **Vimeo Pro** · Emails: **Resend** · Pagos: Stripe/Wompi (fase final)

## Arquitectura de seguridad

Tres capas de defensa para datos sensibles (bitácora, check-ins, notas):

1. **proxy.ts** (antes "middleware" — renombrado en Next 16): refresca sesión y protege rutas (UX).
2. **Server Actions** con `requireRole()` y validación Zod.
3. **RLS en Supabase**: la frontera real. Ver `supabase/migrations/0002_rls.sql`.

`service_role` se usa solo en server-side controlado (`src/lib/supabase/service.ts`).

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.local.example .env.local   # y rellenar con tus valores de Supabase

# 3. Base de datos (en el proyecto Supabase):
#    Ejecutar en orden, desde el SQL Editor o Supabase CLI:
#    - supabase/migrations/0001_schema.sql
#    - supabase/migrations/0002_rls.sql
#    - supabase/seed.sql   (programas demo E-MOTION® y Neuropsíquica)

# 4. Desarrollo
npm run dev        # http://localhost:3000
```

### Crear la mentora (Valeria) y roles

Tras registrar usuarios desde `/registro`, ajusta el rol en Supabase:

```sql
update profiles set role = 'mentor'      where email = 'valeria@...';
update profiles set role = 'super_admin' where email = 'admin@...';
-- los demás quedan como 'student' por defecto
```

Inscribe a un estudiante en un programa:

```sql
insert into enrollments (student_id, program_id, status)
select p.id, pr.id, 'active'
from profiles p, programs pr
where p.email = 'estudiante@...' and pr.slug = 'metodo-emotion';
```

## Estructura

```
src/
  app/
    (auth)/         login · registro · onboarding
    (estudiante)/   santuario · explorar · mi-ruta · deep-waves · aura · ...
    (admin)/        panel · estudiantes · programas · entregas · ...
  components/  ui · brand · shared (+ estudiante/admin/player/aura en próximos sprints)
  lib/         supabase · auth · actions · validations
  config/      navigation (lenguaje de marca OCEOM) · site
  types/       domain
supabase/      migrations · seed
```

## Lenguaje de marca

| Genérico | OCEOM |
|---|---|
| Inicio | Santuario |
| Cursos | Rutas |
| Lecciones | Experiencias |
| Tareas | Integraciones |
| Journal | Bitácora Interior |
| Progreso | Mi Evolución |
| Sesiones en vivo | Círculos en Vivo |
| Audios | Deep Waves |
| IA | AURA |
| Perfil | Mi Portal |

## Estado: Sprint 1 ✅

Setup, autenticación, roles, RLS, layouts estudiante/admin, dashboards base
(Santuario + Panel), estética OCEOM y seed demo. Próximo: **Sprint 2** (programas,
rutas y experiencias).
