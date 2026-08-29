import { createContext, useContext } from "react";
import type { StoryHeaderField } from "../websiteEditor/types";

export const EditorSelectionContext = createContext<StoryHeaderField | null>(null);

export function useSelectedStoryHeaderField() {
  return useContext(EditorSelectionContext);
}
