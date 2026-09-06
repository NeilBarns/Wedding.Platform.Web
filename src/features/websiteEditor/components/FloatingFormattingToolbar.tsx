import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ResponsiveViewport } from "../types";
import { resolveFloatingToolbarPosition, type ToolbarPosition } from "../floatingToolbarPosition";

export function FloatingFormattingToolbar({ label, viewport, children }: { label: string; viewport: ResponsiveViewport; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  useLayoutEffect(() => {
    const toolbar = ref.current;
    const anchor = toolbar?.parentElement;
    const view = toolbar?.ownerDocument.defaultView;
    if (!toolbar || !anchor || !view) return;
    const update = () => setPosition(resolveFloatingToolbarPosition(anchor.getBoundingClientRect(), toolbar.getBoundingClientRect(), { width: view.innerWidth, height: view.innerHeight }));
    update();
    view.addEventListener("resize", update);
    view.addEventListener("scroll", update, true);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(anchor);
    observer?.observe(toolbar);
    return () => { view.removeEventListener("resize", update); view.removeEventListener("scroll", update, true); observer?.disconnect(); };
  }, []);
  const style: CSSProperties = position ? { left: position.left, top: position.top } : { left: "50%", top: 0, transform: "translate(-50%, calc(-100% - .5rem))" };
  return <div ref={ref} className="fixed z-50 flex flex-row flex-nowrap gap-1 whitespace-nowrap rounded-lg border border-border bg-surface p-1 text-foreground shadow-[var(--shadow-dialog)]" style={style} role="toolbar" aria-label={label} data-floating-formatting-toolbar data-toolbar-viewport={viewport} data-toolbar-placement={position?.placement} onPointerDown={(event) => event.preventDefault()}>{children}</div>;
}
