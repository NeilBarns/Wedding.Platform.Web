import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string().trim().min(1, 'Event name is required.').max(255, 'Use 255 characters or fewer.'),
  type: z.literal('wedding'),
  eventDate: z.string().refine(
    (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Enter a valid event date.',
  ),
  slug: z.string().trim().max(255, 'Use 255 characters or fewer.')
    .refine((value) => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), 'Use lowercase letters, numbers, and hyphens.'),
})

export type CreateEventFormValues = z.infer<typeof createEventSchema>
