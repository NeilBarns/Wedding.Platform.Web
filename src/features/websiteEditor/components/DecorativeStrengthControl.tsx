import { Minus, Plus } from "lucide-react";
import { IconButton } from "../../../components/ui/IconButton";
import { InspectorResetAction } from "./InspectorPrimitives";

export function DecorativeStrengthControl({ label, value, defaultValue, onChange }: { label: "Texture Strength" | "Pattern Strength"; value?: number; defaultValue: number; onChange: (value?: number) => void }) {
  const effectiveValue = value ?? defaultValue;
  const subject = label === "Texture Strength" ? "texture" : "pattern";
  return <fieldset><div className="flex items-center justify-between gap-3"><legend className="text-xs font-medium">{label}</legend><div className="flex items-center gap-1.5"><span className="text-xs tabular-nums text-foreground-muted">{effectiveValue}%</span>{value !== undefined && <InspectorResetAction onClick={() => onChange()} />}</div></div><div className="mt-2 flex items-center gap-2"><IconButton type="button" size="sm" aria-label={`Decrease ${subject} strength`} disabled={effectiveValue <= 10} onClick={() => onChange(effectiveValue - 5)}><Minus size={16} /></IconButton><input className="w-full cursor-pointer accent-accent" type="range" aria-label={label} min={10} max={100} step={5} value={effectiveValue} onChange={(event) => onChange(Number(event.target.value))} /><IconButton type="button" size="sm" aria-label={`Increase ${subject} strength`} disabled={effectiveValue >= 100} onClick={() => onChange(effectiveValue + 5)}><Plus size={16} /></IconButton></div></fieldset>;
}
