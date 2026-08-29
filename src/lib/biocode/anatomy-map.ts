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

  // Espalda y columna
  skeleton: "dolor-espalda",
  "quadratus-lumborum": "dolor-espalda",
  "skeletal-system": "dolor-espalda",

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
];

/** Sistema del atlas → nodo, como último recurso. */
const SYSTEM_TO_NODE: Record<string, string> = {
  digestive: "digestivo-estomago",
  nervous: "migrana",
  skeletal: "dolor-espalda",
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
