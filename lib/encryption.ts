import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32

// Получаем ключ шифрования из переменных окружения
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  // Если ключ в hex формате (64 символа)
  if (key.length === 64) {
    return Buffer.from(key, "hex")
  }

  // Иначе используем PBKDF2 для генерации ключа из строки
  return crypto.pbkdf2Sync(key, "salt", 100000, KEY_LENGTH, "sha512")
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(token, "utf8", "hex")
  encrypted += cipher.final("hex")

  const tag = cipher.getAuthTag()

  // Формат: iv:tag:encrypted
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  const parts = encryptedToken.split(":")

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format")
  }

  const [ivHex, tagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}


