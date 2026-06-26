import { requireRole } from "@/lib/auth";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { SacredOceanBackdrop } from "@/components/brand/sacred-ocean-backdrop";
import { adminGroups } from "@/config/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("mentor", "super_admin");

  return (
    <div className="min-h-dvh">
      <SacredOceanBackdrop />
      <AppSidebar
        groups={adminGroups}
        userName={profile.full_name ?? "Mentora"}
        roleLabel={profile.role === "super_admin" ? "Super Admin" : "Mentora"}
      />
      <main className="px-5 py-8 lg:pl-[19rem] lg:pr-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
