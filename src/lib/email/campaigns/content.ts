import { APP_URL, shell, linkButton, esc } from "../layout";

/* ============================================================
   El texto de las campañas. Vive en el código a propósito: la redacción de
   algo que le llega a 26 personas se revisa en un pull request, no se edita
   en una caja de texto a las once de la noche.

   Todas rotan: recibir literalmente el mismo correo semana tras semana es la
   forma más rápida de que la gente deje de abrirlo. El índice lo decide el
   día (o la semana) del año, no el azar, para que sea reproducible y todo el
   grupo reciba el mismo.
   ============================================================ */

export interface RenderCtx {
  firstName: string;
  unsubUrl: string;
  day: Date;
}

export interface RenderedMail {
  subject: string;
  html: string;
}

/** Día del año. */
function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

/** Semana del año, para las campañas semanales o quincenales. */
function weekOfYear(d: Date): number {
  return Math.floor(dayOfYear(d) / 7);
}

/** El pie: la baja de un clic es obligatoria en todo correo recurrente. */
function footer(unsubUrl: string, extra?: string): string {
  return `
    OCEOM · Donde el océano interior despierta<br>
    ${extra ? extra + "<br>" : ""}
    <a href="${unsubUrl}" style="color:#8aa0c6;text-decoration:underline">No quiero más estos correos</a>
    · <a href="${APP_URL}/ajustes" style="color:#8aa0c6;text-decoration:underline">Cambiar la hora</a>`;
}

function parrafo(html: string): string {
  return `<p style="color:#aab8d4;font-size:15px;line-height:1.7;margin:0 0 4px">${html}</p>`;
}

/* ============================================================
   1. Recordatorio de bitácora
   ============================================================ */

const BITACORA = [
  {
    subject: "¿Cómo estuvo tu día por dentro?",
    title: "Un momento para ti 🌊",
    body: (n: string) =>
      `Hola ${n}, antes de cerrar el día: ¿qué se movió dentro de ti hoy?<br><br>No hace falta que sea profundo ni ordenado. Una frase basta.`,
    cta: "Escribir en mi bitácora",
  },
  {
    subject: "¿Qué emoción se quedó contigo hoy?",
    title: "Tu Bitácora Interior te espera",
    body: (n: string) =>
      `${n}, hay emociones que solo se entienden cuando las escribes.<br><br>¿Cuál se quedó contigo hoy? Déjala aquí y sigue con tu noche.`,
    cta: "Abrir mi bitácora",
  },
  {
    subject: "Algo pequeño también cuenta",
    title: "¿Hubo algo hoy que te movió? 🌙",
    body: (n: string) =>
      `Hola ${n}. A veces el día no trae nada grande, y está bien.<br><br>Aun así, lo pequeño deja huella. Escríbelo antes de que se te olvide.`,
    cta: "Escribir ahora",
  },
  {
    subject: "¿Cómo anda tu océano interior?",
    title: "Aquí estamos",
    body: (n: string) =>
      `${n}, tu bitácora no pide respuestas correctas.<br><br>Escribe lo que sientas, sin ordenarlo. Ordenarlo viene después.`,
    cta: "Entrar a mi bitácora",
  },
  {
    subject: "¿Qué te llevas de hoy?",
    title: "Una palabra basta",
    body: (n: string) =>
      `Hola ${n}. Una frase, una palabra, lo que salga.<br><br>Lo que escribas hoy es lo que vas a poder mirar dentro de unos meses.`,
    cta: "Escribir en mi bitácora",
  },
];

function renderBitacora(ctx: RenderCtx): RenderedMail {
  const v = BITACORA[dayOfYear(ctx.day) % BITACORA.length];
  const inner = `
    ${parrafo(v.body(esc(ctx.firstName)))}
    ${linkButton(`${APP_URL}/bitacora?utm=recordatorio`, v.cta)}
    <p style="color:#8aa0c6;font-size:12px;margin-top:22px">
      También puedes contárselo a Hermes por WhatsApp y queda guardado igual.
    </p>`;
  return { subject: v.subject, html: shell(v.title, inner, footer(ctx.unsubUrl)) };
}

/* ============================================================
   2. Poema de la semana

   Textos originales escritos para OCEOM. Si algún día se quiere publicar a
   un autor ajeno, hay que mirar los derechos: un poema del siglo XX en un
   correo a 26 personas sigue siendo una reproducción.
   ============================================================ */

const POEMAS = [
  {
    titulo: "Marea",
    texto: `No todo lo que se va<br>
            está huyendo de ti.<br><br>
            El mar también retrocede<br>
            para volver con más fuerza,<br>
            y nadie llama a eso abandono.`,
  },
  {
    titulo: "Inventario",
    texto: `Hoy conté lo que tengo:<br>
            dos manos que todavía sirven,<br>
            una respiración que no pedí<br>
            y que sin embargo llega.<br><br>
            Con menos se han fundado ciudades.`,
  },
  {
    titulo: "Lo que no se dice",
    texto: `Hay palabras que se quedan<br>
            de pie junto a la puerta,<br>
            esperando que alguien<br>
            les diga que pueden entrar.<br><br>
            Ábrete la puerta tú.`,
  },
  {
    titulo: "Fondo",
    texto: `Bajé a mirar qué había<br>
            debajo de todo el ruido.<br><br>
            Había un silencio<br>
            que llevaba años<br>
            guardándome el puesto.`,
  },
  {
    titulo: "Paciencia",
    texto: `Al agua nadie le pide<br>
            que atraviese la piedra hoy.<br><br>
            Se le concede el tiempo<br>
            que a nosotros nos negamos.`,
  },
  {
    titulo: "Cuerpo",
    texto: `Antes de que supieras nombrarlo,<br>
            tu cuerpo ya sabía<br>
            de qué tenías miedo.<br><br>
            No lo trates como a un extraño:<br>
            llegó antes que tú.`,
  },
];

function renderPoema(ctx: RenderCtx): RenderedMail {
  const p = POEMAS[weekOfYear(ctx.day) % POEMAS.length];
  const inner = `
    <p style="color:#5eead4;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin:0 0 18px">${p.titulo}</p>
    <p style="color:#dbe6fb;font-size:16px;line-height:2;font-style:italic;margin:0">${p.texto}</p>
    <p style="color:#8aa0c6;font-size:12px;margin-top:28px">
      Para ${esc(ctx.firstName)}, de parte de OCEOM. No hay nada que hacer con esto:
      solo leerlo dos veces.
    </p>`;
  return {
    subject: `${p.titulo} · el poema de la semana`,
    html: shell("Tu poema de esta semana", inner, footer(ctx.unsubUrl)),
  };
}

/* ============================================================
   3. Info de valor
   ============================================================ */

const VALOR = [
  {
    subject: "Nombrar una emoción la baja de intensidad",
    title: "Ponerle nombre ya es hacer algo",
    idea: `Cuando pones en palabras lo que sientes, la parte del cerebro que dispara la
           alarma baja el volumen. No es un truco de motivación: es que nombrar obliga a
           mirar, y lo que se mira deja de crecer a oscuras.`,
    gesto: `Hoy, cuando algo te apriete, no busques la causa todavía. Solo di en voz baja
            qué emoción es. Una palabra.`,
  },
  {
    subject: "La respiración larga al exhalar",
    title: "El botón que sí puedes tocar",
    idea: `Casi nada del sistema nervioso responde a la voluntad. La exhalación sí. Al
           soltar el aire más lento de lo que lo tomas, el cuerpo lee que no hay
           amenaza, y el pulso baja detrás.`,
    gesto: `Tres veces hoy: inhala contando cuatro, exhala contando ocho. No hace falta
            postura ni silencio. Sirve en una fila del banco.`,
  },
  {
    subject: "Lo que no se sostiene, se repite",
    title: "Las emociones no se van: se posponen",
    idea: `Una emoción que se aparta no desaparece, se guarda. Y lo guardado vuelve más
           tarde, más grande y casi siempre con la persona equivocada delante.`,
    gesto: `Piensa en algo que estés aplazando sentir. No lo resuelvas hoy. Solo
            escríbelo en tu bitácora para que deje de estar suelto.`,
  },
  {
    subject: "Dormir no es lo contrario de estar despierto",
    title: "Lo que pasa mientras duermes",
    idea: `Mientras duermes, el cerebro repasa el día y decide qué guardar y qué soltar.
           Por eso un problema se ve distinto por la mañana: no cambió el problema,
           cambió la persona que lo mira.`,
    gesto: `Esta noche, antes de dormir, escribe una línea sobre lo que quedó pendiente.
            Estás dándole material a ese proceso.`,
  },
  {
    subject: "El cuerpo lleva la cuenta",
    title: "Dónde vive lo que sientes",
    idea: `La ansiedad casi nunca aparece primero como pensamiento. Aparece como
           mandíbula apretada, hombros arriba, estómago cerrado. El cuerpo avisa antes
           de que la cabeza tenga la palabra.`,
    gesto: `Para un momento y recorre tu cuerpo de la cabeza a los pies. Donde encuentres
            tensión, quédate diez segundos sin arreglarla.`,
  },
  {
    subject: "Un límite no es un rechazo",
    title: "Decir que no también es cuidar",
    idea: `Quien nunca dice que no, termina diciendo que sí desde el resentimiento. El
           límite no aleja a la gente: define el terreno donde puedes seguir estando
           cerca sin desaparecer.`,
    gesto: `Identifica un "sí" que diste esta semana y que era un "no". No hay que
            deshacerlo. Solo reconocerlo.`,
  },
];

function renderValor(ctx: RenderCtx): RenderedMail {
  const v = VALOR[weekOfYear(ctx.day) % VALOR.length];
  const inner = `
    ${parrafo(`Hola ${esc(ctx.firstName)},`)}
    ${parrafo(v.idea)}
    <div style="margin-top:20px;padding:16px 18px;border-left:3px solid #5eead4;background:rgba(94,234,212,0.06);border-radius:0 12px 12px 0">
      <p style="color:#5eead4;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px">Hoy</p>
      <p style="color:#dbe6fb;font-size:14px;line-height:1.7;margin:0">${v.gesto}</p>
    </div>
    ${linkButton(`${APP_URL}/bitacora?utm=valor`, "Anotarlo en mi bitácora")}`;
  return { subject: v.subject, html: shell(v.title, inner, footer(ctx.unsubUrl)) };
}

/* ============================================================
   4. Pregunta para sentarse
   ============================================================ */

const PREGUNTAS = [
  "¿Qué estás cargando que no te pertenece?",
  "¿A quién le tienes que decir algo desde hace meses?",
  "¿Qué parte de tu vida elegiste y cuál solo aceptaste?",
  "Si nadie se enterara, ¿qué dejarías de hacer mañana?",
  "¿Cuándo fue la última vez que te sentiste en casa dentro de ti?",
  "¿De qué te estás protegiendo con la prisa?",
  "¿Qué le dirías hoy a la persona que fuiste hace cinco años?",
  "¿Qué cosa tuya has estado llamando defecto y era una forma de cuidarte?",
];

function renderPregunta(ctx: RenderCtx): RenderedMail {
  const q = PREGUNTAS[Math.floor(weekOfYear(ctx.day) / 2) % PREGUNTAS.length];
  const inner = `
    ${parrafo(`${esc(ctx.firstName)}, una sola pregunta. Nada más.`)}
    <p style="color:#e8eefb;font-size:21px;line-height:1.5;margin:26px 0;font-weight:600">${q}</p>
    ${parrafo("No hace falta que la respondas hoy. A veces basta con cargarla un rato.")}
    ${linkButton(`${APP_URL}/bitacora?utm=pregunta`, "Responder escribiendo")}`;
  return {
    subject: q,
    html: shell("Una pregunta para sentarse", inner, footer(ctx.unsubUrl)),
  };
}

export const RENDERERS: Record<string, (ctx: RenderCtx) => RenderedMail> = {
  bitacora: renderBitacora,
  poema: renderPoema,
  valor: renderValor,
  pregunta: renderPregunta,
};
