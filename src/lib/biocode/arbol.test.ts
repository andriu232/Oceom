import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarCoincidencias, type Nivel, type PersonaArbol } from "./arbol.ts";

/* ============================================================
   Pruebas de la detección de coincidencias del árbol (§15).

   Se prueba sobre todo lo que NO debe detectar. Una coincidencia de más en
   esta pantalla no es un error cosmético: es sugerirle a alguien un patrón
   familiar que no existe, sobre gente de su familia. El manual pide lenguaje
   prudente; esto es la otra mitad de esa prudencia.
   ============================================================ */

let n = 0;
function persona(nivel: Nivel, extra: Partial<PersonaArbol> = {}): PersonaArbol {
  n += 1;
  return {
    id: `p${n}`,
    nivel,
    parentesco: null,
    nombre: null,
    nacimiento: null,
    fallecimiento: null,
    profesion: null,
    economia: null,
    enfermedades: [],
    acontecimientos: [],
    separacion: false,
    migracion: false,
    perdida: false,
    conflicto: false,
    notas: null,
    ...extra,
  };
}

const tipos = (ps: PersonaArbol[]) => detectarCoincidencias(ps).map((c) => c.tipo);

test("un árbol vacío o de una sola persona no arroja coincidencias", () => {
  assert.deepEqual(detectarCoincidencias([]), []);
  assert.deepEqual(
    detectarCoincidencias([
      persona("yo", { nombre: "Valeria", separacion: true, enfermedades: ["asma"] }),
    ]),
    [],
  );
});

test("un dato repetido DENTRO de una misma persona no es coincidencia", () => {
  const sola = persona("yo", { enfermedades: ["Asma", "asma", "ASMA"] });
  assert.deepEqual(detectarCoincidencias([sola]), []);
});

test("las separaciones de dos personas de la MISMA generación no son un patrón", () => {
  const mismos = [
    persona("padres", { nombre: "Ana", separacion: true }),
    persona("padres", { nombre: "Luis", separacion: true }),
  ];
  assert.ok(!tipos(mismos).includes("separacion"));
});

test("las separaciones en generaciones distintas sí se observan", () => {
  const cruzadas = [
    persona("padres", { nombre: "Ana", separacion: true }),
    persona("abuelos", { nombre: "Rosa", separacion: true }),
  ];
  const c = detectarCoincidencias(cruzadas).find((x) => x.tipo === "separacion");
  assert.ok(c, "debería observar la repetición entre generaciones");
  assert.deepEqual(c.personas, ["Ana", "Rosa"]);
  // El lenguaje no afirma causa.
  assert.match(c.texto, /Has registrado/);
  assert.ok(!/porque|causa|viene de/i.test(c.texto));
});

test("los nombres repetidos se detectan sin importar tildes ni segundo nombre", () => {
  const arbol = [
    persona("yo", { nombre: "José Miguel" }),
    persona("abuelos", { nombre: "jose" }),
  ];
  const c = detectarCoincidencias(arbol).find((x) => x.tipo === "nombre");
  assert.ok(c, "José y jose son el mismo nombre");
});

test("las edades se cruzan entre personas, no dentro de una", () => {
  const dentro = [
    persona("yo", {
      nombre: "Valeria",
      acontecimientos: [
        { texto: "me mudé", edad: 34 },
        { texto: "cambié de trabajo", edad: 34 },
      ],
    }),
  ];
  assert.ok(!tipos(dentro).includes("edad"));

  const entre = [
    persona("yo", { nombre: "Valeria", acontecimientos: [{ texto: "me separé", edad: 34 }] }),
    persona("padres", { nombre: "Ana", acontecimientos: [{ texto: "se separó", edad: 34 }] }),
  ];
  const c = detectarCoincidencias(entre).find((x) => x.tipo === "edad");
  assert.ok(c);
  assert.match(c.texto, /34 años/);
});

test("las fechas coinciden por día y mes, ignorando el año", () => {
  const arbol = [
    persona("yo", { nombre: "Valeria", nacimiento: "1990-03-14" }),
    persona("abuelos", { nombre: "Rosa", fallecimiento: "1962-03-14" }),
  ];
  const c = detectarCoincidencias(arbol).find((x) => x.tipo === "fecha");
  assert.ok(c);
  assert.match(c.texto, /14\/03/);
});

test("la situación económica solo se reporta si cruza generaciones", () => {
  const misma = [
    persona("padres", { economia: "dificil" }),
    persona("padres", { economia: "dificil" }),
  ];
  assert.ok(!tipos(misma).includes("economia"));

  const cruzada = [
    persona("padres", { economia: "dificil" }),
    persona("bisabuelos", { economia: "dificil" }),
  ];
  assert.ok(tipos(cruzada).includes("economia"));
});

test("a quien no tiene nombre se le llama por su parentesco", () => {
  const arbol = [
    persona("padres", { parentesco: "Mamá", separacion: true }),
    persona("abuelos", { parentesco: "Abuela materna", separacion: true }),
  ];
  const c = detectarCoincidencias(arbol).find((x) => x.tipo === "separacion");
  assert.deepEqual(c?.personas, ["Mamá", "Abuela materna"]);
});
