import { NextRequest, NextResponse } from "next/server"
import { getUserFromSession } from "./session"

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromSession()

  if (!user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
  }

  return user
}


