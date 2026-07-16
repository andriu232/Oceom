import { requireStudentArea } from "@/lib/auth";
import { RespiracionScreen } from "@/components/lab/lab-screens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Corrientes de Respiración · OCEOM LAB" };

export default async function Page() {
  await requireStudentArea();
  return <RespiracionScreen />;
}
