/* ============================================================
   La Flor de la Vida que enmarca el cuerpo.

   El fondo del santuario ya pinta una, pero va en el layout raíz y se centra
   en la VENTANA, mientras el contenido vive en una columna desplazada por la
   barra lateral (`lg:pl-[19rem]`). El cuerpo quedaba a media barra de
   distancia del centro de la flor. Esta se dibuja dentro del propio visor,
   así que está centrada con el cuerpo por construcción, en cualquier ancho
   de pantalla y con la barra abierta o cerrada.

   Es SVG estático y no un segundo lienzo animado: el visor 3D ya tiene la
   GPU ocupada.
   ============================================================ */

/** Centros de la retícula hexagonal, en unidades de radio. */
function centros(anillos: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = -anillos; i <= anillos; i += 1) {
    for (let j = -anillos; j <= anillos; j += 1) {
      const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
      if (dist <= anillos) out.push([i + j * 0.5, (j * Math.sqrt(3)) / 2]);
    }
  }
  return out;
}

const R = 11.5;
const PUNTOS = centros(2);

/** El centrado vertical lo pone quien la usa: si se centrara en su contenedor
 *  quedaría desplazada por lo que haya debajo del cuerpo —el crédito del
 *  atlas, por ejemplo— y ese fue justo el desfase que había que corregir. */
export function FlorDeLaVida({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${className}`}
    >
      <g fill="none" stroke="var(--ocean-cyan)" strokeWidth="0.16" opacity="0.5">
        {PUNTOS.map(([x, y], i) => (
          <circle key={i} cx={50 + x * R} cy={50 + y * R} r={R} />
        ))}
      </g>
      {/* Los dos anillos que cierran la figura. */}
      <circle
        cx="50"
        cy="50"
        r={R * 3}
        fill="none"
        stroke="var(--ocean-glow)"
        strokeWidth="0.22"
        opacity="0.45"
      />
      <circle
        cx="50"
        cy="50"
        r={R * 3 + 1.6}
        fill="none"
        stroke="var(--ocean-cyan)"
        strokeWidth="0.12"
        opacity="0.3"
      />
    </svg>
  );
}
