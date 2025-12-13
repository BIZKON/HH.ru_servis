import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import { mkdirSync } from "fs"
import { dirname } from "path"

const databasePath = process.env.DATABASE_PATH || "./data/database.db"

// Создаем директорию data если её нет
try {
  mkdirSync(dirname(databasePath), { recursive: true })
} catch {
  // Директория уже существует
}

const sqlite = new Database(databasePath)
export const db = drizzle(sqlite, { schema })

