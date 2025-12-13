import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exports } from "@/lib/db/schema"
import { createDBExport } from "@/lib/db/converters"
import { desc } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function POST(request: NextRequest) {
  try {
    const {
      candidatesCount,
      fileName,
      format = "csv",
      searchSessionId,
      vacancyId,
      appliedFilters,
      scoreRange,
    } = await request.json()

    if (!candidatesCount || !fileName) {
      return NextResponse.json({ error: "candidatesCount и fileName обязательны" }, { status: 400 })
    }

    const dbExport = createDBExport(
      candidatesCount,
      fileName,
      format,
      searchSessionId,
      vacancyId,
      appliedFilters,
      scoreRange,
    )

    const [exportRecord] = await db
      .insert(exports)
      .values({
        ...dbExport,
        appliedFilters: jsonStringify(dbExport.applied_filters),
      })
      .returning()

    return NextResponse.json({ export: exportRecord })
  } catch (error) {
    console.error("Export API error:", error)
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 20

    const exportsList = await db
      .select()
      .from(exports)
      .orderBy(desc(exports.createdAt))
      .limit(limit)

    return NextResponse.json({ exports: exportsList })
  } catch (error) {
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 })
  }
}
