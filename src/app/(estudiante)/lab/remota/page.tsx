import { redirect } from "next/navigation";
import { requireStudentArea, isMentor } from "@/lib/auth";
import { RemotaScreen } from "@/components/lab/lab-screens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visión Remota · OCEOM LAB" };

/** Juego en BETA: por ahora solo lo prueba la mentora/admin. */
export default async function Page() {
  const profile = await requireStudentArea();
  if (!isMentor(profile.role)) redirect("/lab");
  return <RemotaScreen />;
}
