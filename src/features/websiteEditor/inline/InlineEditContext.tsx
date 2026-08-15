import { createContext, useContext } from 'react'
import type { InlineFieldPath, InlineFieldTarget } from './types'

type InlineEditContextValue = {
  activeTarget: InlineFieldTarget | null
  requestEdit: (target: InlineFieldTarget) => void
  updateValue: (sectionId: string, path: InlineFieldPath, value: string) => void
  finishEdit: () => void
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null)

export const InlineEditProvider = InlineEditContext.Provider
export function useInlineEdit() { return useContext(InlineEditContext) }
