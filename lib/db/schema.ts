import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core"

// ==================== АВТОРИЗАЦИЯ ====================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
}))

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("idx_sessions_user_id").on(table.userId),
  expiresAtIdx: index("idx_sessions_expires_at").on(table.expiresAt),
}))

export const userApiTokens = sqliteTable("user_api_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  encryptedToken: text("encrypted_token").notNull(),
  provider: text("provider").notNull().default("hh.ru"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
}, (table) => ({
  userIdIdx: index("idx_user_api_tokens_user_id").on(table.userId),
  providerIdx: index("idx_user_api_tokens_provider").on(table.provider),
}))

// ==================== ОСНОВНЫЕ ТАБЛИЦЫ ====================

export const candidates = sqliteTable("candidates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  externalId: text("external_id").notNull(),
  fullName: text("full_name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  middleName: text("middle_name"),
  email: text("email"),
  phone: text("phone"),
  currentPosition: text("current_position"),
  currentCompany: text("current_company"),
  location: text("location"),
  experienceYears: integer("experience_years"),
  skills: text("skills"), // JSON array as text
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  summary: text("summary"),
  source: text("source").notNull().default("hh.ru"),
  companyId: text("company_id"),
  status: text("status").default("new"),
  paidAccess: integer("paid_access", { mode: "boolean" }).default(false),
  accessPaidAt: integer("access_paid_at", { mode: "timestamp" }),
  notes: text("notes"),
  tags: text("tags"), // JSON array as text
  rating: integer("rating"), // 1-5
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  externalIdIdx: index("idx_candidates_external_id").on(table.externalId),
  statusIdx: index("idx_candidates_status").on(table.status),
  emailIdx: index("idx_candidates_email").on(table.email),
  phoneIdx: index("idx_candidates_phone").on(table.phone),
  paidAccessIdx: index("idx_candidates_paid_access").on(table.paidAccess),
}))

export const vacancies = sqliteTable("vacancies", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  externalId: text("external_id"),
  title: text("title").notNull(),
  description: text("description"),
  requirements: text("requirements"),
  location: text("location"),
  employmentType: text("employment_type"),
  experienceLevel: text("experience_level"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  skills: text("skills"), // JSON array as text
  status: text("status").notNull().default("active"),
  source: text("source").notNull().default("hh.ru"),
  companyId: text("company_id"),
  createdBy: text("created_by"),
  responsesCount: integer("responses_count").default(0),
  invitationsCount: integer("invitations_count").default(0),
  viewsCount: integer("views_count").default(0),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  isPublished: integer("is_published", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  externalIdIdx: index("idx_vacancies_external_id").on(table.externalId),
  statusIdx: index("idx_vacancies_status").on(table.status),
  publishedIdx: index("idx_vacancies_published").on(table.isPublished),
  publishedAtIdx: index("idx_vacancies_published_at").on(table.publishedAt),
}))

export const searchSessions = sqliteTable("search_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "cascade" }),
  searchText: text("search_text").notNull(),
  searchArea: text("search_area"),
  searchExperience: text("search_experience"),
  searchEmployment: text("search_employment"),
  searchSchedule: text("search_schedule"),
  searchSalaryFrom: integer("search_salary_from"),
  searchOrderBy: text("search_order_by"),
  searchParams: text("search_params"), // JSON as text
  totalFound: integer("total_found").notNull().default(0),
  totalScored: integer("total_scored").notNull().default(0),
  avgScore: real("avg_score"),
  minScore: integer("min_score"),
  maxScore: integer("max_score"),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  vacancyIdIdx: index("idx_search_sessions_vacancy").on(table.vacancyId),
  createdAtIdx: index("idx_search_sessions_created").on(table.createdAt),
}))

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  searchSessionId: text("search_session_id").references(() => searchSessions.id, { onDelete: "set null" }),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("new"),
  score: integer("score").notNull(),
  scoreBreakdown: text("score_breakdown"), // JSON as text
  rating: text("rating"),
  notes: text("notes"),
  assignedTo: text("assigned_to"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  searchSessionIdIdx: index("idx_applications_search_session").on(table.searchSessionId),
  candidateIdIdx: index("idx_applications_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_applications_vacancy").on(table.vacancyId),
  scoreIdx: index("idx_applications_score_desc").on(table.score),
  uniqueSessionCandidate: uniqueIndex("unique_session_candidate").on(table.searchSessionId, table.candidateId),
}))

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text("application_id").references(() => applications.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  message: text("message"),
  hhInvitationId: text("hh_invitation_id"),
  status: text("status").notNull().default("sent"),
  sentBy: text("sent_by"),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  responseText: text("response_text"),
}, (table) => ({
  applicationIdIdx: index("idx_invitations_application").on(table.applicationId),
  candidateIdIdx: index("idx_invitations_candidate").on(table.candidateId),
  statusIdx: index("idx_invitations_status").on(table.status),
}))

export const exports = sqliteTable("exports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  searchSessionId: text("search_session_id").references(() => searchSessions.id, { onDelete: "set null" }),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  candidatesCount: integer("candidates_count").notNull(),
  format: text("format").notNull().default("csv"),
  fileName: text("file_name"),
  appliedFilters: text("applied_filters"), // JSON as text
  scoreRangeMin: integer("score_range_min"),
  scoreRangeMax: integer("score_range_max"),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  searchSessionIdIdx: index("idx_exports_session").on(table.searchSessionId),
  createdAtIdx: index("idx_exports_created").on(table.createdAt),
}))

// ==================== CRM ТАБЛИЦЫ ====================

export const negotiations = sqliteTable("negotiations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").notNull().references(() => vacancies.id, { onDelete: "cascade" }),
  applicationId: text("application_id").references(() => applications.id, { onDelete: "set null" }),
  hhNegotiationId: text("hh_negotiation_id").unique(),
  externalResumeId: text("external_resume_id"),
  externalVacancyId: text("external_vacancy_id"),
  state: text("state").notNull().default("new"),
  source: text("source").notNull().default("employer"),
  initialMessage: text("initial_message"),
  hasUpdates: integer("has_updates", { mode: "boolean" }).default(false),
  messagesCount: integer("messages_count").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  viewedAt: integer("viewed_at", { mode: "timestamp" }),
  respondedAt: integer("responded_at", { mode: "timestamp" }),
  topics: text("topics"), // JSON array as text
  actions: text("actions"), // JSON object as text
}, (table) => ({
  candidateIdIdx: index("idx_negotiations_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_negotiations_vacancy").on(table.vacancyId),
  stateIdx: index("idx_negotiations_state").on(table.state),
  hhIdIdx: index("idx_negotiations_hh_id").on(table.hhNegotiationId),
  createdAtIdx: index("idx_negotiations_created").on(table.createdAt),
  updatedAtIdx: index("idx_negotiations_updated").on(table.updatedAt),
}))

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  negotiationId: text("negotiation_id").notNull().references(() => negotiations.id, { onDelete: "cascade" }),
  hhMessageId: text("hh_message_id").unique(),
  author: text("author").notNull(), // 'employer' or 'applicant'
  text: text("text").notNull(),
  readByApplicant: integer("read_by_applicant", { mode: "boolean" }).default(false),
  readByEmployer: integer("read_by_employer", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  readAt: integer("read_at", { mode: "timestamp" }),
  attachments: text("attachments"), // JSON array as text
}, (table) => ({
  negotiationIdIdx: index("idx_messages_negotiation").on(table.negotiationId),
  createdAtIdx: index("idx_messages_created").on(table.createdAt),
  hhIdIdx: index("idx_messages_hh_id").on(table.hhMessageId),
}))

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  candidateId: text("candidate_id").references(() => candidates.id, { onDelete: "cascade" }),
  vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "cascade" }),
  negotiationId: text("negotiation_id").references(() => negotiations.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON object as text
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  candidateIdIdx: index("idx_activities_candidate").on(table.candidateId),
  vacancyIdIdx: index("idx_activities_vacancy").on(table.vacancyId),
  negotiationIdIdx: index("idx_activities_negotiation").on(table.negotiationId),
  actionTypeIdx: index("idx_activities_type").on(table.actionType),
  createdAtIdx: index("idx_activities_created").on(table.createdAt),
}))

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  action: text("action").notNull(), // 'INSERT', 'UPDATE', 'DELETE'
  oldValue: text("old_value"), // JSON as text
  newValue: text("new_value"), // JSON as text
  changedFields: text("changed_fields"), // JSON array as text
  changedBy: text("changed_by"),
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => ({
  tableNameIdx: index("idx_audit_table").on(table.tableName),
  recordIdIdx: index("idx_audit_record").on(table.recordId),
  changedAtIdx: index("idx_audit_changed_at").on(table.changedAt),
}))

// Типы для экспорта
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type UserApiToken = typeof userApiTokens.$inferSelect
export type NewUserApiToken = typeof userApiTokens.$inferInsert
export type Candidate = typeof candidates.$inferSelect
export type NewCandidate = typeof candidates.$inferInsert
export type Vacancy = typeof vacancies.$inferSelect
export type NewVacancy = typeof vacancies.$inferInsert
export type SearchSession = typeof searchSessions.$inferSelect
export type NewSearchSession = typeof searchSessions.$inferInsert
export type Application = typeof applications.$inferSelect
export type NewApplication = typeof applications.$inferInsert
export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert
export type Export = typeof exports.$inferSelect
export type NewExport = typeof exports.$inferInsert
export type Negotiation = typeof negotiations.$inferSelect
export type NewNegotiation = typeof negotiations.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
export type Activity = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert
export type AuditLog = typeof auditLog.$inferSelect
export type NewAuditLog = typeof auditLog.$inferInsert

