import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invitations, applications } from "@/lib/db/schema"
import { createDBInvitation } from "@/lib/db/converters"
import { eq, desc, and } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const { applicationId, candidateId, vacancyId, message, hhInvitationId } = await request.json()

    if (!applicationId || !candidateId || !vacancyId) {
      return NextResponse.json({ error: "applicationId, candidateId и vacancyId обязательны" }, { status: 400 })
    }

    const dbInvitation = createDBInvitation(applicationId, candidateId, vacancyId, message || "", hhInvitationId)

    // Создаем запись о приглашении
    const [invitation] = await db.insert(invitations).values(dbInvitation).returning()

    // Обновляем статус application
    await db
      .update(applications)
      .set({ status: "invited", updatedAt: new Date() })
      .where(eq(applications.id, applicationId))

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error("Invitation API error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get("candidate_id")
    const vacancyId = searchParams.get("vacancy_id")

    let query = db.select().from(invitations).orderBy(desc(invitations.sentAt))

    if (candidateId && vacancyId) {
      query = query.where(and(eq(invitations.candidateId, candidateId), eq(invitations.vacancyId, vacancyId))) as any
    } else if (candidateId) {
      query = query.where(eq(invitations.candidateId, candidateId)) as any
    } else if (vacancyId) {
      query = query.where(eq(invitations.vacancyId, vacancyId)) as any
    }

    const invitationsList = await query

    return NextResponse.json({ invitations: invitationsList })
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
