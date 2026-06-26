/** Helpers de Vimeo (compartidos client/server). Portado de Código Enigma. */

/**
 * Extrae el ID Vimeo de un input. Acepta:
 *   "76979871"                                       → "76979871"
 *   "https://vimeo.com/76979871"                     → "76979871"
 *   "https://vimeo.com/76979871/abc123"              → "76979871:abc123" (hash para privados)
 *   "https://player.vimeo.com/video/76979871?h=abc"  → "76979871:abc"
 */
export function extractVimeoId(input: string | null | undefined): string | null {
  if (!input) return null;
  const m = input.match(
    /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)(?:\/([a-zA-Z0-9]+))?/,
  );
  if (m) {
    const id = m[1];
    const hash = m[2];
    return hash ? `${id}:${hash}` : id;
  }
  const hashMatch = input.match(/[?&]h=([a-zA-Z0-9]+)/);
  const numMatch = input.match(/(\d{6,})/);
  if (numMatch) {
    return hashMatch ? `${numMatch[1]}:${hashMatch[1]}` : numMatch[1];
  }
  return null;
}

/** URL del iframe Vimeo lista para embeber. `vimeoId` puede ser "12345" o "12345:hash". */
export function buildVimeoEmbedUrl(
  vimeoId: string,
  opts: { autoplay?: boolean; muted?: boolean; controls?: boolean; pip?: boolean } = {},
): string {
  const [id, hash] = vimeoId.split(":");
  const params = new URLSearchParams();
  if (hash) params.set("h", hash);
  params.set("title", "0");
  params.set("byline", "0");
  params.set("portrait", "0");
  params.set("dnt", "1");
  params.set("playsinline", "1");
  if (opts.autoplay) params.set("autoplay", "1");
  if (opts.muted) params.set("muted", "1");
  if (opts.controls === false) params.set("controls", "0");
  if (opts.pip !== false) params.set("pip", "1");
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}
