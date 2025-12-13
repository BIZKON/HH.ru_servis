import { type NextRequest, NextResponse } from "next/server"
import { searchResumes, transformResumeToCandidate } from "@/lib/hh-api"
import type { HHSearchParams } from "@/lib/types"
import { getUserFromSession } from "@/lib/auth/session"
import { getDecryptedToken } from "@/lib/db/queries/tokens"

export async function POST(request: NextRequest) {
  try {
    // Получаем пользователя
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Получаем токен из БД
    const token = await getDecryptedToken(user.id)
    if (!token) {
      return NextResponse.json({ error: "API токен не найден. Пожалуйста, введите токен." }, { status: 400 })
    }

    const body = await request.json()
    const { resume_search_period, ...searchParams } = body as {
      resume_search_period?: number
    } & HHSearchParams

    if (!searchParams.text) {
      return NextResponse.json({ error: "Поисковый запрос обязателен" }, { status: 400 })
    }

    const params: HHSearchParams = {
      ...searchParams,
      per_page: searchParams.per_page || 20,
      page: searchParams.page || 0,
    }

    // Add resume_search_period if provided (days since last resume update)
    if (resume_search_period) {
      ;(params as any).resume_search_period = resume_search_period
    }

    const result = await searchResumes(token, params)

    const candidates = result.data.map(transformResumeToCandidate)

    return NextResponse.json({
      candidates,
      items: result.data,
      found: result.found,
      pages: result.pages,
      page: result.page,
    })
  } catch (error) {
    console.error("Search API error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при поиске"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
