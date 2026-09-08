import { describe, expect, it } from 'vitest'
import { normalizeWebsiteDraftFromApi, validateSectionContent } from './schemas'
import { genericTextSectionChildFlowSchema, textSectionChildFlowSchema } from './sectionChildFlow'

const appearance = { headingAlignment: 'inherit', bodyAlignment: 'inherit', backgroundTreatment: 'inherit', emphasis: 'inherit' }
const blank = (id: string, editorName: string) => ({
  id, type: 'blank', displayName: 'Section', editorName, sortOrder: 10, isEnabled: true,
  content: { childFlow: { elements: [], order: [] } }, appearance, designDefaults: {}, resolvedDesignContext: null,
  appearanceOptions: null, mediaCapability: null, itemMediaCapability: null, presentationCapability: null,
})
const draft = (sections: unknown[]) => ({
  schemaVersion: 5, id: 'website', eventId: 'event', name: 'Website', templateKey: 'classic-filipiniana-v1',
  designSettings: { colorTheme: 'terracotta', fontSet: 'editorial', artStyle: 'minimal', projectDefaults: {}, customColors: [] },
  projectDesignDefaults: null, template: null, sections, media: {},
})

describe('repeatable Blank Section hydration', () => {
  it('accepts repeated instances with stable IDs and persisted editor names', () => {
    const result = normalizeWebsiteDraftFromApi(draft([blank('one', 'Section 1'), blank('two', 'Travel notes')]))
    expect(result.sections.map(({ id }) => id)).toEqual(['one', 'two'])
    expect(result.sections.map(({ editorName }) => editorName)).toEqual(['Section 1', 'Travel notes'])
  })

  it('strictly rejects missing or malformed editor metadata and content shapes', () => {
    const missingName = { ...blank('one', 'Section 1') } as Record<string, unknown>
    delete missingName.editorName
    expect(() => normalizeWebsiteDraftFromApi(draft([missingName]))).toThrow()
    expect(() => normalizeWebsiteDraftFromApi(draft([{ ...blank('one', 'Section 1'), editorName: 1 }]))).toThrow()
    expect(() => normalizeWebsiteDraftFromApi(draft([{ ...blank('one', 'Section 1'), lifecycle: 'multiple' }]))).toThrow()
    expect(() => normalizeWebsiteDraftFromApi(draft([{ ...blank('one', 'Section 1'), content: { childFlow: [] } }]))).toThrow()
  })

  it('keeps generic-only and specialized flow contracts distinct', () => {
    const element = { id: 'text', type: 'text', editorName: 'Text 1', text: 'Hello' }
    expect(genericTextSectionChildFlowSchema.safeParse({ elements: [element], order: [{ kind: 'element', id: 'text' }] }).success).toBe(true)
    expect(genericTextSectionChildFlowSchema.safeParse({ elements: [], order: [{ kind: 'specialized', key: 'content' }] }).success).toBe(false)
    expect(textSectionChildFlowSchema.safeParse({ elements: [], order: [{ kind: 'specialized', key: 'content' }] }).success).toBe(true)
    expect(textSectionChildFlowSchema.safeParse({ elements: [], order: [] }).success).toBe(false)
  })

  it('does not recognize removed Dress Code content as a canonical Section contract', () => {
    expect(validateSectionContent('dressCode', { heading: 'Attire', description: 'Formal' }).success).toBe(false)
  })
})
