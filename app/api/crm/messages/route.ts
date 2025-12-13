import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { messages, negotiations } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { jsonStringify } from "@/lib/db/queries/helpers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const negotiationId = searchParams.get("negotiation_id")

    if (!negotiationId) {
      return NextResponse.json({ error: "negotiation_id required" }, { status: 400 })
    }

    const data = await db
      .select()
      .from(messages)
      .where(eq(messages.negotiationId, negotiationId))
      .orderBy(asc(messages.createdAt))

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const [data] = await db
      .insert(messages)
      .values({
        negotiationId: body.negotiationId || body.negotiation_id,
        hhMessageId: body.hhMessageId || body.hh_message_id,
        author: body.author,
        text: body.text || body.message,
        readByApplicant: body.readByApplicant || body.read_by_applicant || false,
        readByEmployer: body.readByEmployer || body.read_by_employer || false,
        sentAt: body.sentAt ? new Date(body.sentAt) : undefined,
        readAt: body.readAt ? new Date(body.readAt) : undefined,
        attachments: jsonStringify(body.attachments || []),
      })
      .returning()

    // Update negotiation
    const negotiationId = body.negotiationId || body.negotiation_id
    const [negotiation] = await db
      .select()
      .from(negotiations)
      .where(eq(negotiations.id, negotiationId))
      .limit(1)

    if (negotiation) {
      await db
        .update(negotiations)
        .set({
          messagesCount: (negotiation.messagesCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(negotiations.id, negotiationId))
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
