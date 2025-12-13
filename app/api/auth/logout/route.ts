import { NextRequest, NextResponse } from "next/server"
import { deleteSession, getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (session) {
      await deleteSession(session.sessionId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Ошибка выхода" }, { status: 500 })
  }
}


