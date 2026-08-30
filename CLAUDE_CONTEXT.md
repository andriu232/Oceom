# CLAUDE_CONTEXT.md — Handoff entre máquinas (Mac ↔ Windows)

> **Leéme primero** si eres Claude arrancando en este repo desde otra máquina.
> Aquí está lo que NO vive en el código: identidades, infra, estado real de la
> base de datos y los footguns que ya costaron caro. La arquitectura está en
> [CLAUDE.md](./CLAUDE.md) y [AGENTS.md](./AGENTS.md).
>
> **Última actualización:** 2026-08-29 · MAPA BIOCODE completo + reescritura del
> filtro de seguridad.

---

## 🌿 Qué es

**OCEOM by E-MOTION®** — el ecosistema digital del método E-MOTION® de
**Valeria Rueda Caicedo** (sanación neuroemocional). No es una academia de
cursos: es un *santuario digital*. La usuaria final son mujeres, en su mayoría
desde el teléfono.

## 👤 Identidades y accesos

- **Dev:** Andrés, desarrolla en paralelo Mac + Windows. `codigo8enigma@gmail.com`.
- **Valeria Rueda** — dueña del producto, rol `mentor` (`valeriaruedacaicedo@gmail.com`,
  perfil "Elektra", hoy `super_admin`).
- Roles: `super_admin` / `mentor` / `student`.
- **Los commits van como `codigo8enigma <codigo8enigma@gmail.com>`** — es el autor de
  todo el historial. En el Mac hay que pasarlo explícito:
  `git -c user.name="codigo8enigma" -c user.email="codigo8enigma@gmail.com" commit`.
- gh CLI: la cuenta activa suele ser `codigo8enigma` y **conserva push** sobre
  `andriu232/Oceom`. No hace falta cambiar de cuenta.

```
origin → https://github.com/andriu232/Oceom.git   (rama main)
```

Vercel auto-despliega con `git push origin main` → **https://oceom.33vertebras.com**
(`oceom.vercel.app` sigue vivo).

## 🧱 Stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript estricto · Tailwind **v4** ·
Supabase (Auth/Postgres/Storage/RLS) · three + @react-three/fiber ·
`@anthropic-ai/sdk` apuntando a **Moonshot (Kimi K2.6)**.

Node: el Mac tiene 26, los repos esperaban 24. Corre bien; `npm test` usa el
runner nativo con TypeScript sin transpilar.

## 🗄️ Base de datos — estado verificado (2026-08-29)

Todas las migraciones hasta la **0031 están aplicadas** en Supabase producción
(`xcnxlrvchxctxihnwpnb`). Comprobado contra la base, no de memoria:

| tabla | estado |
|---|---|
| `biocode_nodes` | 29 nodos, las 7 puertas cubiertas |
| `biocode_sessions` | con `mapa`, `ficha`, `numero`, `estado` (0030) |
| `biocode_arbol` | creada (0031), RLS sin excepción para roles |
| `mail_campaigns` | 4 campañas del centro de correos |

La búsqueda (`match_biocode_nodes`) responde: 26/26 frases del documento caen
en su nodo.

> ⚠️ **El CLI de Supabase está logueado en otra cuenta y no ve este proyecto.**
> Las migraciones se aplican pegando el SQL en el editor de Supabase. Andrés
> las corre él; hay que **pegarle el SQL completo en el chat**, nunca como
> adjunto.

## 🤖 La IA

Un solo `@anthropic-ai/sdk` sirve para Kimi y para Claude cambiando
`baseURL`/`model`/`key` — ver `src/lib/omi/provider.ts`. Cuatro puntos la usan:
chat de OMI, chat de BIOCODE, informes (`omi/analyze.ts`) y Hermes.

**Todos pasan por `modelParams()` y `createModelClient()`.** No instanciar el
SDK a mano: `modelParams` es lo que desactiva el razonamiento de Kimi, y sin eso
el modelo se gasta la respuesta pensando (medido: 40 s y 29 caracteres
truncados en el chat; 86 s y el informe cortado justo por SEÑALES DE ALERTA).

> ⚠️ **La cuenta de Moonshot está topada en 3 peticiones por minuto para toda la
> organización** (Tier 0). Tres llamadas simultáneas pasan; la cuarta del mismo
> minuto devuelve 429. **Subir a Tier 1 cuesta $10 de recarga acumulada** —
> Andrés ya recargó $5, faltan $5; el bono de $5 que regalan NO cuenta para
> subir de tier. Saldo disponible ~$9,7 y el consumo real ronda **$0,006 por
> conversación**.
>
> ⚠️ Rotar la `MOONSHOT_API_KEY`: quedó pegada en un chat.

## 🧭 MAPA BIOCODE — completo

Vive en `/biocode` dentro del área de la mentora (grupo IA & Datos, etiqueta
Beta). **Todavía no se le muestra a las estudiantes**: cuando esté listo, mover
a `(estudiante)` y devolverlo a `studentGroups` en `src/config/navigation.ts`.

Los dos documentos de Valeria (prompt maestro y manual de experiencia, 31
secciones cada uno) están implementados. Los comentarios del código citan la
sección: buscar `§` en `src/lib/biocode/` y `src/components/biocode/`.

- **Entrada**: cuerpo 3D (atlas Z-Anatomy auto-hospedado), buscador y 7 puertas.
- **Constelación**: la zona al centro y sus dimensiones alrededor; se dibuja con
  los datos del nodo, sin esperar al modelo.
- **Ficha** "Lo que he descubierto", **Mi Mapa** (`/biocode/mi-mapa`) y
  **Mi Árbol** (`/biocode/arbol`) con detección de coincidencias.
- **Privacidad**: borrar una exploración o el mapa entero. El árbol no lo ve
  nadie más, ni la mentora.

## 🚨 El filtro de seguridad — lo más delicado del repo

`src/lib/biocode/safety.ts` decide, **antes de llamar al modelo**, si un mensaje
es una urgencia médica o una crisis. Se reescribió entero el 2026-08-29 porque
detectaba **12 de 175** frases reales de urgencia.

Dos corpus congelados como prueba (`frases-seguridad*.json`, 405 frases). Si
tocas ese archivo, `npm test` te dice si bajó la cobertura:

| | detecta | falsas alarmas |
|---|---|---|
| corpus de casa | 170/175 | 2 (hipérboles aceptadas a conciencia) |
| corpus independiente | 97/130 | 0 |

**El criterio, que importa más que los patrones:** dispara por ideación, plan y
autolesión — **no por tristeza**. La respuesta de crisis DETIENE la exploración,
y hacerle eso a alguien en duelo le cierra la puerta justo cuando vino a que la
acompañaran. Y los síntomas ambiguos (pecho, aire, garganta) solo disparan si la
persona no los está atribuyendo ella misma a una emoción.

## 🔥 Footguns que ya costaron caro

- **Tailwind v4** usa la propiedad CSS `translate` para `-translate-x-1/2`, no
  `transform`. **Las dos se componen**: una animación que repita el translate
  mueve el elemento media caja. Los keyframes solo deben escalar.
- **`\b` en JavaScript se define sobre ASCII**: `durmi[oó]\b` no casa nunca
  cuando la vocal es la acentuada. Misma familia que el `\w` que rompía el
  detector con "me desmayé".
- **El fondo de agua es delicado.** Es una simulación WebGL en un iframe
  (`oceom-water-background.tsx`). Ya se intentó optimizar (pausarlo bajo el
  cuerpo 3D, bajarle el detalle en móvil) y Andrés pidió revertirlo: **no
  tocarlo sin que él lo pida**.
- **`prefers-reduced-motion` y el detalle por dispositivo no se pueden calcular
  en un `useState` perezoso**: ese inicializador corre en el servidor y la
  hidratación conserva ese valor. Va con `useSyncExternalStore`.
- **`curl -I` miente sobre el caché de Supabase Storage**: con HEAD dice
  `no-cache`, con GET real dice `max-age=31536000, immutable`.
- **Moonshot ignora `thinking.budget_tokens`**: o razona sin tope o se desactiva.
- Colores en **hex**, no oklch (bug de Lightning CSS heredado de QuanTrade).
- **Next 16**: patrón de proxy (`src/proxy.ts`), no middleware clásico.

## 🧪 Cómo verificar en la otra máquina

```bash
npm install          # el atlas 3D usa overrides para three: no bajar la versión
npm test             # 31 pruebas: seguridad (2 corpus) + coincidencias del árbol
npm run build        # tiene que salir sin errores
npm run dev
```

`.env.local` (los valores están en Vercel y en el vault, NO en el repo):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `MOONSHOT_API_KEY`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_ANATOMY_CATALOG_URL`, las de LiveKit, Resend, Bold y Hermes.

Para ver una pantalla que pide sesión sin poder entrar, el truco que se usó
todo el día: una página temporal en `src/app/prueba-<algo>/page.tsx` que renderice
el componente, abrirla en el proxy (`isPublic`), mirarla con Chrome headless por
CDP, y **borrar las dos cosas al terminar**.

## 📌 Lo que sigue

1. **Subir el plan de Moonshot** ($5 más) y **rotar la key**. Bloquea abrirle
   BIOCODE a las estudiantes.
2. **Panel de la mentora** para que Valeria cree y edite nodos sin SQL. Hoy la
   red crece solo pasando por un programador.
3. **Sacar BIOCODE de beta** y devolverlo al menú de estudiante.
4. **ENTREMANOS®** (§2 del plan): sin empezar. Necesita un modelo con visión —
   el proveedor actual es Kimi de texto.
5. **Hermes** (WhatsApp): el código está listo pero no ha enviado un mensaje
   real. Falta número dedicado y desplegar `hermes-bridge/` en Railway.
6. El **modelo femenino** del cuerpo no existe en el atlas libre; hoy la figura
   es andrógina. Paridad real en 3D = licenciar un modelo comercial.

## 🗂️ Dónde está el resto

- Vault Obsidian `~/Obsidian/OCEOM` (en el Mac): bitácora por sesión, pendientes
  e índices. **Regla: registrar cada sesión ahí.**
- Los dos PDF de Valeria: `~/Downloads/MAPA BIOCODE*.pdf`.
- Trabajo en paralelo de otra sesión: **centro de correos** (campañas que
  configura la mentora, cron horario, baja con un clic) y los fondos del
  santuario. Ya está en `main`.
