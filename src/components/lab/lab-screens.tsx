"use client";

import { LabShell } from "@/components/lab/lab-kit";
import { ObservadorGame } from "@/components/lab/observador-game";
import { OlaGame } from "@/components/lab/ola-game";
import { SecuenciasGame } from "@/components/lab/secuencias-game";
import { RespiracionGame } from "@/components/lab/respiracion-game";

/* Pantallas completas de cada entrenamiento (LabShell + juego). Viven en el
   cliente porque LabShell recibe una render-prop; las páginas server solo
   autentican y montan la pantalla. */

export function ObservadorScreen() {
  return (
    <LabShell
      gameKey="observador"
      title="Observador Profundo"
      world="Mundo 1 · Despertar de los Sentidos"
      narrative="Vas a descender a una escena del océano que existirá solo por unos segundos. Nada se te pide aún — solo mirar de verdad. Después, el océano te preguntará qué viste."
    >
      {(finish) => <ObservadorGame finish={finish} />}
    </LabShell>
  );
}

export function OlaScreen() {
  return (
    <LabShell
      gameKey="ola-intuitiva"
      title="La Ola Intuitiva"
      world="Mundo 2 · Intuición y Percepción"
      narrative="Aquí no hay respuestas correctas. Cinco corrientes van a abrirse frente a ti; tu única tarea es elegir ANTES de pensar. Al final, miraremos juntos cómo decide tu intuición."
    >
      {(finish) => <OlaGame finish={finish} />}
    </LabShell>
  );
}

export function SecuenciasScreen() {
  return (
    <LabShell
      gameKey="secuencias"
      title="Secuencias Luminosas"
      world="Mundo 5 · Concentración"
      narrative="Cuatro orbes bioluminiscentes hablan en destellos. Cada ola añade una luz más a la conversación. Obsérvalas, y cuando callen, respóndeles en el mismo orden. La profundidad crece contigo."
    >
      {(finish) => <SecuenciasGame finish={finish} />}
    </LabShell>
  );
}

export function RespiracionScreen() {
  return (
    <LabShell
      gameKey="respiracion"
      title="Corrientes de Respiración"
      world="Mundo 6 · Respiración Consciente"
      narrative="Tu respiración es la marea de tu océano interior. Elige una corriente y deja que el orbe marque el ritmo: se expande cuando inhalas, brilla cuando sostienes, se recoge cuando sueltas."
    >
      {(finish) => <RespiracionGame finish={finish} />}
    </LabShell>
  );
}
