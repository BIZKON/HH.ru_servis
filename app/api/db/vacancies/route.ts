import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { vacancies } from "@/lib/db/schema"
import { vacancyConfigToDBVacancy } from "@/lib/db/converters"
import type { VacancyConfig } from "@/lib/types"
import { eq, desc } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function POST(request: Request) {
  try {
    const config = (await request.json()) as VacancyConfig

    if (!config.name) {
      return NextResponse.json({ error: "Название вакансии обязательно" }, { status: 400 })
    }

    const dbVacancy = vacancyConfigToDBVacancy(config)

    // Check if vacancy already exists by external_id
    if (config.id) {
      const [existing] = await db
        .select({ id: vacancies.id })
        .from(vacancies)
        .where(eq(vacancies.externalId, config.id))
        .limit(1)

      if (existing) {
        // Update existing vacancy
        const [updated] = await db
          .update(vacancies)
          .set({
            ...dbVacancy,
            skills: jsonStringify(dbVacancy.skills),
            updatedAt: new Date(),
          })
          .where(eq(vacancies.id, existing.id))
          .returning({ id: vacancies.id })

        return NextResponse.json({ success: true, id: updated.id, updated: true })
      }
    }

    // Insert new vacancy
    const [inserted] = await db
      .insert(vacancies)
      .values({
        ...dbVacancy,
        skills: jsonStringify(dbVacancy.skills),
      })
      .returning({ id: vacancies.id })

    return NextResponse.json({ success: true, id: inserted.id, created: true })
  } catch (error) {
    console.error("Error saving vacancy:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка сохранения" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const data = await db
      .select()
      .from(vacancies)
      .orderBy(desc(vacancies.createdAt))
      .limit(50)

    return NextResponse.json({ vacancies: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ошибка загрузки" }, { status: 500 })
  }
}
