import { apiHandler, ok } from "@/lib/api";
import { requireSession, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { CancelBookingSchema } from "@/lib/validators";
import { deleteCalendarEvent } from "@/lib/google-calendar";
import { refundPayment } from "@/lib/stripe";

type Ctx = { params: Promise<{ id: string }> };

export const POST = apiHandler(async (req, ctx: Ctx) => {
  const session = await requireSession();
  const { id } = await ctx.params;
  const data = CancelBookingSchema.parse(await req.json());
  
  const booking = await db.booking.findFirst({
    where: { id, userId: session.userId },
    include: { customer: true, service: true },
  });
  
  if (!booking) throw new ApiError(404, "Agendamento não encontrado.");
  if (booking.status.startsWith("cancelled")) throw new ApiError(400, "Agendamento já está cancelado.");
  
  const newStatus = data.cancelledBy === "provider" ? "cancelled_by_provider" : "cancelled_by_customer";
  
  await db.booking.update({
    where: { id },
    data: { status: newStatus, cancelledAt: new Date(), cancelReason: data.reason ?? null },
  });

  // Reembolso Stripe
  if (data.refund && booking.stripeChargeId && booking.paidAmountCents > 0) {
    try {
      await refundPayment({ chargeId: booking.stripeChargeId });
      await db.booking.update({
        where: { id },
        data: { paymentStatus: "refunded", refundedAmountCents: booking.paidAmountCents, refundedAt: new Date() },
      });
    } catch (e) { console.error("Refund failed:", e); }
  }

  // Remove do Google Calendar
  if (booking.googleCalendarEventId) {
    const account = await db.account.findFirst({
      where: { userId: session.userId, provider: "google" },
    });
    if (account?.googleCalendarId && account.access_token) {
      try {
        await deleteCalendarEvent({
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? "",
          expiresAt: account.expires_at,
          calendarId: account.googleCalendarId,
          eventId: booking.googleCalendarEventId,
        });
      } catch (e) { console.error("GCal delete failed:", e); }
    }
  }

  // Notificação de cancelamento
  await db.notificationLog.create({
    data: {
      bookingId: id,
      type: "EMAIL",
      template: "booking_cancelled",
      recipient: booking.customer.email,
      status: "PENDING",
      subject: `Agendamento cancelado — ${booking.service.name}`,
    },
  });

  return ok({ ok: true, status: newStatus });
});