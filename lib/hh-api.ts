import type { HHSearchParams, HHResume, Candidate, HHVacancy } from "./types"

const HH_API_BASE = "https://api.hh.ru"
// Format: AppName/Version (email)
const HH_USER_AGENT = "HH-Candidate-Search/1.0 (hr-search-app@v0.dev)"

export function formatExperience(months: number | null | undefined): string {
  if (!months) return "Без опыта"

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12

  if (years === 0) {
    return `${remainingMonths} мес.`
  }

  if (remainingMonths === 0) {
    return `${years} ${getYearWord(years)}`
  }

  return `${years} ${getYearWord(years)} ${remainingMonths} мес.`
}

function getYearWord(years: number): string {
  const lastDigit = years % 10
  const lastTwoDigits = years % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "лет"
  }

  if (lastDigit === 1) {
    return "год"
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "года"
  }

  return "лет"
}

export function formatSalary(salary: HHResume["salary"]): string {
  if (!salary || (!salary.amount && !salary.from && !salary.to)) {
    return "Не указана"
  }

  const currency = salary.currency === "RUR" ? "₽" : salary.currency || "₽"

  if (salary.amount) {
    return `${salary.amount.toLocaleString("ru-RU")} ${currency}`
  }

  if (salary.from && salary.to) {
    return `${salary.from.toLocaleString("ru-RU")} - ${salary.to.toLocaleString("ru-RU")} ${currency}`
  }

  if (salary.from) {
    return `от ${salary.from.toLocaleString("ru-RU")} ${currency}`
  }

  if (salary.to) {
    return `до ${salary.to.toLocaleString("ru-RU")} ${currency}`
  }

  return "Не указана"
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function transformResumeToCandidate(resume: HHResume): Candidate {
  const fullName = [resume.last_name, resume.first_name, resume.middle_name].filter(Boolean).join(" ")

  let email: string | undefined
  let phone: string | undefined

  if (resume.contact) {
    for (const contact of resume.contact) {
      if (contact.type.id === "email" && typeof contact.value === "string") {
        email = contact.value
      }
      if (contact.type.id === "cell" && typeof contact.value === "object") {
        phone = `+${contact.value.country}${contact.value.city}${contact.value.number}`
      }
    }
  }

  return {
    id: resume.id,
    fullName: fullName || "Имя не указано",
    title: resume.title || "Должность не указана",
    age: resume.age,
    city: resume.area?.name || "Не указан",
    salary: formatSalary(resume.salary),
    experience: formatExperience(resume.total_experience?.months),
    skills: resume.skill_set || [],
    lastUpdate: formatDate(resume.updated_at),
    photoUrl: resume.photo?.medium || null,
    resumeUrl: resume.alternate_url,
    contacts: { email, phone },
  }
}

export function buildSearchParams(filters: Partial<HHSearchParams>): URLSearchParams {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value))
    }
  })

  return params
}

export async function searchResumes(
  token: string,
  params: HHSearchParams,
): Promise<{ data: HHResume[]; found: number; pages: number; page: number }> {
  const searchParams = buildSearchParams(params)

  const response = await fetch(`${HH_API_BASE}/resumes?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }

  const data = await response.json()

  return {
    data: data.items || [],
    found: data.found || 0,
    pages: data.pages || 0,
    page: data.page || 0,
  }
}

export async function getResumeDetails(token: string, resumeId: string): Promise<HHResume> {
  const response = await fetch(`${HH_API_BASE}/resumes/${resumeId}?with_fields=contacts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }

  return response.json()
}

export async function sendInvitation(
  token: string,
  vacancyId: string,
  resumeId: string,
  message: string,
): Promise<void> {
  const response = await fetch(`${HH_API_BASE}/invitations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
    body: JSON.stringify({
      vacancy_id: vacancyId,
      resume_id: resumeId,
      message,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }
}

export function exportToCsv(candidates: Candidate[]): string {
  const headers = [
    "ID",
    "ФИО",
    "Должность",
    "Возраст",
    "Город",
    "Зарплата",
    "Опыт",
    "Навыки",
    "Обновлено",
    "Email",
    "Телефон",
    "Ссылка",
  ]

  const rows = candidates.map((c) => [
    c.id,
    c.fullName,
    c.title,
    c.age || "",
    c.city,
    c.salary,
    c.experience,
    c.skills.join("; "),
    c.lastUpdate,
    c.contacts.email || "",
    c.contacts.phone || "",
    c.resumeUrl,
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return csvContent
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function getMyVacancies(token: string): Promise<HHVacancy[]> {
  const response = await fetch(`${HH_API_BASE}/me/vacancies`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }

  const data = await response.json()
  return data.items || []
}

export async function getVacancyById(
  token: string,
  vacancyId: string,
): Promise<{
  vacancy: {
    id: string
    title: string
    description: string
    region: string
    regionId: string
    salaryMin: number | null
    salaryMax: number | null
    experience: string
    experienceId: string
    requirements: string
    responsibilities: string
    skills: string[]
    url: string
  }
  searchParams: {
    text: string
    area: string
    experience: string
    salaryFrom: number | null
    salaryTo: number | null
  }
}> {
  const response = await fetch(`${HH_API_BASE}/vacancies/${vacancyId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `Вакансия не найдена: ${response.status}`)
  }

  const data = await response.json()

  // Extract skills from key_skills
  const skills: string[] = data.key_skills?.map((s: { name: string }) => s.name) || []

  // Parse experience requirement
  const experienceId = data.experience?.id || ""

  return {
    vacancy: {
      id: data.id,
      title: data.name,
      description: data.description || "",
      region: data.area?.name || "",
      regionId: data.area?.id || "",
      salaryMin: data.salary?.from || null,
      salaryMax: data.salary?.to || null,
      experience: data.experience?.name || "",
      experienceId,
      requirements: data.snippet?.requirement || "",
      responsibilities: data.snippet?.responsibility || "",
      skills,
      url: data.alternate_url,
    },
    searchParams: {
      text: data.name,
      area: data.area?.id || "",
      experience: experienceId,
      salaryFrom: data.salary?.from || null,
      salaryTo: data.salary?.to || null,
    },
  }
}

// Get negotiations (отклики и приглашения)
export async function getNegotiations(
  token: string,
  params?: { vacancy_id?: string; state?: string; page?: number },
): Promise<{ items: any[]; found: number; pages: number }> {
  const searchParams = new URLSearchParams()
  if (params?.vacancy_id) searchParams.append("vacancy_id", params.vacancy_id)
  if (params?.state) searchParams.append("state", params.state)
  if (params?.page) searchParams.append("page", params.page.toString())

  const response = await fetch(`${HH_API_BASE}/negotiations?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }

  return response.json()
}

// Get negotiation messages
export async function getNegotiationMessages(token: string, negotiationId: string): Promise<{ items: any[] }> {
  const response = await fetch(`${HH_API_BASE}/negotiations/${negotiationId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }

  return response.json()
}

// Send message in negotiation
export async function sendNegotiationMessage(token: string, negotiationId: string, message: string): Promise<void> {
  const response = await fetch(`${HH_API_BASE}/negotiations/${negotiationId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }
}

// Update negotiation state
export async function updateNegotiationState(token: string, negotiationId: string, state: string): Promise<void> {
  const response = await fetch(`${HH_API_BASE}/negotiations/${negotiationId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
    body: JSON.stringify({ state }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }
}

// Pay for resume access
export async function payResumeAccess(token: string, resumeId: string): Promise<void> {
  const response = await fetch(`${HH_API_BASE}/resumes/${resumeId}/access`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": HH_USER_AGENT,
      "HH-User-Agent": HH_USER_AGENT,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.description || `API Error: ${response.status}`)
  }
}
