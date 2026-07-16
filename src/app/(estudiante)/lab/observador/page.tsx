import { requireStudentArea } from "@/lib/auth";
import { ObservadorScreen } from "@/components/lab/lab-screens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Observador Profundo · OCEOM LAB" };

export default async function Page() {
  await requireStudentArea();
  return <ObservadorScreen />;
}
