export function formatDateOnly(value: string | null): string | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12)
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(date)
}
