/* ============================================================
   Los textos con los que HERMES inicia conversación.

   Por el bridge de Baileys no existen las plantillas de Meta: el texto se
   compone aquí y se manda tal cual. Por Cloud API estos mismos textos tienen
   que estar registrados como plantilla aprobada (ver hermes-setup-meta.md);
   se dejan aquí para que la copia viva en un solo sitio.
   ============================================================ */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://oceom.33vertebras.com";

/** Recordatorio diario. Varía por día para que no se lea como un robot:
 *  recibir literalmente el mismo mensaje 30 días seguidos hace que la gente
 *  deje de verlo. El índice lo decide el día del año, no el azar, para que
 *  sea reproducible y todo el grupo reciba el mismo. */
const RECORDATORIOS = [
  (n: string) =>
    `Hola ${n}, soy Hermes 🌊 ¿Cómo estuvo tu día por dentro?\n\nCuéntame por aquí lo que quieras y lo guardo en tu Bitácora Interior. Una frase basta.`,
  (n: string) =>
    `${n}, un momento para ti antes de cerrar el día.\n\n¿Qué emoción se quedó contigo hoy? Escríbemela y la dejo en tu bitácora.`,
  (n: string) =>
    `Hola ${n} 🌙 ¿Hubo algo hoy que te movió por dentro, aunque fuera pequeño?\n\nSi quieres contármelo, lo guardo en tu Bitácora Interior.`,
  (n: string) =>
    `${n}, aquí estoy.\n\n¿Cómo anda tu océano interior hoy? Escríbeme lo que sientas, sin ordenarlo. Yo lo guardo.`,
  (n: string) =>
    `Hola ${n}. ¿Qué te llevas de hoy?\n\nUna frase, una palabra, lo que salga. Queda en tu bitácora de OCEOM.`,
];

export function reminderText(firstName: string, day = new Date()): string {
  // Día del año → mismo mensaje para todo el grupo ese día, y rota solo.
  const start = Date.UTC(day.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((day.getTime() - start) / 86_400_000);
  return RECORDATORIOS[dayOfYear % RECORDATORIOS.length](firstName);
}

/** Código de vinculación. */
export function verificationText(code: string): string {
  return `Tu código para vincular WhatsApp con OCEOM es ${code}\n\nCaduca en 10 minutos. Si no lo pediste tú, ignora este mensaje.`;
}

/** Primer contacto tras vincular: explica cómo se usa. */
export function welcomeText(firstName: string): string {
  return `Listo, ${firstName} 🌊 Ya quedamos conectados.\n\nDesde ahora puedes escribirme cuando quieras cómo te sientes o qué te pasó, y lo guardo en tu Bitácora Interior de OCEOM. También te recordaré hacerlo.\n\nEscribe AYUDA si quieres ver qué más puedo hacer.\n\nTu bitácora está en ${SITE}/bitacora`;
}
