import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { scoredCandidateToDBCandidate, createDBApplication } from "@/lib/supabase/db"
import type { ScoredCandidate } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { candidates, vacancyId, searchSessionId } = (await request.json()) as {
      candidates: ScoredCandidate[]
      vacancyId?: string
      searchSessionId?: string
    }

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: "Нет кандидатов для сохранения" }, { status: 400 })
    }

    const supabase = await createClient()

    const savedCandidates: string[] = []
    const errors: string[] = []

    for (const candidate of candidates) {
      const dbCandidate = scoredCandidateToDBCandidate(candidate)

      // Check if candidate already exists by external_id
      const { data: existing } = await supabase
        .from("candidates")
        .select("id")
        .eq("external_id", dbCandidate.external_id)
        .single()

      let candidateId: string

      if (existing) {
        // Update existing candidate
        const { error: updateError } = await supabase
          .from("candidates")
          .update({
            ...dbCandidate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (updateError) {
          errors.push(`Ошибка обновления ${candidate.fullName}: ${updateError.message}`)
          continue
        }
        candidateId = existing.id
      } else {
        // Insert new candidate
        const { data: inserted, error: insertError } = await supabase
          .from("candidates")
          .insert(dbCandidate)
          .select("id")
          .single()

        if (insertError) {
          errors.push(`Ошибка сохранения ${candidate.fullName}: ${insertError.message}`)
          continue
        }
        candidateId = inserted.id
      }

      savedCandidates.push(candidateId)

      // Create application if vacancy provided
      if (vacancyId && candidateId) {
        // Check if application already exists
        let existingAppQuery = supabase
          .from("applications")
          .select("id")
          .eq("candidate_id", candidateId)
          .eq("vacancy_id", vacancyId)

        // If we have a session, check by session+candidate unique constraint
        if (searchSessionId) {
          existingAppQuery = existingAppQuery.eq("search_session_id", searchSessionId)
        }

        const { data: existingApp } = await existingAppQuery.single()

        if (!existingApp) {
          const application = createDBApplication(candidate, candidateId, vacancyId, searchSessionId)

          const { error: appError } = await supabase.from("applications").insert(application)

          if (appError) {
            errors.push(`Ошибка создания заявки для ${candidate.fullName}: ${appError.message}`)
          }
        } else {
          // Update existing application with new score
          const { error: updateAppError } = await supabase
            .from("applications")
            .update({
              score: candidate.score,
              score_breakdown: candidate.breakdown,
              rating: candidate.rating,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingApp.id)

          if (updateAppError) {
            errors.push(`Ошибка обновления заявки для ${candidate.fullName}: ${updateAppError.message}`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      saved: savedCandidates.length,
      total: candidates.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error saving candidates:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка сохранения" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("source", "hh.ru")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ candidates: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка загрузки" }, { status: 500 })
  }
}