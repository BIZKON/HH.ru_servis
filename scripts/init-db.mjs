import Database from "better-sqlite3"
import { readFileSync } from "fs"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const databasePath = process.env.DATABASE_PATH || "./data/database.db"

// Создаем директорию data если её нет
import { mkdirSync } from "fs"
try {
  mkdirSync(dirname(databasePath), { recursive: true })
} catch {
  // Директория уже существует
}

const db = new Database(databasePath)

console.log("Creating database tables...")

// Создаем все таблицы
db.exec(`
-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- User API Tokens
CREATE TABLE IF NOT EXISTS user_api_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_token TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'hh.ru',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_api_tokens_user_id ON user_api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_tokens_provider ON user_api_tokens(provider);

-- Candidates
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  external_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  email TEXT,
  phone TEXT,
  current_position TEXT,
  current_company TEXT,
  location TEXT,
  experience_years INTEGER,
  skills TEXT,
  resume_url TEXT,
  resume_text TEXT,
  summary TEXT,
  source TEXT NOT NULL DEFAULT 'hh.ru',
  company_id TEXT,
  status TEXT DEFAULT 'new',
  paid_access INTEGER DEFAULT 0,
  access_paid_at INTEGER,
  notes TEXT,
  tags TEXT,
  rating INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_candidates_external_id ON candidates(external_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone);
CREATE INDEX IF NOT EXISTS idx_candidates_paid_access ON candidates(paid_access);

-- Vacancies
CREATE TABLE IF NOT EXISTS vacancies (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  employment_type TEXT,
  experience_level TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  skills TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT NOT NULL DEFAULT 'hh.ru',
  company_id TEXT,
  created_by TEXT,
  responses_count INTEGER DEFAULT 0,
  invitations_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  published_at INTEGER,
  archived_at INTEGER,
  is_published INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vacancies_external_id ON vacancies(external_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_published ON vacancies(is_published);
CREATE INDEX IF NOT EXISTS idx_vacancies_published_at ON vacancies(published_at);

-- Search Sessions
CREATE TABLE IF NOT EXISTS search_sessions (
  id TEXT PRIMARY KEY,
  vacancy_id TEXT REFERENCES vacancies(id) ON DELETE CASCADE,
  search_text TEXT NOT NULL,
  search_area TEXT,
  search_experience TEXT,
  search_employment TEXT,
  search_schedule TEXT,
  search_salary_from INTEGER,
  search_order_by TEXT,
  search_params TEXT,
  total_found INTEGER NOT NULL DEFAULT 0,
  total_scored INTEGER NOT NULL DEFAULT 0,
  avg_score REAL,
  min_score INTEGER,
  max_score INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_sessions_vacancy ON search_sessions(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_search_sessions_created ON search_sessions(created_at);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  search_session_id TEXT REFERENCES search_sessions(id) ON DELETE SET NULL,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id TEXT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new',
  score INTEGER NOT NULL,
  score_breakdown TEXT,
  rating TEXT,
  notes TEXT,
  assigned_to TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(search_session_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_search_session ON applications(search_session_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_vacancy ON applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_applications_score_desc ON applications(score);

-- Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id TEXT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  message TEXT,
  hh_invitation_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_by TEXT,
  sent_at INTEGER NOT NULL,
  responded_at INTEGER,
  response_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_invitations_application ON invitations(application_id);
CREATE INDEX IF NOT EXISTS idx_invitations_candidate ON invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Exports
CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  search_session_id TEXT REFERENCES search_sessions(id) ON DELETE SET NULL,
  vacancy_id TEXT REFERENCES vacancies(id) ON DELETE SET NULL,
  candidates_count INTEGER NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  file_name TEXT,
  applied_filters TEXT,
  score_range_min INTEGER,
  score_range_max INTEGER,
  created_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exports_session ON exports(search_session_id);
CREATE INDEX IF NOT EXISTS idx_exports_created ON exports(created_at);

-- Negotiations
CREATE TABLE IF NOT EXISTS negotiations (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id TEXT NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  application_id TEXT REFERENCES applications(id) ON DELETE SET NULL,
  hh_negotiation_id TEXT UNIQUE,
  external_resume_id TEXT,
  external_vacancy_id TEXT,
  state TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'employer',
  initial_message TEXT,
  has_updates INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  viewed_at INTEGER,
  responded_at INTEGER,
  topics TEXT,
  actions TEXT
);

CREATE INDEX IF NOT EXISTS idx_negotiations_candidate ON negotiations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_vacancy ON negotiations(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_state ON negotiations(state);
CREATE INDEX IF NOT EXISTS idx_negotiations_hh_id ON negotiations(hh_negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_created ON negotiations(created_at);
CREATE INDEX IF NOT EXISTS idx_negotiations_updated ON negotiations(updated_at);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  negotiation_id TEXT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
  hh_message_id TEXT UNIQUE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  read_by_applicant INTEGER DEFAULT 0,
  read_by_employer INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  sent_at INTEGER,
  read_at INTEGER,
  attachments TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_negotiation ON messages(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_hh_id ON messages(hh_message_id);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
  vacancy_id TEXT REFERENCES vacancies(id) ON DELETE CASCADE,
  negotiation_id TEXT REFERENCES negotiations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_candidate ON activities(candidate_id);
CREATE INDEX IF NOT EXISTS idx_activities_vacancy ON activities(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_activities_negotiation ON activities(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(action_type);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_fields TEXT,
  changed_by TEXT,
  changed_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log(changed_at);
`)

console.log("Database initialized successfully!")
db.close()


