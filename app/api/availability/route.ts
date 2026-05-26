import { apiHandler, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { AvailabilitySchema } from "@/lib/validators";

export const GET = apiHandler(async (req) => {
  const session = await requireSession();
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const availability = await db.availability.findMany({
    where: {
      userId: session.userId,
      serviceId: serviceId ?? null,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return ok({ availability });
});

export const PUT = apiHandler(async (req) => {
  const session = await requireSession();
  const data = AvailabilitySchema.parse(await req.json());
  for (const block of data.blocks) {
    if (block.startTime >= block.endTime) {
      throw new Error(`Bloco inválido no dia ${block.dayOfWeek}: início deve ser antes do fim.`);
    }
  }
  // Deleta blocos anteriores do escopo
  await db.availability.deleteMany({
    where: {
      userId: session.userId,
      serviceId: data.serviceId ?? null,
    },
  });
  // Insere novos blocos
  if (data.blocks.length > 0) {
    await db.availability.createMany({
      data: data.blocks.map((block) => ({
        userId: session.userId,
        serviceId: data.serviceId ?? null,
        dayOfWeek: block.dayOfWeek,
        startTime: block.startTime,
        endTime: block.endTime,
        isActive: block.isActive,
      })),
    });
  }
  return ok({ ok: true, count: data.blocks.length });
});