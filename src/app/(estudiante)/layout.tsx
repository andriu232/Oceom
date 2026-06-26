import { requireRole } from "@/lib/auth";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { OceanBackground } from "@/components/brand/ocean-background";
import { studentNav } from "@/config/navigation";

export default async function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("student");

  return (
    <div className="min-h-dvh">
      <OceanBackground />
      <AppSidebar
        items={studentNav}
        userName={profile.full_name ?? "Viajero"}
        roleLabel="Estudiante"
      />
      <main className="px-5 py-8 lg:pl-[19rem] lg:pr-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
