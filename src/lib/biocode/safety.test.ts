/* Batería de seguridad de BIOCODE. Se ejecuta con `node --test src/lib/biocode/safety.test.ts`
   (Node estimo tipos de forma nativa). Cubre las tres cosas que importan:
   detectar riesgo real, no dispararse con el habla cotidiana, y que un giro
   hiperbólico en la misma frase no tape una señal verdadera. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { detectRedFlag } from "./safety.ts";

const CRISIS = [
  "ya no quiero vivir",
  "tengo ganas de morirme",
  "he pensado en quitarme la vida",
  "a veces quiero desaparecer para siempre",
  "llevo días pensando en cortarme",
  "estoy pensando en hacerme daño",
  "siento que sería mejor si estuviera muerta",
  "quiero acabar con mi vida",
  "me quiero morir de la tristeza que tengo",
  "me quiero morir de la risa con eso, pero llevo semanas pensando en quitarme la vida",
];

const MEDICA = [
  "tengo un dolor muy fuerte en el pecho",
  "no puedo respirar bien desde ayer",
  "me desmayé esta mañana",
  "de repente no siento la mitad del cuerpo",
  "estoy sangrando mucho y no para",
  "tuve una convulsion anoche",
  "perdí el conocimiento ayer",
  "estoy vomitando sangre",
];

const LIMPIO = [
  "me duele la espalda",
  "siento mucha culpa",
  "me cuesta recibir",
  "estoy agotada de tanto trabajar",
  "me duele el pecho cuando pienso en mi mamá",
  "este trabajo me está matando",
  "me quiero morir de la risa",
  "me muero de ganas de empezar el programa",
  "me moría de vergüenza en la reunión",
  "me quiero morir del hambre",
  "quiero morir de viejita rodeada de mis nietos",
  "mi abuela murió el año pasado",
  "tengo miedo de morir algún día",
];

test("detecta señales de crisis", () => {
  for (const t of CRISIS) assert.equal(detectRedFlag(t), "crisis", t);
});

test("detecta posibles urgencias médicas", () => {
  for (const t of MEDICA) assert.equal(detectRedFlag(t), "medica", t);
});

test("no se dispara con el habla cotidiana", () => {
  for (const t of LIMPIO) assert.equal(detectRedFlag(t), null, t);
});
