import { requireRole } from "@/lib/auth";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { OceomSanctuaryBackground } from "@/components/brand/sanctuary-background";
import { adminGroups } from "@/config/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("mentor", "super_admin");

  return (
    <div className="min-h-dvh">
      <OceomSanctuaryBackground scene="sacred" />
      <AppSidebar
        groups={adminGroups}
        userName={profile.full_name ?? "Mentora"}
        roleLabel={profile.role === "super_admin" ? "Super Admin" : "Mentora"}
        canSwitch
        viewMode="admin"
      />
      <main className="px-5 pb-28 pt-8 lg:pb-8 lg:pl-[19rem] lg:pr-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <BottomNav groups={adminGroups} />
    </div>
  );
}
