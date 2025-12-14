// HH.ru API Types

export interface HHSearchParams {
  text: string
  area?: string
  experience?: string
  employment?: string
  schedule?: string
  salary_from?: number
  salary_to?: number
  currency?: string
  order_by?: string
  search_field?: string
  per_page?: number
  page?: number
}

export interface HHArea {
  id: string
  name: string
  url: string
}

export interface HHSalary {
  amount: number | null
  currency: string | null
  from?: number | null
  to?: number | null
}

export interface HHExperience {
  id: string
  name: string
}

export interface HHEducation {
  level: {
    id: string
    name: string
  }
  primary: Array<{
    name: string
    organization: string
    result: string
    year: number
  }>
}

export interface HHContact {
  type: {
    id: string
    name: string
  }
  value: string | { country: string; city: string; number: string }
  preferred: boolean
}

export interface HHResume {
  id: string
  title: string
  url: string
  alternate_url: string
  created_at: string
  updated_at: string
  first_name?: string
  last_name?: string
  middle_name?: string | null
  age: number | null
  gender: {
    id: string
    name: string
  } | null
  area: HHArea | null
  salary: HHSalary | null
  photo: {
    small: string
    medium: string
    id: string
  } | null
  total_experience: {
    months: number
  } | null
  experience: Array<{
    start: string
    end: string | null
    company: string
    position: string
    description: string | null
  }>
  skill_set: string[]
  education: HHEducation | null
  contact: HHContact[]
  certificate: Array<{
    title: string
    achieved_at: string
    type: string
    owner: string | null
    url: string | null
  }>
  language: Array<{
    id: string
    name: string
    level: {
      id: string
      name: string
    }
  }>
}

export interface HHSearchResponse {
  found: number
  pages: number
  per_page: number
  page: number
  items: HHResume[]
}

export interface Candidate {
  id: string
  fullName: string
  title: string
  age: number | null
  city: string
  salary: string
  experience: string
  skills: string[]
  lastUpdate: string
  photoUrl: string | null
  resumeUrl: string
  contacts: {
    email?: string
    phone?: string
  }
}

export interface SearchFilters {
  text: string
  area: string
  experience: string
  employment: string
  schedule: string
  salaryFrom: string
  salaryTo: string
  orderBy: string
  resumeSearchPeriod: string
}

export interface SearchHistory {
  id: string
  query: string
  filters: SearchFilters
  timestamp: number
  resultsCount: number
}

// Experience options from HH.ru
export const EXPERIENCE_OPTIONS = [
  { value: "", label: "Любой опыт" },
  { value: "noExperience", label: "Нет опыта" },
  { value: "between1And3", label: "От 1 года до 3 лет" },
  { value: "between3And6", label: "От 3 до 6 лет" },
  { value: "moreThan6", label: "Более 6 лет" },
]

export const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Любая занятость" },
  { value: "full", label: "Полная занятость" },
  { value: "part", label: "Частичная занятость" },
  { value: "project", label: "Проектная работа" },
  { value: "volunteer", label: "Волонтёрство" },
  { value: "probation", label: "Стажировка" },
]

export const SCHEDULE_OPTIONS = [
  { value: "", label: "Любой график" },
  { value: "fullDay", label: "Полный день" },
  { value: "shift", label: "Сменный график" },
  { value: "flexible", label: "Гибкий график" },
  { value: "remote", label: "Удалённая работа" },
  { value: "flyInFlyOut", label: "Вахтовый метод" },
]

export const ORDER_BY_OPTIONS = [
  { value: "relevance", label: "По релевантности" },
  { value: "publication_time", label: "По дате обновления" },
  { value: "salary_desc", label: "По убыванию зарплаты" },
  { value: "salary_asc", label: "По возрастанию зарплаты" },
]

// Major Russian cities
export const AREA_OPTIONS = [
  { value: "", label: "Вся Россия" },
  { value: "1", label: "Москва" },
  { value: "2", label: "Санкт-Петербург" },
  { value: "3", label: "Екатеринбург" },
  { value: "4", label: "Новосибирск" },
  { value: "88", label: "Казань" },
  { value: "66", label: "Нижний Новгород" },
  { value: "76", label: "Ростов-на-Дону" },
  { value: "104", label: "Челябинск" },
  { value: "72", label: "Пермь" },
  { value: "78", label: "Самара" },
  { value: "99", label: "Уфа" },
  { value: "54", label: "Красноярск" },
  { value: "26", label: "Воронеж" },
  { value: "68", label: "Омск" },
]

export interface HHVacancy {
  id: string
  name: string
  area: HHArea | null
  salary: HHSalary | null
  published_at: string
  response_letter_required: boolean
  status: string
}

export interface HHVacanciesResponse {
  found: number
  pages: number
  per_page: number
  page: number
  items: HHVacancy[]
}

export interface Vacancy {
  id: string
  name: string
  city: string
  salary: string | null
  inviteMessage?: string
}

export interface VacancyConfig {
  id: string
  name: string
  city: string
  salary: string | null
  inviteMessage: string
  // Scoring configuration
  requiredExperience: string
  requiredSkills: string[]
  bonusSkills: string[]
  salaryMin: number
  salaryMax: number
}

export interface ScoredCandidate {
  id: string
  fullName: string
  title: string
  age: number | null
  city: string
  salary: string
  experience: string
  skills: string[]
  lastUpdate: string
  photoUrl: string | null
  resumeUrl: string
  contacts: {
    email?: string
    phone?: string
  }
  // Scoring fields
  score: number
  breakdown: {
    experience: number
    skills: number
    salary: number
    education: number
    jobSearchStatus: number
    bonus: number
  }
  rating: string
  stars: number
}

export interface SearchSession {
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
  created_at?: string
}

export interface Invitation {
  id?: string
  application_id: string
  candidate_id: string
  vacancy_id: string
  message: string
  hh_invitation_id?: string
  status: "sent" | "delivered" | "viewed" | "responded" | "rejected" | "error"
  sent_at?: string
  responded_at?: string
  response_text?: string
}

export interface Export {
  id?: string
  search_session_id?: string
  vacancy_id?: string
  candidates_count: number
  format: "csv" | "xlsx" | "json"
  file_name: string
  applied_filters?: Record<string, any>
  score_range_min?: number
  score_range_max?: number
  created_at?: string
}

export interface AuditLog {
  id?: string
  table_name: string
  record_id: string
  action: "INSERT" | "UPDATE" | "DELETE"
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  changed_fields?: string[]
  changed_at?: string
}

export interface SearchResults {
  searchSessionId: string
  vacancyId?: string
  candidates: ScoredCandidate[]
  stats: {
    total: number
    scored: number
    avgScore: number
    minScore: number
    maxScore: number
  }
}

export const RESUME_SEARCH_PERIOD_OPTIONS = [
  { value: "", label: "За все время" },
  { value: "1", label: "За последний день" },
  { value: "3", label: "За последние 3 дня" },
  { value: "7", label: "За последнюю неделю" },
  { value: "14", label: "За последние 2 недели" },
  { value: "30", label: "За последний месяц" },
]

// CRM-related types for negotiations, messages, and activities

// CRM: Negotiations (отклики и приглашения)
export interface Negotiation {
  id: string
  candidate_id: string
  vacancy_id: string
  application_id?: string
  hh_negotiation_id?: string
  external_resume_id?: string
  external_vacancy_id?: string
  state: "new" | "invitation" | "response" | "discard" | "hired" | "archived"
  source: "employer" | "applicant"
  initial_message?: string
  has_updates: boolean
  messages_count: number
  created_at: string
  updated_at: string
  viewed_at?: string
  responded_at?: string
  topics?: any[]
  actions?: Record<string, any>
  // Relations
  candidate?: Candidate
  vacancy?: Vacancy
}

// CRM: Messages (сообщения в переписке)
export interface Message {
  id: string
  negotiation_id: string
  hh_message_id?: string
  author: "employer" | "applicant"
  text: string
  read_by_applicant: boolean
  read_by_employer: boolean
  created_at: string
  sent_at?: string
  read_at?: string
  attachments?: any[]
}

// CRM: Activity log (действия в CRM)
export interface Activity {
  id: string
  candidate_id?: string
  vacancy_id?: string
  negotiation_id?: string
  action_type: string
  title: string
  description?: string
  metadata?: Record<string, any>
  created_at: string
}

// Extended Candidate for CRM
export interface CRMCandidate extends Candidate {
  first_name?: string
  last_name?: string
  middle_name?: string
  phone?: string
  email?: string
  status?: "new" | "contacted" | "interview" | "offer" | "hired" | "rejected"
  paid_access?: boolean
  access_paid_at?: string
  notes?: string
  tags?: string[]
  rating?: number
  negotiations?: Negotiation[]
  activities?: Activity[]
}

// Vacancy stats for CRM
export interface VacancyStats {
  id: string
  responses_count: number
  invitations_count: number
  views_count: number
  conversion_rate: number
  avg_response_time: number
}

// CRM Dashboard stats
export interface CRMStats {
  total_candidates: number
  total_negotiations: number
  active_negotiations: number
  hired_count: number
  conversion_funnel: {
    new: number
    contacted: number
    interview: number
    offer: number
    hired: number
    rejected: number
  }
  recent_activities: Activity[]
}
