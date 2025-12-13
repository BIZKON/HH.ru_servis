import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { negotiations, activities } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vacancyId = searchParams.get("vacancy_id")
    const state = searchParams.get("state")

    let query = db.select().from(negotiations).orderBy(desc(negotiations.updatedAt))

    if (vacancyId && state) {
      query = query.where(and(eq(negotiations.vacancyId, vacancyId), eq(negotiations.state, state))) as any
    } else if (vacancyId) {
      query = query.where(eq(negotiations.vacancyId, vacancyId)) as any
    } else if (state) {
      query = query.where(eq(negotiations.state, state)) as any
    }

    const data = await query

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Negotiations API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const [data] = await db.insert(negotiations).values({
      ...body,
      topics: jsonStringify(body.topics),
      actions: jsonStringify(body.actions),
    }).returning()

    // Log activity
    await db.insert(activities).values({
      candidateId: body.candidateId || body.candidate_id,
      vacancyId: body.vacancyId || body.vacancy_id,
      negotiationId: data.id,
      actionType: body.source === "employer" ? "invitation_sent" : "response_received",
      title: body.source === "employer" ? "Отправлено приглашение" : "Получен отклик",
      metadata: jsonStringify({ negotiation_id: data.id }),
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Negotiation create API error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
