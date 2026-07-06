/**
 * Id estable por pestaña para la identidad en LiveKit.
 *
 * - Igual ante recargas de la misma pestaña → reconexión limpia, sin dejar un
 *   participante "fantasma" en la sala.
 * - Distinto en cada pestaña/dispositivo → la MISMA cuenta puede entrar al
 *   círculo desde varios lados sin que LiveKit expulse a los demás por tener
 *   identidad duplicada.
 *
 * (Patrón portado del LiveKit de Código Enigma.)
 */
export function getDeviceId(): string {
  try {
    let id = sessionStorage.getItem("oceom_live_device");
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID().slice(0, 12)
          : Math.random().toString(36).slice(2, 14);
      sessionStorage.setItem("oceom_live_device", id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2, 14);
  }
}
