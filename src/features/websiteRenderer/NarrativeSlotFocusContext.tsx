import { createContext, useContext } from "react";
import type { NarrativeSlotKey } from "../websiteEditor/narrativeSlotFocus";

export type NarrativeSlotFocus = { blockId: string; slot: NarrativeSlotKey } | null;

export const NarrativeSlotFocusContext = createContext<{
  active: NarrativeSlotFocus;
  onSelect: (blockId: string, slot: NarrativeSlotKey) => void;
} | null>(null);

export function useNarrativeSlotFocus() {
  return useContext(NarrativeSlotFocusContext);
}
