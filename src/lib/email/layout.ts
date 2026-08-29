/* ============================================================
   La cáscara de marca de los correos de OCEOM.

   Vivía dentro de notify.ts. Se sacó aquí cuando el recordatorio diario de
   bitácora necesitó la misma cáscara: si cada correo se dibuja su propio
   marco, en dos meses hay tres OCEOM distintos en la bandeja de la gente.

   Todo es HTML de tabla vieja con estilos en línea a propósito: Gmail y
   Outlook borran las hojas de estilo.
   ============================================================ */

export const BRAND = "#0ea5b7";

/** URL pública de la app (para enlaces en los correos). */
export const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://oceom.33vertebras.com"
).replace(/\/+$/, "");

export function shell(title: string, inner: string, footer?: string): string {
  return `
  <div style="background:#0a1124;padding:32px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#0f1a36;border:1px solid rgba(94,234,212,0.18);border-radius:18px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="font-size:20px;font-weight:700;letter-spacing:3px;color:#e8eefb">OCE<span style="color:#5eead4">OM</span></span>
        <div style="font-size:10px;letter-spacing:3px;color:#8aa0c6;margin-top:2px">BY E-MOTION®</div>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 14px;font-size:19px;color:#e8eefb">${title}</h1>
        ${inner}
      </div>
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#8aa0c6">
        ${footer ?? "OCEOM · Donde el océano interior despierta"}
      </div>
    </div>
  </div>`;
}

export function row(label: string, value: string): string {
  return `<p style="margin:6px 0;color:#aab8d4;font-size:14px"><strong style="color:#e8eefb">${label}:</strong> ${value}</p>`;
}

export function linkButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:18px;background:${BRAND};color:#04121a;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:14px">${label}</a>`;
}

/** Escapa lo que venga de la base antes de meterlo en el HTML del correo.
 *  Un nombre con `<` no debería poder romper (ni inyectar en) el mensaje. */
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
