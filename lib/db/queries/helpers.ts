// Helper функции для работы с JSON в SQLite

export function jsonStringify(value: any): string | null {
  if (value === null || value === undefined) {
    return null
  }
  return JSON.stringify(value)
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


