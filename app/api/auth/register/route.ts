import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { eq } from "drizzle-orm"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = registerSchema.parse(body)

    // Проверяем, существует ли пользователь
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 })
    }

    // Создаем пользователя
    const passwordHash = await hashPassword(password)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
      })
      .returning({ id: users.id, email: users.email })

    // Создаем сессию
    await createSession(newUser.id)

    return NextResponse.json({ user: { id: newUser.id, email: newUser.email } }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Register error:", error)
    return NextResponse.json({ error: "Ошибка регистрации" }, { status: 500 })
  }
}


