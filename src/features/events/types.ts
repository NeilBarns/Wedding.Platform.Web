export type EventType = 'wedding'
export type EventMembershipRole = 'owner' | 'admin'
export type EventStatus = 'active' | 'archived'

export type Event = {
  id: string
  type: EventType
  name: string
  slug: string
  eventDate: string | null
  status: EventStatus
  membershipRole: EventMembershipRole
  createdAt: string
  updatedAt: string
}

export type EventDetail = Omit<Event, 'membershipRole'> & {
  membershipRole: EventMembershipRole | null
}

export type CreateEventRequest = {
  name: string
  type: EventType
  eventDate?: string
  slug?: string
}
