export const WEBSITE_PROJECT_TEMPLATES = [
  { key: 'classic-filipiniana-v1', displayName: 'Classic Filipiniana' },
  { key: 'modern-editorial-v1', displayName: 'Modern Editorial' },
] as const

export function websiteTemplateDisplayName(templateKey: string): string {
  return WEBSITE_PROJECT_TEMPLATES.find(({ key }) => key === templateKey)?.displayName ?? templateKey
}
