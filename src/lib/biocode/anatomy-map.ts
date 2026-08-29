/* ============================================================
   Puente entre el atlas anatómico (Vanatome / Z-Anatomy) y la red BIOCODE.

   El atlas trae 807 estructuras; la red de conocimiento cubre unas pocas. Sin
   esta capa, tocar el cuerpo abriría estructuras sobre las que BIOCODE no
   tiene nada que decir. Aquí se declara qué se puede tocar y hacia dónde
   lleva; el resto queda atenuado y sin efecto.

   Resolución en cascada: estructura exacta → órgano padre → sistema.
   Cuando la mentora amplíe la red, basta agregar entradas a este mapa.
   ============================================================ */

/** Estructura del atlas → slug de nodo BIOCODE. */
export const STRUCTURE_TO_NODE: Record<string, string> = {
  // Cabeza
  cerebrum: "migrana",
  brainstem: "migrana",
  cerebellum: "migrana",
  "nervous-system": "migrana",

  // Cuello y hombros
  "neck-muscles": "cuello-hombros",
  "rotator-cuff-muscles": "cuello-hombros",
  "deltoid-muscles": "cuello-hombros",

  // Garganta. El atlas no trae laringe ni faringe como estructuras propias:
  // lo que hay en esa zona es la tiroides, las amígdalas y el grupo de
  // músculos hioideos, así que la garganta se toca por ahí.
  "thyroid-gland": "garganta-expresion",
  "parathyroid-glands": "garganta-expresion",
  "lymphoid-organs-palatine-tonsil-left": "garganta-expresion",
  "lymphoid-organs-palatine-tonsil-right": "garganta-expresion",
  "neck-muscles-sternohyoid-muscle-left": "garganta-expresion",
  "neck-muscles-sternohyoid-muscle-right": "garganta-expresion",
  "neck-muscles-thyrohyoid-muscle-left": "garganta-expresion",
  "neck-muscles-thyrohyoid-muscle-right": "garganta-expresion",
  "neck-muscles-mylohyoid-muscle-left": "garganta-expresion",
  "neck-muscles-mylohyoid-muscle-right": "garganta-expresion",
  "neck-muscles-geniohyoid-muscle-left": "garganta-expresion",
  "neck-muscles-geniohyoid-muscle-right": "garganta-expresion",

  // Pecho: corazón y pulmones
  heart: "pecho-corazon",
  "cardiovascular-system": "pecho-corazon",
  "cardiac-internal-structures": "pecho-corazon",
  "pulmonary-arteries": "pecho-corazon",
  "pulmonary-veins": "pecho-corazon",
  lungs: "respiracion-ansiedad",
  trachea: "respiracion-ansiedad",
  "respiratory-system": "respiracion-ansiedad",

  // Riñones y vejiga
  kidneys: "rinones-vejiga",
  bladder: "rinones-vejiga",
  "urinary-system": "rinones-vejiga",

  // Espalda y columna
  skeleton: "dolor-espalda",
  "skeletal-system": "dolor-espalda",

  // Pared abdominal: es lo que se toca al pulsar el vientre en la vista
  // exterior, mucho antes que el estómago. Lleva a la zona digestiva.
  "rectus-abdominis": "digestivo-estomago",
  "linea-alba": "digestivo-estomago",
  "external-abdominal-obliques": "digestivo-estomago",
  "internal-abdominal-obliques": "digestivo-estomago",
  "transversus-abdominis": "digestivo-estomago",
  "pyramidalis-muscles": "digestivo-estomago",
  "inguinal-ligaments": "digestivo-estomago",

  // Cara y cabeza en la vista exterior
  "facial-expression-muscles": "migrana",

  // Zona lumbar y glúteos: lo que se toca al pulsar la espalda baja
  "quadratus-lumborum": "dolor-espalda",
  "deep-gluteal-muscles": "dolor-espalda",
  "superficial-gluteal-muscles": "dolor-espalda",

  // Digestivo
  stomach: "digestivo-estomago",
  "small-intestine": "digestivo-estomago",
  "large-intestine": "digestivo-estomago",
  oesophagus: "digestivo-estomago",
  liver: "digestivo-estomago",
  pancreas: "digestivo-estomago",
  gallbladder: "digestivo-estomago",
  "digestive-system": "digestivo-estomago",
};

/** Prefijos de id de estructura → nodo, para las "partes" hijas del atlas
 *  (p. ej. `skeleton-vertebra-l4` cae en el nodo de espalda). El orden importa:
 *  gana el prefijo más largo. */
const PREFIX_TO_NODE: Array<[string, string]> = [
  ["skeleton-vertebra-c", "cuello-hombros"], // cervicales → cuello
  ["skeleton-vertebra", "dolor-espalda"],
  ["skeleton-sacrum", "dolor-espalda"],
  ["neck-muscles-", "cuello-hombros"],
  ["rotator-cuff-muscles-", "cuello-hombros"],
  ["stomach-", "digestivo-estomago"],
  ["small-intestine-", "digestivo-estomago"],
  ["large-intestine-", "digestivo-estomago"],
  ["liver-", "digestivo-estomago"],
  ["cerebrum-", "migrana"],
  ["brainstem-", "migrana"],
  ["cerebellum-", "migrana"],
  ["facial-expression-muscles-", "migrana"],
  ["rectus-abdominis-", "digestivo-estomago"],
  ["external-abdominal-obliques-", "digestivo-estomago"],
  ["internal-abdominal-obliques-", "digestivo-estomago"],
  ["transversus-abdominis-", "digestivo-estomago"],
  ["deep-gluteal-muscles-", "dolor-espalda"],
  ["superficial-gluteal-muscles-", "dolor-espalda"],
  ["deltoid-muscles-", "cuello-hombros"],
  ["heart-", "pecho-corazon"],
  ["cardiac-internal-structures-", "pecho-corazon"],
  ["pulmonary-arteries-", "pecho-corazon"],
  ["pulmonary-veins-", "pecho-corazon"],
  ["lungs-", "respiracion-ansiedad"],
  ["kidneys-", "rinones-vejiga"],
  // Rodilla: el atlas no tiene una estructura "rodilla", solo los huesos que
  // la forman. Rótula, fémur y tibia llevan al mismo nodo.
  ["appendicular-skeleton-patella-", "rodillas"],
  ["appendicular-skeleton-femur-", "rodillas"],
  ["appendicular-skeleton-tibia-", "rodillas"],
  ["parathyroid-glands-", "garganta-expresion"],
];

/** Sistema del atlas → nodo, como último recurso. */
const SYSTEM_TO_NODE: Record<string, string> = {
  digestive: "digestivo-estomago",
  nervous: "migrana",
  skeletal: "dolor-espalda",
  cardiovascular: "pecho-corazon",
  respiratory: "respiracion-ansiedad",
  urinary: "rinones-vejiga",
};

/** Resuelve a qué nodo de BIOCODE lleva una estructura del atlas. */
export function resolveNodeSlug(
  structureId: string | null,
  system?: string | null,
): string | null {
  if (!structureId) return null;
  const exact = STRUCTURE_TO_NODE[structureId];
  if (exact) return exact;

  let best: [string, string] | null = null;
  for (const entry of PREFIX_TO_NODE) {
    if (structureId.startsWith(entry[0]) && (!best || entry[0].length > best[0].length)) {
      best = entry;
    }
  }
  if (best) return best[1];

  return (system && SYSTEM_TO_NODE[system]) || null;
}

/** Ids que el visor deja seleccionar: los que llevan a algún sitio. */
export const SELECTABLE_IDS = Object.keys(STRUCTURE_TO_NODE);

/** Nombre en español del nodo al que lleva cada zona, para poder decirle a la
 *  persona hacia dónde va ANTES de que haga clic. El atlas nombra sus 807
 *  estructuras en inglés y en jerga anatómica ("Eighth rib.l"): ese nombre
 *  sirve de precisión, pero no de invitación. */
export const NODE_LABELS: Record<string, string> = {
  migrana: "Migraña",
  "dolor-espalda": "Dolor de espalda",
  "digestivo-estomago": "Estómago y digestión",
  "cuello-hombros": "Cuello y hombros",
  insomnio: "Dificultad para dormir",
  "garganta-expresion": "Garganta y expresión",
  "pecho-corazon": "Corazón y pecho",
  "respiracion-ansiedad": "Respiración corta y falta de aire",
  rodillas: "Rodillas",
  "rinones-vejiga": "Riñones y vejiga",
};

/** Limpia el nombre crudo del atlas: los sufijos `.l` / `.r` marcan lado y los
 *  paréntesis envuelven nombres alternativos. */
export function prettyStructureName(name: string): string {
  return name
    .replace(/\.l$/i, " (izq.)")
    .replace(/\.r$/i, " (der.)")
    .replace(/^\((.+)\)$/, "$1")
    .replace(/\*/g, "")
    .trim();
}

/** Texto que abre la exploración cuando se toca una zona del cuerpo. */
export function openingMessage(structureName: string, nodeSlug: string | null): string {
  return nodeSlug
    ? `Quiero explorar esta zona de mi cuerpo: ${structureName}.`
    : `Quiero explorar esta zona de mi cuerpo: ${structureName}. Aún no tienes material específico sobre ella, así que acompáñame con preguntas.`;
}

/** Crédito obligatorio por la licencia del atlas (CC BY-SA 4.0). */
export const ATLAS_ATTRIBUTION = {
  text: "Modelo anatómico: Z-Anatomy (Gauthier Kervyn, Marcin Zielinski y colaboradores), adaptado por Vanatome. Licencia CC BY-SA 4.0.",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  sourceUrl: "https://github.com/Z-Anatomy/Models",
};
