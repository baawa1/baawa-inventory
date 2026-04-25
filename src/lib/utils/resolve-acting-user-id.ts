import { prisma } from '@/lib/db';

interface SessionActor {
  id?: string | null;
  email?: string | null;
}

export async function resolveActingUserId(
  sessionActor: SessionActor
): Promise<number | null> {
  const parsedId = sessionActor.id
    ? Number.parseInt(sessionActor.id, 10)
    : Number.NaN;

  const candidates = [];

  if (Number.isInteger(parsedId)) {
    candidates.push({ id: parsedId });
  }

  if (sessionActor.email) {
    candidates.push({
      email: {
        equals: sessionActor.email,
        mode: 'insensitive' as const,
      },
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  const actingUser = await prisma.user.findFirst({
    where: {
      OR: candidates,
    },
    select: {
      id: true,
    },
  });

  return actingUser?.id ?? null;
}
