export type EventType = 'wedding'
export type EventMembershipRole = 'owner' | 'admin'
export type EventStatus = 'active' | 'archived'

export type Event = {
  id: string
  type: EventType
  name: string
  slug: string
  eventDate: string | null
  startTime: string | null
  timeZone: string | null
  startsAtUtc: string | null
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

export type EventTimingRequest = {
  eventDate: string | null
  startTime: string | null
  timeZone: string | null
}

export type TimeZoneOption = { id: string; displayName: string }
