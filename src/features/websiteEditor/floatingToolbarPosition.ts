export type ToolbarRect = { left: number; top: number; width: number; height: number };
export type ToolbarPosition = { left: number; top: number; placement: "above" | "below" };

export function resolveFloatingToolbarPosition(anchor: ToolbarRect, toolbar: Pick<ToolbarRect, "width" | "height">, viewport: { width: number; height: number }, margin = 8, gap = 8): ToolbarPosition {
  const maximumLeft = Math.max(margin, viewport.width - toolbar.width - margin);
  const left = Math.min(Math.max(anchor.left + anchor.width / 2 - toolbar.width / 2, margin), maximumLeft);
  const roomAbove = anchor.top - margin;
  const placement = roomAbove >= toolbar.height + gap ? "above" : "below";
  const idealTop = placement === "above" ? anchor.top - toolbar.height - gap : anchor.top + anchor.height + gap;
  const maximumTop = Math.max(margin, viewport.height - toolbar.height - margin);
  return { left, top: Math.min(Math.max(idealTop, margin), maximumTop), placement };
}
