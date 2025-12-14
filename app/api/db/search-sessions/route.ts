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
        vacancyId: dbSearchSession.vacancy_id,
        searchText: dbSearchSession.search_text,
        searchArea: dbSearchSession.search_area,
        searchExperience: dbSearchSession.search_experience,
        searchEmployment: dbSearchSession.search_employment,
        searchSchedule: dbSearchSession.search_schedule,
        searchSalaryFrom: dbSearchSession.search_salary_from,
        searchOrderBy: dbSearchSession.search_order_by,
        searchParams: jsonStringify(dbSearchSession.search_params),
        totalFound: dbSearchSession.total_found,
        totalScored: dbSearchSession.total_scored,
        avgScore: dbSearchSession.avg_score,
        minScore: dbSearchSession.min_score,
        maxScore: dbSearchSession.max_score,
      })
      .returning()

    return NextResponse.json({ searchSession: inserted })
  } catch (error) {
    console.error("Search session API error:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error details:", { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: "Внутренняя ошибка сервера",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    )
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
