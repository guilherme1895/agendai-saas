import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"  const status = searchParams.get("status");
  const serviceId = searchParams.get("serviceId");
  const customerId = searchParams.get("customerId");
  const where: Record<string, unknown> = { userId: session.userId };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.startAt = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),    };
  }
  if (status) where.status = status;
  if (serviceId) where.serviceId = serviceId;
  if (customerId) where.customerId = customerId;
  const bookings = await db.booking.findMany({
    where,
    include: {
      service: { select: { name: true, color: true, durationInMinutes: true, isVideoCall: true } },
      customer: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { startAt: "asc" },
  });
  return ok({ bookings });
});