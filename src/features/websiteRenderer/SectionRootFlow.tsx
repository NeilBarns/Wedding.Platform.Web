import type { ReactNode } from "react";

export function SectionRootFlow({ children }: { children: ReactNode }) {
  return <div data-section-root-flow className="flex flex-col">{children}</div>;
}
