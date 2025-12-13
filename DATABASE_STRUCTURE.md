# Структура базы данных

## Общая информация

- **Тип БД**: SQLite 3.51.0
- **Файл**: `data/database.db`
- **Размер**: ~304 KB (311,296 байт)
- **ORM**: Drizzle ORM

## Статистика по таблицам

| Таблица | Записей |
|---------|---------|
| users | 1 |
| sessions | 1 |
| user_api_tokens | 2 |
| candidates | 0 |
| vacancies | 0 |
| applications | 0 |
| search_sessions | 0 |
| invitations | 0 |
| negotiations | 0 |
| messages | 0 |
| activities | 0 |
| exports | 0 |
| audit_log | 0 |

## Структура таблиц

### 🔐 АВТОРИЗАЦИЯ

#### `users` - Пользователи
- `id` (TEXT, PRIMARY KEY) - UUID пользователя
- `email` (TEXT, UNIQUE, NOT NULL) - Email пользователя
- `password_hash` (TEXT, NOT NULL) - Хеш пароля
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- **Индексы**: `idx_users_email`

#### `sessions` - Сессии пользователей
- `id` (TEXT, PRIMARY KEY) - UUID сессии
- `user_id` (TEXT, NOT NULL) - Ссылка на users(id)
- `expires_at` (INTEGER, NOT NULL) - Время истечения
- `created_at` (INTEGER, NOT NULL) - Дата создания
- **Индексы**: `idx_sessions_user_id`, `idx_sessions_expires_at`

#### `user_api_tokens` - API токены пользователей
- `id` (TEXT, PRIMARY KEY) - UUID токена
- `user_id` (TEXT, NOT NULL) - Ссылка на users(id)
- `encrypted_token` (TEXT, NOT NULL) - Зашифрованный токен
- `provider` (TEXT, NOT NULL, DEFAULT 'hh.ru') - Провайдер API
- `is_active` (INTEGER, NOT NULL, DEFAULT 1) - Активен ли токен
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- `expires_at` (INTEGER) - Время истечения
- **Индексы**: `idx_user_api_tokens_user_id`, `idx_user_api_tokens_provider`

### 👥 ОСНОВНЫЕ ТАБЛИЦЫ

#### `candidates` - Кандидаты
- `id` (TEXT, PRIMARY KEY) - UUID кандидата
- `external_id` (TEXT, NOT NULL) - Внешний ID (HH.ru)
- `full_name` (TEXT, NOT NULL) - Полное имя
- `first_name` (TEXT) - Имя
- `last_name` (TEXT) - Фамилия
- `middle_name` (TEXT) - Отчество
- `email` (TEXT) - Email
- `phone` (TEXT) - Телефон
- `current_position` (TEXT) - Текущая должность
- `current_company` (TEXT) - Текущая компания
- `location` (TEXT) - Местоположение
- `experience_years` (INTEGER) - Опыт работы (лет)
- `skills` (TEXT) - Навыки (JSON массив)
- `resume_url` (TEXT) - URL резюме
- `resume_text` (TEXT) - Текст резюме
- `summary` (TEXT) - Краткое описание
- `source` (TEXT, NOT NULL, DEFAULT 'hh.ru') - Источник
- `company_id` (TEXT) - ID компании
- `status` (TEXT, DEFAULT 'new') - Статус кандидата
- `paid_access` (INTEGER, DEFAULT 0) - Платный доступ
- `access_paid_at` (INTEGER) - Дата оплаты доступа
- `notes` (TEXT) - Заметки
- `tags` (TEXT) - Теги (JSON массив)
- `rating` (INTEGER) - Рейтинг (1-5)
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- **Индексы**: `idx_candidates_external_id`, `idx_candidates_status`, `idx_candidates_email`, `idx_candidates_phone`, `idx_candidates_paid_access`

#### `vacancies` - Вакансии
- `id` (TEXT, PRIMARY KEY) - UUID вакансии
- `external_id` (TEXT) - Внешний ID (HH.ru)
- `title` (TEXT, NOT NULL) - Название вакансии
- `description` (TEXT) - Описание
- `requirements` (TEXT) - Требования
- `location` (TEXT) - Местоположение
- `employment_type` (TEXT) - Тип занятости
- `experience_level` (TEXT) - Уровень опыта
- `salary_min` (INTEGER) - Минимальная зарплата
- `salary_max` (INTEGER) - Максимальная зарплата
- `skills` (TEXT) - Навыки (JSON массив)
- `status` (TEXT, NOT NULL, DEFAULT 'active') - Статус
- `source` (TEXT, NOT NULL, DEFAULT 'hh.ru') - Источник
- `company_id` (TEXT) - ID компании
- `created_by` (TEXT) - Создатель
- `responses_count` (INTEGER, DEFAULT 0) - Количество откликов
- `invitations_count` (INTEGER, DEFAULT 0) - Количество приглашений
- `views_count` (INTEGER, DEFAULT 0) - Количество просмотров
- `published_at` (INTEGER) - Дата публикации
- `archived_at` (INTEGER) - Дата архивации
- `is_published` (INTEGER, DEFAULT 1) - Опубликована ли
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- **Индексы**: `idx_vacancies_external_id`, `idx_vacancies_status`, `idx_vacancies_published`, `idx_vacancies_published_at`

#### `search_sessions` - Сессии поиска
- `id` (TEXT, PRIMARY KEY) - UUID сессии
- `vacancy_id` (TEXT) - Ссылка на vacancies(id)
- `search_text` (TEXT, NOT NULL) - Текст поиска
- `search_area` (TEXT) - Область поиска
- `search_experience` (TEXT) - Опыт
- `search_employment` (TEXT) - Тип занятости
- `search_schedule` (TEXT) - График работы
- `search_salary_from` (INTEGER) - Зарплата от
- `search_order_by` (TEXT) - Сортировка
- `search_params` (TEXT) - Параметры поиска (JSON)
- `total_found` (INTEGER, NOT NULL, DEFAULT 0) - Всего найдено
- `total_scored` (INTEGER, NOT NULL, DEFAULT 0) - Всего оценено
- `avg_score` (REAL) - Средний балл
- `min_score` (INTEGER) - Минимальный балл
- `max_score` (INTEGER) - Максимальный балл
- `created_by` (TEXT) - Создатель
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- **Индексы**: `idx_search_sessions_vacancy`, `idx_search_sessions_created`

#### `applications` - Отклики/Заявки
- `id` (TEXT, PRIMARY KEY) - UUID заявки
- `search_session_id` (TEXT) - Ссылка на search_sessions(id)
- `candidate_id` (TEXT, NOT NULL) - Ссылка на candidates(id)
- `vacancy_id` (TEXT, NOT NULL) - Ссылка на vacancies(id)
- `status` (TEXT, NOT NULL, DEFAULT 'new') - Статус
- `score` (INTEGER, NOT NULL) - Балл соответствия
- `score_breakdown` (TEXT) - Детализация балла (JSON)
- `rating` (TEXT) - Рейтинг
- `notes` (TEXT) - Заметки
- `assigned_to` (TEXT) - Назначено кому
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- **Индексы**: `idx_applications_search_session`, `idx_applications_candidate`, `idx_applications_vacancy`, `idx_applications_score_desc`
- **Уникальный индекс**: `unique_session_candidate` (search_session_id, candidate_id)

#### `invitations` - Приглашения
- `id` (TEXT, PRIMARY KEY) - UUID приглашения
- `application_id` (TEXT) - Ссылка на applications(id)
- `candidate_id` (TEXT, NOT NULL) - Ссылка на candidates(id)
- `vacancy_id` (TEXT, NOT NULL) - Ссылка на vacancies(id)
- `message` (TEXT) - Сообщение
- `hh_invitation_id` (TEXT) - ID приглашения в HH.ru
- `status` (TEXT, NOT NULL, DEFAULT 'sent') - Статус
- `sent_by` (TEXT) - Отправитель
- `sent_at` (INTEGER, NOT NULL) - Дата отправки
- `responded_at` (INTEGER) - Дата ответа
- `response_text` (TEXT) - Текст ответа
- **Индексы**: `idx_invitations_application`, `idx_invitations_candidate`, `idx_invitations_status`

#### `exports` - Экспорты
- `id` (TEXT, PRIMARY KEY) - UUID экспорта
- `search_session_id` (TEXT) - Ссылка на search_sessions(id)
- `vacancy_id` (TEXT) - Ссылка на vacancies(id)
- `candidates_count` (INTEGER, NOT NULL) - Количество кандидатов
- `format` (TEXT, NOT NULL, DEFAULT 'csv') - Формат
- `file_name` (TEXT) - Имя файла
- `applied_filters` (TEXT) - Примененные фильтры (JSON)
- `score_range_min` (INTEGER) - Минимальный балл
- `score_range_max` (INTEGER) - Максимальный балл
- `created_by` (TEXT) - Создатель
- `created_at` (INTEGER, NOT NULL) - Дата создания
- **Индексы**: `idx_exports_session`, `idx_exports_created`

### 💼 CRM ТАБЛИЦЫ

#### `negotiations` - Переговоры
- `id` (TEXT, PRIMARY KEY) - UUID переговоров
- `candidate_id` (TEXT, NOT NULL) - Ссылка на candidates(id)
- `vacancy_id` (TEXT, NOT NULL) - Ссылка на vacancies(id)
- `application_id` (TEXT) - Ссылка на applications(id)
- `hh_negotiation_id` (TEXT, UNIQUE) - ID переговоров в HH.ru
- `external_resume_id` (TEXT) - Внешний ID резюме
- `external_vacancy_id` (TEXT) - Внешний ID вакансии
- `state` (TEXT, NOT NULL, DEFAULT 'new') - Состояние
- `source` (TEXT, NOT NULL, DEFAULT 'employer') - Источник
- `initial_message` (TEXT) - Первоначальное сообщение
- `has_updates` (INTEGER, DEFAULT 0) - Есть ли обновления
- `messages_count` (INTEGER, DEFAULT 0) - Количество сообщений
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `updated_at` (INTEGER, NOT NULL) - Дата обновления
- `viewed_at` (INTEGER) - Дата просмотра
- `responded_at` (INTEGER) - Дата ответа
- `topics` (TEXT) - Темы (JSON массив)
- `actions` (TEXT) - Действия (JSON объект)
- **Индексы**: `idx_negotiations_candidate`, `idx_negotiations_vacancy`, `idx_negotiations_state`, `idx_negotiations_hh_id`, `idx_negotiations_created`, `idx_negotiations_updated`

#### `messages` - Сообщения
- `id` (TEXT, PRIMARY KEY) - UUID сообщения
- `negotiation_id` (TEXT, NOT NULL) - Ссылка на negotiations(id)
- `hh_message_id` (TEXT, UNIQUE) - ID сообщения в HH.ru
- `author` (TEXT, NOT NULL) - Автор ('employer' или 'applicant')
- `text` (TEXT, NOT NULL) - Текст сообщения
- `read_by_applicant` (INTEGER, DEFAULT 0) - Прочитано кандидатом
- `read_by_employer` (INTEGER, DEFAULT 0) - Прочитано работодателем
- `created_at` (INTEGER, NOT NULL) - Дата создания
- `sent_at` (INTEGER) - Дата отправки
- `read_at` (INTEGER) - Дата прочтения
- `attachments` (TEXT) - Вложения (JSON массив)
- **Индексы**: `idx_messages_negotiation`, `idx_messages_created`, `idx_messages_hh_id`

#### `activities` - Активности
- `id` (TEXT, PRIMARY KEY) - UUID активности
- `candidate_id` (TEXT) - Ссылка на candidates(id)
- `vacancy_id` (TEXT) - Ссылка на vacancies(id)
- `negotiation_id` (TEXT) - Ссылка на negotiations(id)
- `action_type` (TEXT, NOT NULL) - Тип действия
- `title` (TEXT, NOT NULL) - Заголовок
- `description` (TEXT) - Описание
- `metadata` (TEXT) - Метаданные (JSON объект)
- `created_at` (INTEGER, NOT NULL) - Дата создания
- **Индексы**: `idx_activities_candidate`, `idx_activities_vacancy`, `idx_activities_negotiation`, `idx_activities_type`, `idx_activities_created`

#### `audit_log` - Журнал аудита
- `id` (TEXT, PRIMARY KEY) - UUID записи
- `table_name` (TEXT, NOT NULL) - Имя таблицы
- `record_id` (TEXT, NOT NULL) - ID записи
- `action` (TEXT, NOT NULL) - Действие ('INSERT', 'UPDATE', 'DELETE')
- `old_value` (TEXT) - Старое значение (JSON)
- `new_value` (TEXT) - Новое значение (JSON)
- `changed_fields` (TEXT) - Измененные поля (JSON массив)
- `changed_by` (TEXT) - Изменено кем
- `changed_at` (INTEGER, NOT NULL) - Дата изменения
- `ip_address` (TEXT) - IP адрес
- `user_agent` (TEXT) - User Agent
- **Индексы**: `idx_audit_table`, `idx_audit_record`, `idx_audit_changed_at`

## Связи между таблицами

```
users
  ├── sessions (user_id)
  ├── user_api_tokens (user_id)
  └── vacancies (created_by)

vacancies
  ├── search_sessions (vacancy_id)
  ├── applications (vacancy_id)
  ├── invitations (vacancy_id)
  ├── negotiations (vacancy_id)
  └── activities (vacancy_id)

candidates
  ├── applications (candidate_id)
  ├── invitations (candidate_id)
  ├── negotiations (candidate_id)
  └── activities (candidate_id)

search_sessions
  ├── applications (search_session_id)
  └── exports (search_session_id)

applications
  ├── invitations (application_id)
  └── negotiations (application_id)

negotiations
  ├── messages (negotiation_id)
  └── activities (negotiation_id)
```

## Команды для работы с БД

### Просмотр структуры
```bash
sqlite3 data/database.db ".schema"
```

### Просмотр таблиц
```bash
sqlite3 data/database.db ".tables"
```

### Подсчет записей
```bash
sqlite3 data/database.db "SELECT COUNT(*) FROM users;"
```

### Интерактивный режим
```bash
sqlite3 data/database.db
```

