// Пакетная загрузка резюме с прогрессом и автосохранением

import type { HHResume, Candidate, VacancyConfig } from "./types"
import { transformResumeToCandidate } from "./hh-api"
import { scoreCandidate, type ScoringConfig, type CandidateScore } from "./scoring"

export interface BatchProgress {
  loaded: number
  total: number
  page: number
  pages: number
  status: "loading" | "scoring" | "saving" | "done" | "error"
  message: string
  saved?: number
  searchSessionId?: string
  vacancyId?: string
}

export interface ScoredCandidate extends Candidate, CandidateScore {}

interface SearchParams {
  text: string
  area?: string
  experience?: string
  employment?: string
  schedule?: string
  salary_from?: number
  salary_to?: number
  order_by?: string
  resume_search_period?: number
}

export async function loadAllResumes(
  token: string,
  searchParams: SearchParams,
  scoringConfig: ScoringConfig,
  onProgress: (progress: BatchProgress) => void,
  maxResults = 100,
  vacancyConfig?: VacancyConfig,
): Promise<ScoredCandidate[]> {
  const allResumes: HHResume[] = []
  const maxPages = Math.ceil(maxResults / 20)

  console.log("[v0] Starting batch load with autosave:", !!vacancyConfig)

  try {
    // Phase 1: Loading pages
    for (let page = 0; page < maxPages; page++) {
      onProgress({
        loaded: allResumes.length,
        total: maxResults,
        page: page + 1,
        pages: maxPages,
        status: "loading",
        message: `Загрузка страницы ${page + 1}...`,
      })

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...searchParams,
          page,
          per_page: 20,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Ошибка загрузки: ${response.status}`)
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        break
      }

      allResumes.push(...data.items)

      onProgress({
        loaded: allResumes.length,
        total: Math.min(maxResults, data.found),
        page: page + 1,
        pages: Math.min(maxPages, data.pages),
        status: "loading",
        message: `Загружено ${allResumes.length} резюме`,
      })

      if (allResumes.length >= maxResults) {
        break
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Phase 2: Scoring
    onProgress({
      loaded: allResumes.length,
      total: allResumes.length,
      page: maxPages,
      pages: maxPages,
      status: "scoring",
      message: "Оценка кандидатов...",
    })

    const scoredCandidates: ScoredCandidate[] = allResumes.slice(0, maxResults).map((resume) => {
      const candidate = transformResumeToCandidate(resume)
      const score = scoreCandidate(resume as any, scoringConfig)
      return { ...candidate, ...score }
    })

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score)

    console.log("[v0] Scored candidates count:", scoredCandidates.length)
    console.log("[v0] Autosave enabled:", !!vacancyConfig)
    console.log(
      "[v0] Vacancy config:",
      vacancyConfig ? JSON.stringify({ name: vacancyConfig.name, id: vacancyConfig.id }) : "none",
    )

    // Сохраняем кандидатов в базу данных, даже если нет вакансии
    if (vacancyConfig) {
      onProgress({
        loaded: scoredCandidates.length,
        total: scoredCandidates.length,
        page: maxPages,
        pages: maxPages,
        status: "saving",
        message: "Сохранение в базу данных...",
        saved: 0,
      })

      try {
        let vacancyId: string | undefined

        console.log("[v0] Creating/finding vacancy:", vacancyConfig.name || "No name")
        console.log("[v0] Vacancy config full:", JSON.stringify(vacancyConfig))

        if (vacancyConfig.name) {
          const vacancyResponse = await fetch("/api/db/vacancies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vacancyConfig }),
          })

          console.log("[v0] Vacancy API response status:", vacancyResponse.status)

          if (vacancyResponse.ok) {
            const vacancyData = await vacancyResponse.json()
            vacancyId = vacancyData.vacancy?.id
            console.log("[v0] Vacancy created/found with ID:", vacancyId)
          } else {
            const errorText = await vacancyResponse.text()
            console.error("[v0] Vacancy creation failed:", errorText)
          }
        } else {
          console.warn("[v0] No vacancy name/title in config, skipping vacancy creation")
        }

        let searchSessionId: string | undefined

        console.log("[v0] Creating search session with vacancy:", vacancyId || "none")

        // Создаем сессию поиска даже без вакансии
        const sessionResponse = await fetch("/api/db/search-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchParams,
            candidates: scoredCandidates,
            vacancyId: vacancyId || undefined,
          }),
        })

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          searchSessionId = sessionData.searchSession?.id
          console.log("[v0] Search session ID:", searchSessionId)
        } else {
          console.error("[v0] Session creation failed:", await sessionResponse.text())
        }

        const batchSize = 10
        let savedCount = 0

        console.log("[v0] Starting to save candidates in batches of", batchSize)

        for (let i = 0; i < scoredCandidates.length; i += batchSize) {
          const batch = scoredCandidates.slice(i, i + batchSize)

          console.log("[v0] Saving batch", Math.floor(i / batchSize) + 1, "with", batch.length, "candidates")

          const response = await fetch("/api/db/candidates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidates: batch,
              vacancyId: vacancyId || undefined,
              searchSessionId,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            savedCount += data.saved || batch.length
            console.log("[v0] Batch saved successfully. Total saved:", savedCount)
          } else {
            console.error("[v0] Batch save failed:", await response.text())
          }

          onProgress({
            loaded: scoredCandidates.length,
            total: scoredCandidates.length,
            page: maxPages,
            pages: maxPages,
            status: "saving",
            message: `Сохранено ${savedCount} из ${scoredCandidates.length} кандидатов...`,
            saved: savedCount,
            searchSessionId,
            vacancyId,
          })

          // Small delay between batches
          if (i + batchSize < scoredCandidates.length) {
            await new Promise((resolve) => setTimeout(resolve, 200))
          }
        }

        console.log("[v0] Autosave complete. Saved:", savedCount, "candidates")

        onProgress({
          loaded: scoredCandidates.length,
          total: scoredCandidates.length,
          page: maxPages,
          pages: maxPages,
          status: "done",
          message: `Готово! ${scoredCandidates.length} кандидатов оценено и сохранено`,
          saved: savedCount,
          searchSessionId,
          vacancyId,
        })
      } catch (saveError) {
        console.error("[v0] Auto-save error:", saveError)
        // Don't fail the whole operation if save fails
        onProgress({
          loaded: scoredCandidates.length,
          total: scoredCandidates.length,
          page: maxPages,
          pages: maxPages,
          status: "done",
          message: `Готово! ${scoredCandidates.length} кандидатов (ошибка сохранения в БД)`,
        })
      }
    } else {
      console.log("[v0] Autosave disabled, skipping database save")
      onProgress({
        loaded: scoredCandidates.length,
        total: scoredCandidates.length,
        page: maxPages,
        pages: maxPages,
        status: "done",
        message: `Готово! Найдено ${scoredCandidates.length} кандидатов`,
      })
    }

    return scoredCandidates
  } catch (error) {
    console.error("[v0] Batch load error:", error)
    onProgress({
      loaded: allResumes.length,
      total: maxResults,
      page: 0,
      pages: maxPages,
      status: "error",
      message: error instanceof Error ? error.message : "Произошла ошибка",
    })
    throw error
  }
}
