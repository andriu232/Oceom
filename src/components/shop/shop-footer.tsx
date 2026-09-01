import Link from "next/link";

export function ShopFooter() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ocean-deep/30">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-14 sm:grid-cols-3">
        <div>
          <span className="font-display text-lg font-semibold tracking-[0.3em] text-foreground">
            OCE<span className="text-ocean-glow">OM</span>
          </span>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            El santuario digital del método E-MOTION® de Valeria Rueda Caicedo.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-muted/70">Tienda</p>
          <Link href="/tienda" className="block text-muted hover:text-ocean-cyan">Todos los productos</Link>
          <Link href="/carrito" className="block text-muted hover:text-ocean-cyan">Mi carrito</Link>
          <Link href="/santuario" className="block text-muted hover:text-ocean-cyan">Mi santuario</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-muted/70">Legal</p>
          <Link href="/terminos" className="block text-muted hover:text-ocean-cyan">Términos</Link>
          <Link href="/privacidad" className="block text-muted hover:text-ocean-cyan">Privacidad</Link>
        </div>
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-[1180px] px-6 py-6 text-xs leading-relaxed text-muted/70">
          Los productos de esta tienda son complementos de bienestar y acompañamiento
          emocional. No son medicamentos, no diagnostican ni curan enfermedades, y no
          sustituyen la consulta con tu profesional de salud. Si estás en embarazo,
          lactancia o tomas medicación, consulta antes de usarlos.
        </p>
      </div>
    </footer>
  );
}
