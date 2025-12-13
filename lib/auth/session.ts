import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { sessions, users } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { randomUUID } from "crypto"

const SESSION_COOKIE_NAME = "session_id"
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 дней

export async function createSession(userId: string): Promise<string> {
  const sessionId = randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  // Устанавливаем cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  })

  return sessionId
}

export async function getSession(): Promise<{ userId: string; sessionId: string } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionId) {
    return null
  }

  const session = await db
    .select({
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1)

  if (session.length === 0) {
    return null
  }

  return {
    userId: session[0].userId,
    sessionId,
  }
}

export async function getUserFromSession() {
  const session = await getSession()
  if (!session) {
    return null
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  return user.length > 0 ? user[0] : null
}

export async function deleteSession(sessionId?: string): Promise<void> {
  const cookieStore = await cookies()
  const id = sessionId || cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (id) {
    await db.delete(sessions).where(eq(sessions.id, id))
  }

  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(gt(new Date(), sessions.expiresAt))
}


