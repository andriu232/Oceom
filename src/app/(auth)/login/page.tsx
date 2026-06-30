import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar · OCEOM" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">
        Regresa a tu océano
      </h1>
      <p className="mt-2 text-sm text-muted">
        Continúa tu viaje interior donde lo dejaste.
      </p>

      {error === "oauth" && (
        <p className="mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          No pudimos completar el acceso con Google. Inténtalo de nuevo.
        </p>
      )}

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Aún no tienes acceso?{" "}
        <Link href="/registro" className="font-medium text-ocean-cyan hover:underline">
          Crear mi portal
        </Link>
      </p>
    </div>
  );
}
