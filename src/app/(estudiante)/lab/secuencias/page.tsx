import { requireStudentArea } from "@/lib/auth";
import { SecuenciasScreen } from "@/components/lab/lab-screens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Secuencias Luminosas · OCEOM LAB" };

export default async function Page() {
  await requireStudentArea();
  return <SecuenciasScreen />;
}
