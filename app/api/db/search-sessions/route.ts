import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { searchSessions } from "@/lib/db/schema"
import { createDBSearchSession } from "@/lib/db/converters"
import type { ScoredCandidate } from "@/lib/types"
import { eq, desc } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function POST(request: NextRequest) {
  try {
    const { searchParams, candidates, vacancyId } = (await request.json()) as {
      searchParams: Record<string, any>
      candidates: ScoredCandidate[]
      vacancyId?: string
    }

    if (!searchParams || !candidates) {
      return NextResponse.json({ error: "searchParams и candidates обязательны" }, { status: 400 })
    }

    const dbSearchSession = createDBSearchSession(searchParams, candidates, vacancyId)

    const [inserted] = await db
      .insert(searchSessions)
      .values({
        ...dbSearchSession,
        searchParams: jsonStringify(dbSearchSession.search_params),
      })
      .returning()

    return NextResponse.json({ searchSession: inserted })
  } catch (error) {
    console.error("Search session API error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vacancyId = searchParams.get("vacancy_id")
    const limit = Number(searchParams.get("limit")) || 10

    let query = db
      .select()
      .from(searchSessions)
      .orderBy(desc(searchSessions.createdAt))
      .limit(limit)

    if (vacancyId) {
      query = query.where(eq(searchSessions.vacancyId, vacancyId)) as any
    }

    const sessions = await query

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
