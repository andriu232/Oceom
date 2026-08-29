import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // El bridge de Hermes es un servicio Node aparte, con su propio ciclo
    // de vida: no lo cubre la config de Next.
    "hermes-bridge/**",
    // Fuente registrada de ThreeUI (bundle energy-orb), copiada literalmente y
    // verificada por SHA-256: no se reformatea ni se corrige, así que tampoco
    // se linta.
    "src/shaders/**",
  ]),
]);

export default eslintConfig;
