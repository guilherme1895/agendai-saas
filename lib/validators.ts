import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const RegisterSchema = z.object({
  name: z.string().min(2, "Nome muito curto.").max(100),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
  timezone: z.string().optional().default("America/Sao_Paulo"),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const ProfileSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, "Use apenas letras, números e hífens."),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  timezone: z.string().min(1),
  bookingPageTitle: z.string().max(100).optional().nullable(),
  minimumNotice: z.number().int().min(0).max(10080),
  maxDaysInAdvance: z.number().int().min(1).max(365),
});

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const ServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional().nullable(),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#22c55e"),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  durationInMinutes: z.number().int().min(5).max(480),
  bufferTimeBefore: z.number().int().min(0).max(120).default(0),
  bufferTimeAfter: z.number().int().min(0).max(120).default(0),
  price: z.number().int().min(0).default(0),
  currency: z.string().length(3).default("BRL"),
  paymentRequired: z.boolean().default(false),
  isVideoCall: z.boolean().default(false),
  videoCallProvider: z.enum(["google_meet", "zoom", "custom"]).optional().nullable(),
  customMeetingUrl: z.string().url().optional().nullable(),
  maxAdvanceBookingDays: z.number().int().min(1).max(365).optional().nullable(),
  minimumNoticeMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  maxParticipants: z.number().int().min(1).max(1000).default(1),
  position: z.number().int().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------
export const AvailabilityBlockSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  isActive: z.boolean().default(true),
});

export const AvailabilitySchema = z.object({
  serviceId: z.string().optional().nullable(),
  blocks: z.array(AvailabilityBlockSchema).min(0),
});

// ---------------------------------------------------------------------------
// Booking (público)
// ---------------------------------------------------------------------------
export const PublicBookingSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(20).optional().nullable(),
  customerTimezone: z.string().default("America/Sao_Paulo"),
  customerNotes: z.string().max(500).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------
export const CustomerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Booking management (provider)
// ---------------------------------------------------------------------------
export const BookingUpdateSchema = z.object({
  status: z.enum(["confirmed", "completed", "no_show", "cancelled_by_provider"]).optional(),
  internalNotes: z.string().max(2000).optional().nullable(),
  cancelReason: z.string().max(500).optional().nullable(),
});

export const CancelBookingSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
  cancelledBy: z.enum(["provider", "customer"]).default("provider"),
  refund: z.boolean().default(false),
});
