import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { candidates, applications } from "@/lib/db/schema"
import { scoredCandidateToDBCandidate, createDBApplication } from "@/lib/db/converters"
import type { ScoredCandidate } from "@/lib/types"
import { eq, and, desc } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function POST(request: Request) {
  try {
    const { candidates: candidatesList, vacancyId, searchSessionId } = (await request.json()) as {
      candidates: ScoredCandidate[]
      vacancyId?: string
      searchSessionId?: string
    }

    if (!candidatesList || !Array.isArray(candidatesList) || candidatesList.length === 0) {
      return NextResponse.json({ error: "Нет кандидатов для сохранения" }, { status: 400 })
    }

    const savedCandidates: string[] = []
    const errors: string[] = []

    for (const candidate of candidatesList) {
      const dbCandidate = scoredCandidateToDBCandidate(candidate)

      // Check if candidate already exists by external_id
      const [existing] = await db
        .select({ id: candidates.id })
        .from(candidates)
        .where(eq(candidates.externalId, dbCandidate.external_id))
        .limit(1)

      let candidateId: string

      if (existing) {
        // Update existing candidate
        await db
          .update(candidates)
          .set({
            ...dbCandidate,
            skills: jsonStringify(dbCandidate.skills),
            tags: jsonStringify(dbCandidate.tags),
            updatedAt: new Date(),
          })
          .where(eq(candidates.id, existing.id))
        candidateId = existing.id
      } else {
        // Insert new candidate
        const [inserted] = await db
          .insert(candidates)
          .values({
            ...dbCandidate,
            skills: jsonStringify(dbCandidate.skills),
            tags: jsonStringify(dbCandidate.tags),
          })
          .returning({ id: candidates.id })
        candidateId = inserted.id
      }

      savedCandidates.push(candidateId)

      // Create application if vacancy provided
      if (vacancyId && candidateId) {
        // Check if application already exists
        let existingApp
        if (searchSessionId) {
          ;[existingApp] = await db
            .select({ id: applications.id })
            .from(applications)
            .where(
              and(
                eq(applications.candidateId, candidateId),
                eq(applications.vacancyId, vacancyId),
                eq(applications.searchSessionId, searchSessionId),
              ),
            )
            .limit(1)
        } else {
          ;[existingApp] = await db
            .select({ id: applications.id })
            .from(applications)
            .where(and(eq(applications.candidateId, candidateId), eq(applications.vacancyId, vacancyId)))
            .limit(1)
        }

        if (!existingApp) {
          const application = createDBApplication(candidate, candidateId, vacancyId, searchSessionId)
          await db.insert(applications).values({
            ...application,
            scoreBreakdown: jsonStringify(application.score_breakdown),
          })
        } else {
          // Update existing application with new score
          await db
            .update(applications)
            .set({
              score: candidate.score,
              scoreBreakdown: jsonStringify(candidate.breakdown),
              rating: candidate.rating,
              updatedAt: new Date(),
            })
            .where(eq(applications.id, existingApp.id))
        }
      }
    }

    return NextResponse.json({
      success: true,
      saved: savedCandidates.length,
      total: candidatesList.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error saving candidates:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка сохранения" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const candidatesList = await db
      .select()
      .from(candidates)
      .where(eq(candidates.source, "hh.ru"))
      .orderBy(desc(candidates.createdAt))
      .limit(500)

    // Parse JSON fields
    const parsedCandidates = candidatesList.map((c) => ({
      ...c,
      skills: c.skills ? JSON.parse(c.skills) : [],
      tags: c.tags ? JSON.parse(c.tags) : [],
    }))

    return NextResponse.json({ candidates: parsedCandidates })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка загрузки" }, { status: 500 })
  }
}
