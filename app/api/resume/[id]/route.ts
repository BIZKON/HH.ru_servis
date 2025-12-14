import { type NextRequest, NextResponse } from "next/server"
import { getResumeDetails, getResumeWithAccess, transformResumeToCandidate } from "@/lib/hh-api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    const { searchParams } = new URL(request.url)
    const withAccess = searchParams.get("with_access") === "true"

    if (!token) {
      return NextResponse.json({ error: "API токен обязателен" }, { status: 400 })
    }

    // Используем getResumeWithAccess если запрошено, иначе обычный getResumeDetails
    const resume = withAccess
      ? await getResumeWithAccess(token, id, true)
      : await getResumeDetails(token, id)
    
    const candidate = transformResumeToCandidate(resume)

    return NextResponse.json({ candidate, raw: resume })
  } catch (error) {
    console.error("Resume API error:", error)
    const message = error instanceof Error ? error.message : "Произошла ошибка при получении резюме"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
