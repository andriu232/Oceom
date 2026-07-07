/** Nombre de la cookie donde se guarda el código de referido capturado de la
 *  URL (?ref=XXX) hasta que el visitante se registra. Compartido entre el
 *  capturador cliente (RefCapture) y la lectura server-side en el signup. */
export const REF_COOKIE = "oceom_ref";

/** Días que vive la cookie de referido. */
export const REF_COOKIE_MAX_AGE_DAYS = 30;
