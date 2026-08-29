/* ============================================================
   Banderas rojas de MAPA BIOCODE.

   Se evalúa ANTES de llamar al modelo. Si el mensaje describe una posible
   urgencia, la respuesta de seguridad no se delega a la IA: se entrega escrita
   y se detiene la exploración emocional. Prevalece siempre la seguridad —
   nunca se retrasa atención profesional por hacer un ejercicio emocional.

   Es un primer filtro deliberadamente conservador: prefiere avisar de más.
   El prompt del modelo repite estas reglas para lo que el filtro no atrape.
   ============================================================ */

export type RedFlag = "crisis" | "medica";

interface FlagRule {
  kind: RedFlag;
  patterns: RegExp[];
}

/* Giros del habla cotidiana que usan el verbo morir sin ninguna intención
   literal ("me quiero morir de la risa"). Se recortan del texto antes de
   evaluar: así un chiste no dispara la respuesta de crisis, pero si en la
   MISMA frase hay una señal real, esa sí se detecta.
   Deliberadamente NO se incluyen pena, tristeza ni dolor: ahí preferimos
   equivocarnos avisando de más. */
const HYPERBOLE =
  /\b(?:morir(?:me|se)?|matarme)\s+de(?:l|\s+la|\s+el|\s+los)?\s+(?:risa|amor|hambre|sue\u00f1o|ganas|fr\u00edo|calor|aburrimiento|verg\u00fcenza|antojo|envidia|emoci\u00f3n|ternura|curiosidad|vieja|viejita|viejito|viejo|anciana|vejez)\b/giu;

const RULES: FlagRule[] = [
  {
    // Riesgo vital para sí misma o para otros.
    kind: "crisis",
    patterns: [
      /\bme\s+quiero\s+(morir|matar)\b/i,
      /\bquiero\s+(morir(me)?|matarme|desaparecer para siempre)\b/i,
      /\bganas\s+de\s+(morir(me)?|matarme)\b/i,
      /\b(?:suicid\p{L}*|quitarme la vida|acabar con mi vida|terminar con mi vida)\b/iu,
      /\bno\s+quiero\s+(seguir\s+)?vivir\b/i,
      /\bmejor\s+(?:si\s+)?(?:no\s+)?(?:estuviera|estoy)\s+muert\p{L}*/iu,
      /\b(cortarme|hacerme daño|autolesion\w*|lastimarme)\b/i,
      /\b(hacerle daño a|matar a)\s+\w+/i,
    ],
  },
  {
    // Cuadros que piden valoración médica ahora, no exploración simbólica.
    kind: "medica",
    patterns: [
      /\bdolor\s+(muy\s+)?(fuerte|intenso|opresivo|aplastante)\s+(en\s+)?(el\s+)?pecho\b/i,
      /\b(me\s+)?aprieta\s+el\s+pecho\b.*\b(brazo|mandíbula|sudor)\b/i,
      /\bno\s+puedo\s+respirar\b/i,
      /\b(dificultad|falta)\s+(para\s+|de\s+)respirar\b/i,
      /\bme\s+(?:desmay|desvanec)\p{L}*/iu,
      /\bperd[íi]\s+(el\s+)?conocimiento\b/i,
      /\b(no\s+siento|se\s+me\s+durmió|perdí\s+fuerza\s+en)\s+(la\s+mitad|medio\s+cuerpo|un\s+lado)\b/i,
      /\bse\s+me\s+(torció|desvió)\s+la\s+(cara|boca)\b/i,
      /\bno\s+puedo\s+hablar\b.*\b(de repente|de un momento)\b/i,
      /\bsangr\p{L}*\s+(?:mucho|abundante|sin parar|que no para)\b/iu,
      /\bvomit\p{L}*\s+sangre\b/iu,
      /\bconvulsi\p{L}n\p{L}*|convulsion\p{L}*/iu,
      /\bfiebre\s+(muy\s+)?alta\b.*\b(rigidez|cuello|manchas)\b/i,
    ],
  },
];

/** Detecta la bandera roja más grave presente en el texto. */
export function detectRedFlag(text: string): RedFlag | null {
  // Quita los giros hiperbólicos y evalúa lo que queda.
  const t = text.normalize("NFC").replace(HYPERBOLE, " ");
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(t))) return rule.kind;
  }
  return null;
}

const CRISIS_RESPONSE = `Antes que nada quiero decirte que lo que estás sintiendo importa, y que no tienes que sostenerlo en silencio. Que ese dolor sea tan grande que aparezcan estos pensamientos no te hace débil ni te hace estar mal: te hace estar cargando algo que pesa demasiado para llevarlo a solas.

Y aquí necesito ser honesta contigo: esto es más de lo que yo puedo acompañar. Ahora mismo lo más importante no es explorar, es que estés a salvo y que haya una persona contigo.

Por favor busca ayuda humana ahora. Llama a la línea de emergencia de tu país o a la línea de atención en salud mental de tu ciudad, o escríbele o llama a alguien de confianza y dile cómo te sientes, aunque te cueste. Si sientes que el riesgo es inmediato, ve a un servicio de urgencias.

Si estás en Colombia, puedes marcar la Línea 106 o el 123.

No voy a seguir con la exploración mientras estés así. Lo que quiero es que estés acompañada. Cuando ya tengas a alguien contigo y te sientas más en tierra, aquí estaré para caminar contigo lo que quieras mirar.`;

const MEDICA_RESPONSE = `Voy a detener aquí la exploración, porque lo que me describes necesita una valoración médica y eso va primero.

Nada de lo que podamos mirar juntas sobre emociones o patrones sustituye a que un profesional revise lo que está pasando en tu cuerpo ahora mismo. Por favor busca atención médica ya: llama a la línea de emergencia de tu país o acude a un servicio de urgencias. Si estás en Colombia, puedes marcar el 123.

No es alarmismo ni es un diagnóstico: es que con estos síntomas lo responsable es descartar primero.

Cuando ya te hayan revisado y estés tranquila, si quieres volvemos y exploramos con calma lo que estés viviendo alrededor de esto. Aquí voy a estar.`;

export function redFlagResponse(kind: RedFlag): string {
  return kind === "crisis" ? CRISIS_RESPONSE : MEDICA_RESPONSE;
}
