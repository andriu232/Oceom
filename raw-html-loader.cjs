/**
 * Loader mínimo para los imports `*.html?raw` de src/shaders/globe/GlobeCollection.tsx
 * (Turbopack no trae un tipo de módulo para .html). Devuelve el HTML como string,
 * igual que el `?raw` de Vite que asume la fuente registrada de ThreeUI.
 */
module.exports = function rawHtmlLoader(source) {
  return `export default ${JSON.stringify(source)};`;
};
