import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { applications } from "@/lib/db/schema"
import { eq, desc, gte, lte, and } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const vacancyId = searchParams.get("vacancy_id")
    const minScore = searchParams.get("min_score")
    const maxScore = searchParams.get("max_score")
    const status = searchParams.get("status")

    let query = db.select().from(applications).orderBy(desc(applications.createdAt))

    if (vacancyId) {
      query = query.where(eq(applications.vacancyId, vacancyId)) as any
    }

    if (minScore) {
      query = query.where(gte(applications.score, Number.parseFloat(minScore))) as any
    }

    if (maxScore) {
      query = query.where(lte(applications.score, Number.parseFloat(maxScore))) as any
    }

    if (status) {
      query = query.where(eq(applications.status, status)) as any
    }

    const data = await query

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in applications route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
