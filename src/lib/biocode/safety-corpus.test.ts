import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { detectRedFlag } from "./safety.ts";

/* ============================================================
   El corpus de seguridad, congelado como prueba.

   `frases-seguridad.json` son 275 frases escritas como escribe la gente en un
   chat: 175 urgencias reales (7 tipos) y 100 mensajes cotidianos que NO deben
   disparar la alarma. Se generó a propósito ANTES de reescribir el detector, y
   la primera medición fue demoledora: la versión que había detectaba 12 de
   175, porque sus patrones estaban en registro médico ("dolor fuerte en el
   pecho") y nadie escribe así.

   Los mínimos de abajo son el estado alcanzado, no una aspiración: si alguien
   toca `safety.ts` y la cobertura baja, esta prueba falla. Los dos únicos
   falsos positivos aceptados son hipérboles con "me quiero morir", donde la
   sesión anterior decidió a conciencia equivocarse avisando de más.

   Lo que NO se detecta a propósito: tristeza, duelo y anhedonia. La respuesta
   de crisis DETIENE la exploración, y hacerle eso a alguien en duelo le cierra
   la puerta justo cuando vino a que la acompañaran.
   ============================================================ */

interface Grupo {
  tipo: string;
  frases: string[];
}
type Corpus = { urgentes: Grupo[]; normales: Grupo[] };
const leer = (archivo: string) =>
  JSON.parse(fs.readFileSync(new URL(archivo, import.meta.url), "utf8")) as Corpus;

const corpus = leer("./frases-seguridad.json");

/* El segundo corpus se generó DESPUÉS, con otros ángulos (México, Argentina,
   sin tildes, mensajes de dos palabras, urgencias enterradas en un mensaje
   largo) para medir sin el sesgo de haber ajustado los patrones al primero.
   La primera medición contra él fue 45 de 130: eso es lo que se veía como
   97% en el corpus de casa. Los mínimos de abajo son más bajos a propósito —
   son los honestos. */
const holdout = leer("./frases-seguridad-holdout.json");

/** Mínimo de frases que cada tipo de urgencia debe seguir detectando. */
const MINIMOS: Record<string, number> = {
  pecho: 24,
  respirar: 25,
  conciencia: 25,
  neurologico: 25,
  sangrado: 24,
  // Las 3 que faltan son deliberadas: "no le encuentro sentido a nada" es
  // anhedonia y se acompaña, no se corta.
  autolesion: 22,
  aguda: 24,
};

for (const grupo of corpus.urgentes) {
  test(`urgencias · ${grupo.tipo}: se detectan al menos ${MINIMOS[grupo.tipo]} de ${grupo.frases.length}`, () => {
    const detectadas = grupo.frases.filter((f) => detectRedFlag(f) !== null);
    const perdidas = grupo.frases.filter((f) => detectRedFlag(f) === null);
    assert.ok(
      detectadas.length >= MINIMOS[grupo.tipo],
      `solo ${detectadas.length}/${grupo.frases.length}. Se escapan:\n  ${perdidas.join("\n  ")}`,
    );
  });
}

/** Falsas alarmas toleradas por grupo. Solo la hipérbole tiene cupo. */
const TOLERANCIA: Record<string, number> = {
  hiperbole: 2,
  tristeza: 0,
  molestias: 0,
  metafora: 0,
};

for (const grupo of corpus.normales) {
  test(`cotidiano · ${grupo.tipo}: como mucho ${TOLERANCIA[grupo.tipo]} falsas alarmas`, () => {
    const disparan = grupo.frases.filter((f) => detectRedFlag(f) !== null);
    assert.ok(
      disparan.length <= TOLERANCIA[grupo.tipo],
      `${disparan.length} falsas alarmas:\n  ${disparan.map((f) => `${f} → ${detectRedFlag(f)}`).join("\n  ")}`,
    );
  });
}

test("el duelo se acompaña, no se corta", () => {
  // Estas dos frases son casi idénticas y tienen que resolverse distinto:
  // la primera es duelo, la segunda es riesgo.
  assert.equal(detectRedFlag("no tengo ganas de nada, ni de bañarme"), null);
  assert.equal(detectRedFlag("para qué sigo, si igual todo se repite"), "crisis");
});

test("el cuerpo como metáfora no dispara, el cuerpo en urgencia sí", () => {
  assert.equal(detectRedFlag("me falta el aire de la ansiedad, respiro y no me llena"), null);
  assert.equal(detectRedFlag("no me entra el aire"), "medica");
  assert.equal(detectRedFlag("me duele el pecho de tanto llorar"), null);
  assert.equal(detectRedFlag("me duele el pecho"), "medica");
});

/* ── Corpus independiente ── */

const MINIMOS_HOLDOUT: Record<string, number> = {
  mexico: 22,
  argentina: 16,
  sin_tildes: 20,
  cortos: 23,
  // Los mensajes largos que mezclan duelo con una urgencia enterrada al final
  // siguen siendo lo más difícil, y es donde más se apoya el prompt del modelo.
  mezclados: 16,
};

for (const grupo of holdout.urgentes) {
  test(`hold-out · ${grupo.tipo}: al menos ${MINIMOS_HOLDOUT[grupo.tipo]} de ${grupo.frases.length}`, () => {
    const detectadas = grupo.frases.filter((f) => detectRedFlag(f) !== null);
    assert.ok(
      detectadas.length >= MINIMOS_HOLDOUT[grupo.tipo],
      `solo ${detectadas.length}/${grupo.frases.length}`,
    );
  });
}

test("hold-out · ninguna falsa alarma en las trampas", () => {
  const disparan = holdout.normales
    .flatMap((g) => g.frases)
    .filter((f) => detectRedFlag(f) !== null);
  assert.deepEqual(disparan, [], "el corpus independiente no debe disparar ninguna alarma");
});
