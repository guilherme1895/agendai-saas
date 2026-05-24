// =============================================================================
// Tipos centrais — espelham o schema do banco + shapes de API
// =============================================================================

export type Plan = "free" | "pro" | "business";
export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled_by_provider"
  | "cancelled_by_customer"
  | "completed"
  | "no_show";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partially_refunded";
export type NotifType = "EMAIL" | "WHATSAPP" | "SMS";
export type NotifStatus = "PENDING" | "SENT" | "FAILED";
export type NotifTemplate =
  | "booking_confirmed"
  | "booking_reminder_24h"
  | "booking_reminder_1h"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "payment_received"
  | "payment_failed";

// ---------------------------------------------------------------------------
// Rows retornadas pelo banco (snake_case)
// ---------------------------------------------------------------------------
export interface UserRow {
  id: string;
  name: string;
  email: string;
  email_verified: string | null;
  image: string | null;
  password: string | null;
  slug: string;
  bio: string | null;
  phone: string | null;
  timezone: string;
  booking_page_title: string | null;
  booking_page_banner: string | null;
  minimum_notice: number;
  max_days_in_advance: number;
  stripe_customer_id: string | null;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  plan: Plan;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  slug: string;
  color: string;
  is_active: number;
  is_public: number;
  duration_in_minutes: number;
  buffer_time_before: number;
  buffer_time_after: number;
  price: number;
  currency: string;
  payment_required: number;
  is_video_call: number;
  video_call_provider: string | null;
  custom_meeting_url: string | null;
  max_advance_booking_days: number | null;
  minimum_notice_minutes: number | null;
  max_participants: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRow {
  id: string;
  user_id: string;
  service_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  tags: string | null;
  source: string | null;
  total_bookings: number;
  total_spent_cents: number;
  last_booking_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingRow {
  id: string;
  user_id: string;
  service_id: string;
  customer_id: string;
  start_at: string;
  end_at: string;
  customer_timezone: string;
  status: BookingStatus;
  cancelled_at: string | null;
  cancel_reason: string | null;
  payment_status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  paid_amount_cents: number;
  paid_at: string | null;
  refunded_amount_cents: number;
  refunded_at: string | null;
  meeting_url: string | null;
  google_calendar_event_id: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  manage_token: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationLogRow {
  id: string;
  booking_id: string;
  type: NotifType;
  template: NotifTemplate;
  recipient: string;
  status: NotifStatus;
  provider_message_id: string | null;
  error_message: string | null;
  subject: string | null;
  body: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Slot de tempo livre para exibição
// ---------------------------------------------------------------------------
export interface TimeSlot {
  startAt: string; // ISO 8601 UTC
  endAt: string;   // ISO 8601 UTC
  startLocal: string; // "HH:MM" no tz do prestador
  endLocal: string;
}
