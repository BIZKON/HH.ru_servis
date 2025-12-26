import { type NextRequest, NextResponse } from "next/server"
import { getResumeWithAccess, transformResumeToCandidate } from "@/lib/hh-api"
import { getUserFromSession } from "@/lib/auth/session"
import { getDecryptedToken } from "@/lib/db/queries/tokens"

export async function POST(request: NextRequest) {
  try {
    // Получаем пользователя (для авторизованных пользователей)
    const user = await getUserFromSession()

    const body = await request.json()
    const { resumeId, token: providedToken } = body as { resumeId: string; token?: string }

    if (!resumeId) {
      return NextResponse.json({ error: "ID резюме обязателен" }, { status: 400 })
    }

    // Определяем токен: из запроса или из БД (для авторизованных пользователей)
    let token: string | null = providedToken || null

    if (!token && user) {
      // Для авторизованного пользователя берем токен из БД
      token = await getDecryptedToken(user.id)
    }

    if (!token) {
      return NextResponse.json({ error: "API токен не найден" }, { status: 400 })
    }

    // Получаем полные данные резюме с автоматической оплатой доступа
    const resume = await getResumeWithAccess(token, resumeId, true)
    const candidate = transformResumeToCandidate(resume)

    return NextResponse.json({ candidate, raw: resume })
  } catch (error) {
    console.error("Resume enrich API error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при получении резюме"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


