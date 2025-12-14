import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { candidates, applications } from "@/lib/db/schema"
import { scoredCandidateToDBCandidate, createDBApplication } from "@/lib/db/converters"
import type { ScoredCandidate } from "@/lib/types"
import { eq, and, desc } from "drizzle-orm"
import { jsonStringify, jsonParse } from "@/lib/db/queries/helpers"

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
      try {
        const dbCandidate = scoredCandidateToDBCandidate(candidate)

        // Check if candidate already exists by external_id
        const [existing] = await db
          .select({ id: candidates.id })
          .from(candidates)
          .where(eq(candidates.externalId, dbCandidate.external_id))
          .limit(1)

        let candidateId: string

        if (existing) {
          // Update existing candidate - convert snake_case to camelCase for Drizzle
          await db
            .update(candidates)
            .set({
              externalId: dbCandidate.external_id,
              fullName: dbCandidate.full_name,
              firstName: dbCandidate.first_name,
              lastName: dbCandidate.last_name,
              middleName: dbCandidate.middle_name,
              email: dbCandidate.email,
              phone: dbCandidate.phone,
              currentPosition: dbCandidate.current_position,
              currentCompany: dbCandidate.current_company,
              location: dbCandidate.location,
              experienceYears: dbCandidate.experience_years,
              skills: jsonStringify(dbCandidate.skills),
              tags: jsonStringify(dbCandidate.tags),
              resumeUrl: dbCandidate.resume_url,
              resumeText: dbCandidate.resume_text,
              summary: dbCandidate.summary,
              source: dbCandidate.source,
              companyId: dbCandidate.company_id,
              status: dbCandidate.status,
              paidAccess: dbCandidate.paid_access,
              notes: dbCandidate.notes,
              updatedAt: new Date(),
            })
            .where(eq(candidates.id, existing.id))
          candidateId = existing.id
        } else {
          // Insert new candidate - convert snake_case to camelCase for Drizzle
          const [inserted] = await db
            .insert(candidates)
            .values({
              externalId: dbCandidate.external_id,
              fullName: dbCandidate.full_name,
              firstName: dbCandidate.first_name,
              lastName: dbCandidate.last_name,
              middleName: dbCandidate.middle_name,
              email: dbCandidate.email,
              phone: dbCandidate.phone,
              currentPosition: dbCandidate.current_position,
              currentCompany: dbCandidate.current_company,
              location: dbCandidate.location,
              experienceYears: dbCandidate.experience_years,
              skills: jsonStringify(dbCandidate.skills),
              tags: jsonStringify(dbCandidate.tags),
              resumeUrl: dbCandidate.resume_url,
              resumeText: dbCandidate.resume_text,
              summary: dbCandidate.summary,
              source: dbCandidate.source,
              companyId: dbCandidate.company_id,
              status: dbCandidate.status,
              paidAccess: dbCandidate.paid_access,
              notes: dbCandidate.notes,
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
              searchSessionId: application.search_session_id,
              candidateId: application.candidate_id,
              vacancyId: application.vacancy_id,
              status: application.status,
              score: application.score,
              scoreBreakdown: jsonStringify(application.score_breakdown),
              rating: application.rating,
              notes: application.notes,
              assignedTo: application.assigned_to,
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка"
        errors.push(`Ошибка сохранения ${candidate.fullName}: ${errorMessage}`)
        continue
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

    // Parse JSON fields with error handling per candidate
    const parsedCandidates = candidatesList.map((c) => ({
      ...c,
      skills: jsonParse<string[]>(c.skills) || [],
      tags: jsonParse<string[]>(c.tags) || [],
    }))

    return NextResponse.json({ candidates: parsedCandidates })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка загрузки" }, { status: 500 })
  }
}