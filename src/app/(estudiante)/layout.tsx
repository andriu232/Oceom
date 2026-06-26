import { requireStudentArea, isMentor } from "@/lib/auth";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { MerkabaBackdrop } from "@/components/brand/merkaba-backdrop";
import { studentGroups } from "@/config/navigation";

export default async function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireStudentArea();
  const previewing = isMentor(profile.role); // mentora/super admin en vista estudiante

  return (
    <div className="min-h-dvh">
      <MerkabaBackdrop />
      <AppSidebar
        groups={studentGroups}
        userName={profile.full_name ?? "Viajero"}
        roleLabel={previewing ? "Vista estudiante" : "Estudiante"}
        canSwitch={previewing}
        viewMode="student"
      />
      <main className="px-5 py-8 lg:pl-[19rem] lg:pr-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
