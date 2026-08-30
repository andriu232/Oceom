/* ============================================================
   Las puertas guiadas del manual: creencias (§9), patrones (§10),
   merecimiento (§12) y sacrificio → propósito (§13).

   Todas funcionan igual: una pregunta, las opciones literales del documento y
   un campo para escribir libremente. Cada opción declara a qué nodo lleva; lo
   que se escribe a mano se busca en la red. Lo que la persona respondió se
   guarda como semilla de la exploración, así la conversación arranca sabiendo
   por dónde entró y la ficha no pierde ese dato.
   ============================================================ */

export interface OpcionPuerta {
  label: string;
  /** Nodo al que lleva, o null para buscarlo por texto. */
  slug: string | null;
}

export interface PuertaGuiada {
  key: string;
  titulo: string;
  pregunta: string;
  ayuda?: string;
  opciones: OpcionPuerta[];
  /** Texto del campo libre. Si falta, la puerta es solo de opciones. */
  placeholder?: string;
  /** Cómo se le cuenta a la IA por dónde entró la persona. */
  arranque: (respuesta: string) => string;
}

export const PUERTAS: Record<string, PuertaGuiada> = {
  /* §9 — Mapa de creencias */
  creencia: {
    key: "creencia",
    titulo: "Mapa de creencias",
    pregunta: "¿Qué pensamiento se repite?",
    ayuda: "Escríbelo como te suena por dentro, con tus palabras.",
    opciones: [
      { label: "Tengo que demostrar que valgo", slug: "valia" },
      { label: "No merezco recibir", slug: "merecimiento" },
      { label: "Debo poder con todo", slug: "sobreexigencia" },
      { label: "Si digo que no, dejarán de quererme", slug: "limites" },
      { label: "No puedo confiar", slug: "miedo" },
      { label: "Tengo que sacrificarme", slug: "merecimiento" },
    ],
    placeholder: "Escribe el pensamiento que se te repite…",
    arranque: (r) => `Este pensamiento se me repite: "${r}". Quiero explorarlo.`,
  },

  /* §10 — Mapa de patrones */
  patron: {
    key: "patron",
    titulo: "Mapa de patrones",
    pregunta: "¿Qué se repite en tu vida?",
    ayuda: "Elige un área o cuéntame la situación que vuelve una y otra vez.",
    opciones: [
      { label: "Parejas", slug: "pareja" },
      { label: "Dinero", slug: "dinero" },
      { label: "Trabajo", slug: "trabajo-agotamiento" },
      { label: "Familia", slug: "cuidar-a-todos" },
      { label: "Autoestima", slug: "valia" },
      { label: "Merecimiento", slug: "merecimiento" },
      { label: "Abandono", slug: "abandono" },
      { label: "Conflictos", slug: "rabia" },
      { label: "Éxito", slug: "valia" },
      { label: "Salud", slug: "fatiga" },
      { label: "Autosabotaje", slug: "valia" },
    ],
    placeholder: "O escríbelo: “Siempre termino con personas que no están disponibles”…",
    arranque: (r) => `Esto se repite en mi vida: "${r}".`,
  },

  /* §12 — Mapa del merecimiento */
  merecimiento: {
    key: "merecimiento",
    titulo: "Merecimiento",
    pregunta: "¿Qué te cuesta recibir?",
    ayuda: "Puedes elegir más de una vez; empieza por la que más te pese hoy.",
    opciones: [
      { label: "Amor", slug: "merecimiento" },
      { label: "Dinero", slug: "dinero" },
      { label: "Ayuda", slug: "merecimiento" },
      { label: "Reconocimiento", slug: "valia" },
      { label: "Descanso", slug: "sobreexigencia" },
      { label: "Placer", slug: "merecimiento" },
      { label: "Éxito", slug: "valia" },
      { label: "Oportunidades", slug: "merecimiento" },
    ],
    arranque: (r) =>
      `Lo que más me cuesta recibir es: ${r.toLowerCase()}. Acompáñame a mirar qué creencia hay debajo, qué emoción aparece, qué hago con eso y a dónde me lleva.`,
  },

  /* §13 — Sacrificio → propósito */
  proposito: {
    key: "proposito",
    titulo: "Sacrificio o propósito",
    pregunta: "¿Desde dónde estás viviendo?",
    ayuda:
      "El método distingue dos motores: sufrir para merecer, o construir desde el sentido y el disfrute.",
    opciones: [
      { label: "Desde el sacrificio", slug: "merecimiento" },
      { label: "Desde el propósito", slug: "valia" },
    ],
    arranque: (r) =>
      r.toLowerCase().includes("sacrificio")
        ? "Siento que estoy viviendo desde el sacrificio. Quiero mirar la obligación, la culpa, la exigencia, el miedo y la necesidad de demostrar que hay debajo — y después preguntarme cómo sería vivir desde el propósito."
        : "Siento que estoy viviendo desde el propósito. Quiero mirar qué lo sostiene y qué se me sigue colando del sacrificio.",
  },
};
