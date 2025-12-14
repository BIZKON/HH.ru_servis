// Helper функции для работы с JSON в SQLite

export function jsonStringify(value: any): string | null {
  if (value === null || value === undefined) {
    return null
  }
  try {
    return JSON.stringify(value)
  } catch (error) {
    console.error("jsonStringify error:", error, "value:", value)
    return null
  }
}

export function jsonParse<T>(value: string | null): T | null {
  if (value === null || value === undefined) {
    return null
  }
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}


