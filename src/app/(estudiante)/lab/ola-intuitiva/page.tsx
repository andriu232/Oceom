import { requireStudentArea } from "@/lib/auth";
import { OlaScreen } from "@/components/lab/lab-screens";

export const dynamic = "force-dynamic";
export const metadata = { title: "La Ola Intuitiva · OCEOM LAB" };

export default async function Page() {
  await requireStudentArea();
  return <OlaScreen />;
}
