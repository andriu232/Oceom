# CLAUDE_CONTEXT.md — Handoff de sesión (multi-PC: Mac + Windows)

> **Leéme primero** si sos Claude arrancando en este repo desde otra máquina.
> Concentra el contexto que NO vive en el código (identidades, cuentas, infra,
> footguns). El detalle de arquitectura está en [CLAUDE.md](./CLAUDE.md) y [AGENTS.md](./AGENTS.md).
>
> **Última actualización:** 2026-06-30 · setup de desarrollo paralelo Mac + Windows.

---

## 🌿 Qué es
**OCEOM by E-MOTION®** — ecosistema digital premium del método E-MOTION® de **Valeria Rueda Caicedo** (sanación neuroemocional, corporal y energética). NO es academia de cursos: **"santuario digital inmersivo"**. Greenfield arrancado 2026-06-25.

## 👤 Identidades
- **Usuario (dev):** desarrolla en paralelo **Mac + Windows**. `codigo8enigma@gmail.com`.
- **Valeria Rueda** — owner del producto (rol `mentor`).
- Roles del sistema: `super_admin` / `mentor` (Valeria) / `student`.
- **Credenciales admin/demo:** en el vault Obsidian (`Documents/Obsidian/OCEOM`), NO en este repo (es público hasta pasar a privado).

## 🌿 Git / cómo pushear
```
origin → https://github.com/andriu232/Oceom.git   (rama main)
```
- **Vercel auto-deploya desde `git push origin main`** → https://oceom.vercel.app
  (team "Andres' projects" Pro = asgo1107/andriu232).
- gh CLI activo: **`codigo8enigma`**, que **conservó push** tras la transferencia del repo
  (templosolar → andriu232 el 2026-06-26). Push directo: `git push origin main`. No hace falta cambiar de cuenta.
- Repo era público → pasar a privado (andriu232 es owner).

## 🧱 Stack
Next.js 16.2.9 (App Router/RSC) · React 19 · TypeScript estricto · Tailwind v4 ·
Supabase (Auth/Postgres/Storage/Realtime/pgvector) · motion · lucide · zod ·
three + @react-three/fiber (fondo 3D de geometría sagrada).

## 🎯 Estado actual (HEAD `cc43b1a`, 2026-06-30)
Avanzado bastante más allá del Sprint 1. Último trabajo:
- **Círculos en Vivo:** sala de video nativa **LiveKit** + CRUD admin + lista estudiante.
- **Agenda:** correos vía **Resend** + adjunto `.ics` + botón "Agregar a Google Calendar".
- **Materiales:** subir/descargar + inscripción de estudiantes.
- Login pulido + `handle_new_user` captura nombre/foto del proveedor OAuth (Google).
- Supabase real migrado (programs=2, lessons=24, ~50 RLS).
- Fondo 3D de **geometría sagrada** (Metatrón / Flor de la Vida / sólidos platónicos).

**Roadmap:** 12 sprints (ver `CLAUDE.md`/`AGENTS.md` del repo + doc Sprint 0).

## ♻️ Reúso de Código Enigma
CE (mismo stack Next16+Supabase+Tailwind v4) está clonado **read-only** en
`C:\Users\jurid\codigo-enigma-ref` (en el Mac habrá que re-clonarlo o ajustar la ruta).
Estrategia: **portar y adaptar (cherry-pick), NO fusionar repos**. Tablas compatibles
(profiles/programs/modules/lessons/lesson_progress/community_*/live_rooms).
OCEOM mantiene propio: capa emocional, IA **AURA**, integraciones, geometría sagrada.

## 🔥 Footguns (ver detalle en memoria / Obsidian)
- **Next 16:** usar el patrón de proxy, NO middleware clásico. `cookies()` es **async**.
- **Colores:** usar **hex** (mismo bug Lightning CSS oklch→lab que QuanTrade).
- **RLS es la frontera real** de seguridad — validar siempre.
- `.env.local` con placeholders para que el build pase; las 3 llaves Supabase van en Vercel.
- IA AURA: arquitectura provider-agnostic + mock hasta tener crédito (no pagar extra).

## 🗂️ Más contexto
- Repo: `CLAUDE.md`, `AGENTS.md`, `README.md`.
- Vault Obsidian (sincroniza al Mac): `Documents/Obsidian/OCEOM` (8 índices + bitácora).
  **Regla: registrar todo cada sesión.**
- Prod: https://oceom.vercel.app · Supabase Site URL pendiente → oceom.vercel.app
