import "server-only";

/* ============================================================
   Diagnóstico de Resend para el panel de correos.

   Existe por una razón concreta: cuando un correo no llega, la causa casi
   nunca es el código. Es que falta la API key, o que el dominio del remitente
   no está verificado, o que se está saliendo por `onboarding@resend.dev` —
   que SOLO entrega al dueño de la cuenta, así que el envío "funciona" y
   nadie lo recibe. Es el fallo más caro de diagnosticar a ciegas.
   ============================================================ */

export interface ResendDomain {
  name: string;
  status: string;
  region: string | null;
}

export interface ResendHealth {
  keyPresent: boolean;
  /** Lo que el código va a poner en el De: */
  from: string;
  /** Dominio extraído del From. */
  fromDomain: string | null;
  /** true si el From sale por el dominio compartido de pruebas de Resend. */
  usingTestDomain: boolean;
  /** null si no se pudo consultar (sin key, o la API no respondió). */
  domains: ResendDomain[] | null;
  /** true si la key existe pero solo tiene permiso de envío: no puede listar
   *  dominios. Es lo normal y RECOMENDADO; no es un fallo. */
  sendOnlyKey: boolean;
  /** true si el dominio del From aparece verificado en la cuenta. */
  fromVerified: boolean;
  error: string | null;
}

const FALLBACK_FROM = "OCEOM <onboarding@resend.dev>";

/** Saca el dominio de un From con cualquiera de las dos formas:
 *  "hola@dominio.com" o "OCEOM <hola@dominio.com>". */
export function domainOf(from: string): string | null {
  const m = from.match(/<([^>]+)>/);
  const addr = (m ? m[1] : from).trim();
  const at = addr.lastIndexOf("@");
  return at === -1 ? null : addr.slice(at + 1).toLowerCase();
}

export async function checkResend(): Promise<ResendHealth> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || FALLBACK_FROM;
  const fromDomain = domainOf(from);

  const health: ResendHealth = {
    keyPresent: !!key,
    from,
    fromDomain,
    usingTestDomain: fromDomain === "resend.dev",
    domains: null,
    sendOnlyKey: false,
    fromVerified: false,
    error: null,
  };

  if (!key) return health;

  try {
    // Si Resend tarda, el panel no se queda colgado: el diagnóstico es un
    // extra, no el contenido de la página.
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 422) {
        // Una key con permiso de solo envío no puede listar dominios. Eso no
        // rompe nada: manda correo igual. Decir "key inválida" aquí manda a
        // cualquiera a rotar una key que estaba perfecta.
        health.sendOnlyKey = true;
        health.error =
          "La key solo tiene permiso de envío, así que no se puede listar los dominios desde aquí. Los envíos funcionan igual.";
      } else {
        health.error = `Resend respondió ${res.status}.`;
      }
      return health;
    }

    const body = (await res.json()) as {
      data?: Array<{ name?: string; status?: string; region?: string }>;
    };
    health.domains = (body.data ?? []).map((d) => ({
      name: d.name ?? "—",
      status: d.status ?? "desconocido",
      region: d.region ?? null,
    }));
    health.fromVerified = health.domains.some(
      (d) => d.name.toLowerCase() === fromDomain && d.status === "verified",
    );
  } catch {
    // Algunas API keys son de solo envío y no pueden listar dominios. Eso no
    // es un fallo: se puede mandar correo perfectamente.
    health.error = "No se pudo consultar la lista de dominios.";
  }

  return health;
}
