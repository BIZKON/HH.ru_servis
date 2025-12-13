import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { candidates, activities } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const [existing] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const [data] = await db
      .update(candidates)
      .set({
        ...body,
        skills: body.skills ? jsonStringify(body.skills) : existing.skills,
        tags: body.tags ? jsonStringify(body.tags) : existing.tags,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning()

    // Log activity
    if (body.status) {
      await db.insert(activities).values({
        candidateId: id,
        actionType: "status_changed",
        title: `Статус изменен на: ${body.status}`,
        metadata: jsonStringify({ new_status: body.status }),
      })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
