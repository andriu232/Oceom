import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

/** Placeholder elegante para secciones que se construyen en próximos sprints. */
export function ComingSoon({
  title,
  subtitle,
  icon,
  sprint,
  description,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  sprint: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState icon={icon} title={`Llega en ${sprint}`} description={description} />
    </div>
  );
}
