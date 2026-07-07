/** Las cinco dimensiones del Mapa de Visión. Dato serializable (server-safe):
 *  la página server y el tablero cliente comparten esta definición. Los íconos
 *  y las clases de color se resuelven en el cliente por `iconKey` / `color`. */

export type VisionColor = "violet" | "blue" | "magenta" | "gold" | "turquoise";

export interface VisionAreaDef {
  key: string;
  label: string;
  iconKey: string;
  color: VisionColor;
  desc: string;
  visionPlaceholder: string;
  affirmationPlaceholder: string;
}

export const VISION_AREAS: VisionAreaDef[] = [
  {
    key: "espiritual",
    label: "Meta Espiritual",
    iconKey: "sparkles",
    color: "violet",
    desc: "Reconectar con tu esencia y expandir tu consciencia para vivir desde tu propósito.",
    visionPlaceholder: "¿Cómo se ve tu vida espiritual plena? Describe la versión de ti conectada con su esencia.",
    affirmationPlaceholder: "Ej. Vivo en paz y en sintonía con mi propósito.",
  },
  {
    key: "mental",
    label: "Meta Mental",
    iconKey: "brain",
    color: "blue",
    desc: "Expandir tu mente, tu aprendizaje y una mentalidad consciente y creativa.",
    visionPlaceholder: "¿Qué dominas, qué aprendes, cómo piensas en tu mejor versión mental?",
    affirmationPlaceholder: "Ej. Mi mente es clara, enfocada y creativa.",
  },
  {
    key: "emocional",
    label: "Meta Emocional",
    iconKey: "heart",
    color: "magenta",
    desc: "Comprender y transformar tus emociones para vivir con equilibrio y amor propio.",
    visionPlaceholder: "¿Cómo te relacionas con tus emociones y con los demás desde el equilibrio?",
    affirmationPlaceholder: "Ej. Me amo, me acepto y regulo mis emociones con calma.",
  },
  {
    key: "financiera",
    label: "Meta Financiera",
    iconKey: "gem",
    color: "gold",
    desc: "Crear abundancia y libertad alineada a tu propósito, con valor e impacto consciente.",
    visionPlaceholder: "¿Cómo se ve tu abundancia? Ingresos, libertad, impacto que quieres generar.",
    affirmationPlaceholder: "Ej. El dinero fluye hacia mí de formas alineadas y expansivas.",
  },
  {
    key: "fisica",
    label: "Meta Física",
    iconKey: "activity",
    color: "turquoise",
    desc: "Fortalecer tu cuerpo, tu energía y tus hábitos para vivir con vitalidad y salud.",
    visionPlaceholder: "¿Cómo se ve y se siente tu cuerpo en su máxima vitalidad?",
    affirmationPlaceholder: "Ej. Mi cuerpo está fuerte, sano y lleno de energía.",
  },
];

export const VISION_AREA_KEYS = VISION_AREAS.map((a) => a.key);

export interface VisionGoal {
  text: string;
  done: boolean;
}
