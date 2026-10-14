export type Status = 'open' | 'hiring' | 'collab';

export type Profile = {
  id: string;
  slug: string;
  full_name: string;
  avatar_url: string | null;
  role_line: string | null;
  headline: string | null;
  status: Status;
  topics: string[];
  linkedin_url: string | null;
  x_url: string | null;
  website_url: string | null;
  active_event_id: string | null;
  onboarded: boolean;
  is_demo: boolean;
};

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  venue: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
};

export type Slot = {
  id: string;
  owner_id: string;
  starts_at: string;
  duration_min: number;
  booked_at: string | null;
};

export type Swap = {
  id: string;
  owner_id: string;
  contact_id: string;
  event_id: string | null;
  note: string | null;
  decision: 'pending' | 'connect' | 'skip';
  stage: 'met' | 'messaged' | 'booked' | 'done';
  met_at: string;
  messaged_at: string | null;
  booked_at: string | null;
};

export type Reminder = {
  id: string;
  swap_id: string;
  kind: 'message_3h' | 'followup_d3' | 'lastcall_d7';
  due_at: string;
  sent_at: string | null;
  cleared_at: string | null;
};

export type Tone = 'warm' | 'short' | 'direct';
