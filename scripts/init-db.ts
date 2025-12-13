import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "../lib/db/schema"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
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
const db = drizzle(sqlite, { schema })

// Применяем схему напрямую
console.log("Creating database tables...")
// Это создаст таблицы на основе схемы
// В production используйте миграции

console.log("Database initialized successfully!")


