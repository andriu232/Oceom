/* ============================================================
   El selector emocional (§8 del manual) y las zonas del cuerpo.

   El manual lista 17 emociones y luego pregunta dónde se sienten, para armar
   el vínculo EMOCIÓN → CUERPO. Varias de esas emociones no tienen todavía un
   nodo propio en la red —sobre todo las agradables, que nadie ha pedido
   explorar— así que cada una declara a qué nodo lleva, o `null` si no lleva a
   ninguno. Cuando no hay nodo de emoción, la exploración se centra en la zona
   del cuerpo que la persona señaló; y si tampoco hay, acompaña la IA.
   ============================================================ */

export interface Emocion {
  label: string;
  /** Nodo de la red al que lleva, si existe. */
  slug: string | null;
  /** Las que el manual agrupa como agradables se pintan aparte. */
  agradable?: boolean;
}

export const EMOCIONES: Emocion[] = [
  { label: "Miedo", slug: "miedo" },
  { label: "Tristeza", slug: "tristeza-duelo" },
  { label: "Rabia", slug: "rabia" },
  { label: "Culpa", slug: "culpa" },
  { label: "Vergüenza", slug: null },
  { label: "Ansiedad", slug: "ansiedad" },
  { label: "Soledad", slug: "abandono" },
  { label: "Frustración", slug: "rabia" },
  { label: "Rechazo", slug: "abandono" },
  { label: "Abandono", slug: "abandono" },
  { label: "Impotencia", slug: null },
  { label: "No merecimiento", slug: "merecimiento" },
  { label: "Confusión", slug: null },
  { label: "Alegría", slug: null, agradable: true },
  { label: "Amor", slug: null, agradable: true },
  { label: "Calma", slug: null, agradable: true },
  { label: "Esperanza", slug: null, agradable: true },
];

export interface ZonaCuerpo {
  label: string;
  slug: string | null;
}

/** Las zonas en las palabras con que la gente señala su cuerpo, no en
 *  vocabulario anatómico. */
export const ZONAS: ZonaCuerpo[] = [
  { label: "Cabeza", slug: "migrana" },
  { label: "Garganta", slug: "garganta-expresion" },
  { label: "Cuello y hombros", slug: "cuello-hombros" },
  { label: "Pecho", slug: "pecho-corazon" },
  { label: "Respiración", slug: "respiracion-ansiedad" },
  { label: "Estómago", slug: "digestivo-estomago" },
  { label: "Espalda", slug: "dolor-espalda" },
  { label: "Vientre y pelvis", slug: "ciclo-hormonal" },
  { label: "Piernas y rodillas", slug: "rodillas" },
  { label: "Piel", slug: "piel" },
  { label: "En todo el cuerpo", slug: null },
  { label: "Todavía no sé", slug: null },
];
