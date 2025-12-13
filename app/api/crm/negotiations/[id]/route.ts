import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { negotiations, activities } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [data] = await db
      .select()
      .from(negotiations)
      .where(eq(negotiations.id, id))
      .limit(1)

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const [existing] = await db
      .select()
      .from(negotiations)
      .where(eq(negotiations.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const [data] = await db
      .update(negotiations)
      .set({
        ...body,
        topics: body.topics ? jsonStringify(body.topics) : existing.topics,
        actions: body.actions ? jsonStringify(body.actions) : existing.actions,
        updatedAt: new Date(),
      })
      .where(eq(negotiations.id, id))
      .returning()

    // Log activity
    if (body.state) {
      await db.insert(activities).values({
        negotiationId: id,
        candidateId: data.candidateId,
        vacancyId: data.vacancyId,
        actionType: "status_changed",
        title: `Статус изменен на: ${body.state}`,
        metadata: jsonStringify({ old_state: existing.state, new_state: body.state }),
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
