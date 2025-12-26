import { type NextRequest, NextResponse } from "next/server"
import { searchResumes, transformResumeToCandidate, HH_API_BASE, HH_USER_AGENT } from "@/lib/hh-api"
import type { HHSearchParams } from "@/lib/types"
import { getUserFromSession } from "@/lib/auth/session"
import { getDecryptedToken } from "@/lib/db/queries/tokens"

export async function POST(request: NextRequest) {
  try {
    console.log("[API] Search request received")

    // Получаем пользователя (для авторизованных пользователей)
    const user = await getUserFromSession()
    console.log("[API] User from session:", user ? user.email : "No user")

    const body = await request.json()
    console.log("[API] Request body:", JSON.stringify(body))

    const { token: providedToken, resume_search_period, ...searchParams } = body as {
      token?: string
      resume_search_period?: number
    } & HHSearchParams

    console.log("[API] Provided token:", providedToken ? `${providedToken.substring(0, 10)}...` : "No token in request")

    // Определяем токен: из запроса или из БД (для авторизованных пользователей)
    let token: string | null = providedToken || null

    if (!token && user) {
      // Для авторизованного пользователя берем токен из БД
      token = await getDecryptedToken(user.id)
    }

    if (!token) {
      console.error("[API] No token found!")
      return NextResponse.json({ error: "API токен не найден. Пожалуйста, введите токен." }, { status: 400 })
    }

    // Тестируем токен перед поиском
    console.log("[API] Testing token validity...")
    try {
      const testResponse = await fetch(`${HH_API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": HH_USER_AGENT,
          "HH-User-Agent": HH_USER_AGENT,
        },
      })

      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error("[API] Token test failed:", testResponse.status, errorText)
        return NextResponse.json({
          error: `Токен HH.ru недействительный или истек. Статус: ${testResponse.status}. ${errorText}`
        }, { status: 400 })
      }

      console.log("[API] Token test passed")
    } catch (testError) {
      console.error("[API] Token test error:", testError)
      return NextResponse.json({
        error: "Не удалось проверить токен HH.ru. Проверьте подключение к интернету."
      }, { status: 500 })
    }

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

    console.log("[API] Calling searchResumes with token:", token ? `${token.substring(0, 10)}...` : "NO TOKEN")
    console.log("[API] Search params:", JSON.stringify(params))

    const result = await searchResumes(token, params)

    console.log("[API] Search successful. Found:", result.found, "resumes")

    const candidates = result.data.map(transformResumeToCandidate)

    return NextResponse.json({
      candidates,
      items: result.data,
      found: result.found,
      pages: result.pages,
      page: result.page,
    })
  } catch (error) {
    console.error("[API] Search API error:", error)
    console.error("[API] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    // Если это ошибка от HH.ru API, возвращаем ее как есть
    if (error instanceof Error && (error.message.includes('API Error') || error.message.includes('Unrecognized'))) {
      console.error("[API] This appears to be an HH.ru API error, returning as-is")
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Произошла ошибка при поиске"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
