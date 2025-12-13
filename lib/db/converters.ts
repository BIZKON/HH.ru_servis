import type { ScoredCandidate, VacancyConfig } from "@/lib/types"

// Database types matching schema
export interface DBCandidate {
  id?: string
  external_id: string
  full_name: string
  first_name?: string
  last_name?: string
  middle_name?: string
  email?: string
  phone?: string
  current_position?: string
  current_company?: string
  location?: string
  experience_years?: number
  skills?: string[]
  resume_url?: string
  resume_text?: string
  summary?: string
  source: string
  company_id?: string
  status?: string
  paid_access?: boolean
  notes?: string
  tags?: string[]
}

export interface DBVacancy {
  id?: string
  external_id?: string
  title: string
  description?: string
  requirements?: string
  location?: string
  employment_type?: string
  experience_level?: string
  salary_min?: number
  salary_max?: number
  skills?: string[]
  status: string
  source: string
  company_id?: string
  created_by?: string
}

export interface DBApplication {
  id?: string
  search_session_id?: string
  candidate_id: string
  vacancy_id: string
  status: string
  score: number
  score_breakdown: Record<string, number>
  rating: string
  notes?: string
  assigned_to?: string
}

export interface DBSearchSession {
  id?: string
  vacancy_id?: string
  search_text: string
  search_area?: string
  search_experience?: string
  search_employment?: string
  search_schedule?: string
  search_salary_from?: number
  search_order_by?: string
  search_params: Record<string, any>
  total_found: number
  total_scored: number
  avg_score?: number
  min_score?: number
  max_score?: number
}

export interface DBInvitation {
  id?: string
  application_id: string
  candidate_id: string
  vacancy_id: string
  message: string
  hh_invitation_id?: string
  status: string
  sent_by?: string
  sent_at?: string
  responded_at?: string
  response_text?: string
}

export interface DBExport {
  id?: string
  search_session_id?: string
  vacancy_id?: string
  candidates_count: number
  format: string
  file_name: string
  applied_filters?: Record<string, any>
  score_range_min?: number
  score_range_max?: number
  created_by?: string
}

// Convert ScoredCandidate to DBCandidate
export function scoredCandidateToDBCandidate(candidate: ScoredCandidate): DBCandidate {
  const experienceYears = parseExperienceYears(candidate.experience)

  // Parse full name into components
  const nameParts = candidate.fullName.trim().split(/\s+/)
  let firstName: string | undefined
  let lastName: string | undefined
  let middleName: string | undefined

  if (nameParts.length >= 3) {
    lastName = nameParts[0]
    firstName = nameParts[1]
    middleName = nameParts.slice(2).join(" ")
  } else if (nameParts.length === 2) {
    lastName = nameParts[0]
    firstName = nameParts[1]
  } else if (nameParts.length === 1) {
    lastName = nameParts[0]
  }

  return {
    external_id: candidate.id,
    full_name: candidate.fullName,
    first_name: firstName,
    last_name: lastName,
    middle_name: middleName,
    email: candidate.contacts.email,
    phone: candidate.contacts.phone,
    current_position: candidate.title,
    location: candidate.city,
    experience_years: experienceYears,
    skills: candidate.skills,
    resume_url: candidate.resumeUrl,
    summary: `${candidate.title}. Опыт: ${candidate.experience}. Зарплата: ${candidate.salary}`,
    source: "hh.ru",
    status: "new",
    paid_access: false,
  }
}

// Convert VacancyConfig to DBVacancy
export function vacancyConfigToDBVacancy(config: VacancyConfig): DBVacancy {
  return {
    external_id: config.id,
    title: config.name,
    location: config.city,
    salary_min: config.salaryMin,
    salary_max: config.salaryMax,
    skills: [...config.requiredSkills, ...config.bonusSkills],
    experience_level: config.requiredExperience,
    status: "active",
    source: "hh.ru",
    requirements: `Обязательные навыки: ${config.requiredSkills.join(", ")}. Желательные: ${config.bonusSkills.join(", ")}`,
  }
}

export function createDBSearchSession(
  searchParams: Record<string, any>,
  candidates: ScoredCandidate[],
  vacancyId?: string,
): DBSearchSession {
  const scores = candidates.map((c) => c.score)
  const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0

  return {
    vacancy_id: vacancyId,
    search_text: searchParams.text || "",
    search_area: searchParams.area,
    search_experience: searchParams.experience,
    search_employment: searchParams.employment,
    search_schedule: searchParams.schedule,
    search_salary_from: searchParams.salary_from,
    search_order_by: searchParams.order_by,
    search_params: searchParams, // Сохраняем ВСЕ параметры как JSON
    total_found: candidates.length,
    total_scored: candidates.filter((c) => c.score > 0).length,
    avg_score: avgScore,
    min_score: scores.length > 0 ? Math.min(...scores) : 0,
    max_score: scores.length > 0 ? Math.max(...scores) : 0,
  }
}

export function createDBApplication(
  candidate: ScoredCandidate,
  candidateId: string,
  vacancyId: string,
  searchSessionId?: string,
): DBApplication {
  return {
    search_session_id: searchSessionId,
    candidate_id: candidateId,
    vacancy_id: vacancyId,
    status: "new",
    score: candidate.score,
    score_breakdown: candidate.breakdown,
    rating: candidate.rating,
  }
}

export function createDBInvitation(
  applicationId: string,
  candidateId: string,
  vacancyId: string,
  message: string,
  hhInvitationId?: string,
): DBInvitation {
  return {
    application_id: applicationId,
    candidate_id: candidateId,
    vacancy_id: vacancyId,
    message,
    hh_invitation_id: hhInvitationId,
    status: "sent",
  }
}

export function createDBExport(
  candidatesCount: number,
  fileName: string,
  format: "csv" | "xlsx" | "json" = "csv",
  searchSessionId?: string,
  vacancyId?: string,
  appliedFilters?: Record<string, any>,
  scoreRange?: { min?: number; max?: number },
): DBExport {
  return {
    search_session_id: searchSessionId,
    vacancy_id: vacancyId,
    candidates_count: candidatesCount,
    format,
    file_name: fileName,
    applied_filters: appliedFilters,
    score_range_min: scoreRange?.min,
    score_range_max: scoreRange?.max,
  }
}

function parseExperienceYears(experience: string): number | undefined {
  const match = experience.match(/(\d+)/)
  if (match) {
    return Number.parseInt(match[1], 10)
  }
  if (experience.toLowerCase().includes("нет опыта")) {
    return 0
  }
  return undefined
}


