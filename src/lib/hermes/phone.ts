/* ============================================================
   Normalización de números a E.164 — la llave con la que el webhook
   resuelve quién escribe. Un mismo celular puede llegar escrito de mil
   formas ("300 123 4567", "+57 300-123-4567", "57 3001234567"); todas
   tienen que colapsar al mismo string o la persona no se reconoce.

   Sin dependencias: solo se soportan los países donde hay estudiantes.
   El default es Colombia (+57), que es de donde viene el grupo de Valeria.
   ============================================================ */

/** Longitud del número nacional (sin indicativo) por país soportado. */
const NATIONAL_LENGTH: Record<string, number> = {
  "57": 10, // Colombia
  "52": 10, // México
  "34": 9, // España
  "54": 10, // Argentina
  "56": 9, // Chile
  "51": 9, // Perú
  "1": 10, // EE. UU. / Canadá
};

const DEFAULT_CC = "57";

/** Convierte cualquier forma de escribir un celular a E.164 (`+573001234567`).
 *  Devuelve null si no parece un número válido. */
export function toE164(raw: string, defaultCountry = DEFAULT_CC): string | null {
  if (!raw) return null;

  // "00" es el prefijo internacional en buena parte del mundo → equivale a "+".
  let digits = raw.replace(/[^\d+]/g, "").replace(/^00/, "+");
  const explicit = digits.startsWith("+");
  digits = digits.replace(/\D/g, "");
  if (!digits) return null;

  if (explicit) {
    return isPlausible(digits) ? `+${digits}` : null;
  }

  // Sin "+": puede venir ya con indicativo ("573001234567") o sin él.
  const cc = defaultCountry;
  const len = NATIONAL_LENGTH[cc];
  if (len && digits.length === len) return `+${cc}${digits}`;
  if (digits.startsWith(cc) && len && digits.length === cc.length + len) return `+${digits}`;

  return isPlausible(digits) ? `+${digits}` : null;
}

/** Un E.164 tiene entre 8 y 15 dígitos incluyendo el indicativo. */
function isPlausible(digits: string): boolean {
  return digits.length >= 8 && digits.length <= 15;
}

/** WhatsApp entrega el remitente sin "+" (`573001234567`).
 *  Además, en Argentina y México Meta a veces incluye el 9/1 y a veces no,
 *  así que se prueban las variantes conocidas contra la base de datos. */
export function inboundVariants(waFrom: string): string[] {
  const digits = waFrom.replace(/\D/g, "");
  const out = new Set<string>([`+${digits}`]);

  // Argentina: +54 9 XXXX… ↔ +54 XXXX…
  if (digits.startsWith("549")) out.add(`+54${digits.slice(3)}`);
  else if (digits.startsWith("54")) out.add(`+549${digits.slice(2)}`);

  // México: +52 1 XXXX… ↔ +52 XXXX… (formato viejo, aún aparece)
  if (digits.startsWith("521")) out.add(`+52${digits.slice(3)}`);
  else if (digits.startsWith("52")) out.add(`+521${digits.slice(2)}`);

  return [...out];
}

/** Versión enmascarada para mostrar en pantalla: `+57 300 ••• 4567`.
 *  El indicativo se separa probando los códigos de país conocidos (de 3 a 1
 *  dígito); si no se reconoce ninguno, se muestra el número sin separar. */
export function maskPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");
  if (d.length < 8) return e164;

  let cc = "";
  for (const n of [3, 2, 1]) {
    const cand = d.slice(0, n);
    if (NATIONAL_LENGTH[cand] !== undefined) {
      cc = cand;
      break;
    }
  }

  const rest = d.slice(cc.length);
  if (rest.length < 7) return `+${d}`;
  // Se muestran los 3 primeros y los 4 últimos; el resto se oculta.
  const masked = `${rest.slice(0, 3)} ••• ${rest.slice(-4)}`;
  return cc ? `+${cc} ${masked}` : `+${masked}`;
}
