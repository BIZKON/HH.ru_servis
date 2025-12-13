import { db } from "@/lib/db"
import { userApiTokens } from "@/lib/db/schema"
import { decryptToken } from "@/lib/encryption"
import { eq, and } from "drizzle-orm"

export async function getDecryptedToken(userId: string): Promise<string | null> {
  const [tokenData] = await db
    .select({
      encryptedToken: userApiTokens.encryptedToken,
    })
    .from(userApiTokens)
    .where(and(eq(userApiTokens.userId, userId), eq(userApiTokens.provider, "hh.ru"), eq(userApiTokens.isActive, true)))
    .limit(1)

  if (!tokenData) {
    return null
  }

  try {
    return decryptToken(tokenData.encryptedToken)
  } catch (error) {
    console.error("Token decryption error:", error)
    return null
  }
}


