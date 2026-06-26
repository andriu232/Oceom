import Link from "next/link";
import { RegistroForm } from "./registro-form";

export const metadata = { title: "Crear portal · OCEOM" };

export default function RegistroPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Abre tu portal
      </h1>
      <p className="mt-2 text-sm text-muted">
        Comienza tu proceso de transformación interior.
      </p>

      <div className="mt-8">
        <RegistroForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes acceso?{" "}
        <Link href="/login" className="font-medium text-ocean-cyan hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
