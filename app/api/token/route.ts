import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { userApiTokens } from "@/lib/db/schema"
import { encryptToken, decryptToken } from "@/lib/encryption"
import { getUserFromSession } from "@/lib/auth/session"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const tokenSchema = z.object({
  token: z.string().min(1, "Токен обязателен"),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const body = await request.json()
    const { token } = tokenSchema.parse(body)

    // Шифруем токен
    const encryptedToken = encryptToken(token)

    // Деактивируем старые токены
    await db
      .update(userApiTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(userApiTokens.userId, user.id), eq(userApiTokens.provider, "hh.ru"), eq(userApiTokens.isActive, true)))

    // Вставляем новый токен
    await db.insert(userApiTokens).values({
      userId: user.id,
      encryptedToken,
      provider: "hh.ru",
      isActive: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Token save error:", error)
    return NextResponse.json({ error: "Ошибка сохранения токена" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Получаем активный токен
    const [tokenData] = await db
      .select({
        encryptedToken: userApiTokens.encryptedToken,
        createdAt: userApiTokens.createdAt,
      })
      .from(userApiTokens)
      .where(and(eq(userApiTokens.userId, user.id), eq(userApiTokens.provider, "hh.ru"), eq(userApiTokens.isActive, true)))
      .limit(1)

    if (!tokenData) {
      return NextResponse.json({ hasToken: false })
    }

    // НЕ возвращаем расшифрованный токен на клиент!
    // Токен должен использоваться только на сервере
    return NextResponse.json({ hasToken: true, createdAt: tokenData.createdAt })
  } catch (error) {
    console.error("Token GET error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Деактивируем все токены пользователя
    await db
      .update(userApiTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(userApiTokens.userId, user.id), eq(userApiTokens.provider, "hh.ru"), eq(userApiTokens.isActive, true)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Token DELETE error:", error)
    return NextResponse.json({ error: "Ошибка удаления токена" }, { status: 500 })
  }
}


