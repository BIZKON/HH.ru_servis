"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { TokenInput } from "@/components/token-input"
import { SearchForm } from "@/components/search-form"
import { CandidatesList } from "@/components/candidates-list"
import { StatisticsCard } from "@/components/statistics-card"
import { ExportButton } from "@/components/export-button"
import { SearchHistoryButton, addToHistory } from "@/components/search-history"
import { VacancyConfigForm, DEFAULT_VACANCY_CONFIG } from "@/components/vacancy-config"
import { InviteDialog } from "@/components/invite-dialog"
import { BatchProgressCard } from "@/components/batch-progress"
import { SaveToDBButton } from "@/components/save-to-db-button"
import { loadAllResumes, type BatchProgress } from "@/lib/batch-loader"
import type { ScoringConfig } from "@/lib/scoring"
import type { SearchFilters, ScoredCandidate, VacancyConfig } from "@/lib/types"
import { Rocket, Search, Database, BookOpen, LayoutDashboard, MessagesSquare, User } from "lucide-react"
import { AuthDialog } from "@/components/auth-dialog"
import Link from "next/link"

const defaultFilters: SearchFilters = {
  text: "",
  area: "",
  experience: "",
  employment: "",
  schedule: "",
  salaryFrom: "",
  salaryTo: "",
  orderBy: "relevance",
  resumeSearchPeriod: "",
}

export default function HomePage() {
  const [token, setToken] = useState("")
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [candidates, setCandidates] = useState<ScoredCandidate[]>([])
  const [totalFound, setTotalFound] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
  const [lastQuery, setLastQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [vacancyConfig, setVacancyConfig] = useState<VacancyConfig>(DEFAULT_VACANCY_CONFIG)
  const [inviteCandidate, setInviteCandidate] = useState<ScoredCandidate | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [currentSearchSessionId, setCurrentSearchSessionId] = useState<string | undefined>()
  const [currentDbVacancyId, setCurrentDbVacancyId] = useState<string | undefined>()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  const getScoringConfig = (): ScoringConfig => ({
    experience: {
      weight: 30,
      requiredLevel: vacancyConfig.requiredExperience || "between1And3",
    },
    skills: {
      weight: 25,
      required: vacancyConfig.requiredSkills,
      bonus: vacancyConfig.bonusSkills,
    },
    salary: {
      weight: 15,
      optimal: {
        min: vacancyConfig.salaryMin || 90000,
        max: vacancyConfig.salaryMax || 150000,
      },
    },
    education: { weight: 10 },
    jobSearchStatus: { weight: 10 },
    bonus: { weight: 10 },
  })

  const performBatchSearch = useCallback(async () => {
    if (!token || !filters.text.trim()) return

    setIsLoading(true)
    setIsBatchMode(true)
    setError(null)
    setBatchProgress(null)
    setCurrentSearchSessionId(undefined)
    setCurrentDbVacancyId(undefined)
    const startTime = performance.now()

    try {
      const scoredCandidates = await loadAllResumes(
        token,
        {
          text: filters.text,
          area: filters.area && filters.area !== "all" ? filters.area : undefined,
          experience: filters.experience && filters.experience !== "any" ? filters.experience : undefined,
          employment: filters.employment && filters.employment !== "any" ? filters.employment : undefined,
          schedule: filters.schedule && filters.schedule !== "any" ? filters.schedule : undefined,
          salary_from: filters.salaryFrom ? Number(filters.salaryFrom) : undefined,
          salary_to: filters.salaryTo ? Number(filters.salaryTo) : undefined,
          order_by: filters.orderBy || "relevance",
          resume_search_period:
            filters.resumeSearchPeriod && filters.resumeSearchPeriod !== "all"
              ? Number(filters.resumeSearchPeriod)
              : undefined,
        },
        getScoringConfig(),
        (progress) => {
          setBatchProgress(progress)
          if (progress.searchSessionId) {
            setCurrentSearchSessionId(progress.searchSessionId)
          }
          if (progress.vacancyId) {
            setCurrentDbVacancyId(progress.vacancyId)
          }
        },
        100,
        autoSaveEnabled ? vacancyConfig : undefined,
      )

      setCandidates(scoredCandidates)
      setTotalFound(scoredCandidates.length)
      setTotalPages(1)
      setCurrentPage(0)
      setLastQuery(filters.text)
      setSearchTime((performance.now() - startTime) / 1000)

      addToHistory(filters, scoredCandidates.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка")
      setCandidates([])
      setTotalFound(0)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }, [token, filters, vacancyConfig, autoSaveEnabled])

  const performSimpleSearch = useCallback(
    async (page = 0) => {
      if (!token || !filters.text.trim()) return

      setIsLoading(true)
      setIsBatchMode(false)
      setBatchProgress(null)
      setError(null)
      setCurrentSearchSessionId(undefined)
      setCurrentDbVacancyId(undefined)
      const startTime = performance.now()

      try {
        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            text: filters.text,
            area: filters.area && filters.area !== "all" ? filters.area : undefined,
            experience: filters.experience && filters.experience !== "any" ? filters.experience : undefined,
            employment: filters.employment && filters.employment !== "any" ? filters.employment : undefined,
            schedule: filters.schedule && filters.schedule !== "any" ? filters.schedule : undefined,
            salary_from: filters.salaryFrom ? Number(filters.salaryFrom) : undefined,
            salary_to: filters.salaryTo ? Number(filters.salaryTo) : undefined,
            order_by: filters.orderBy || "relevance",
            resume_search_period:
              filters.resumeSearchPeriod && filters.resumeSearchPeriod !== "all"
                ? Number(filters.resumeSearchPeriod)
                : undefined,
            page,
            per_page: 20,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Ошибка поиска")
        }

        const { scoreCandidate } = await import("@/lib/scoring")
        const scoringConfig = getScoringConfig()
        const scoredCandidates: ScoredCandidate[] = data.candidates.map((c: any) => ({
          ...c,
          ...scoreCandidate(data.items?.find((i: any) => i.id === c.id) || {}, scoringConfig),
        }))

        scoredCandidates.sort((a, b) => b.score - a.score)

        setCandidates(scoredCandidates)
        setTotalFound(data.found)
        setTotalPages(data.pages)
        setCurrentPage(page)
        setLastQuery(filters.text)
        setSearchTime((performance.now() - startTime) / 1000)

        if (page === 0) {
          addToHistory(filters, data.found)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка")
        setCandidates([])
        setTotalFound(0)
        setTotalPages(0)
      } finally {
        setIsLoading(false)
      }
    },
    [token, filters, vacancyConfig],
  )

  const handleSearch = () => {
    setCurrentPage(0)
    performSimpleSearch(0)
  }

  const handleBatchSearch = () => {
    performBatchSearch()
  }

  const handlePageChange = (page: number) => {
    performSimpleSearch(page)
  }

  const handleHistorySelect = (historyFilters: SearchFilters) => {
    setFilters(historyFilters)
  }

  const handleInvite = (candidate: ScoredCandidate) => {
    setInviteCandidate(candidate)
    setIsInviteDialogOpen(true)
  }

  const handleFiltersUpdate = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <h1 className="text-lg font-semibold">HH.ru Candidate Search</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/crm">
              <Button variant="ghost" size="sm" className="gap-2">
                <MessagesSquare className="h-4 w-4" />
                <span className="hidden sm:inline">CRM</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Дашборд</span>
              </Button>
            </Link>
            <Link href="/instruction">
              <Button variant="ghost" size="sm" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Инструкция</span>
              </Button>
            </Link>
            <SearchHistoryButton onSelectHistory={handleHistorySelect} />
            <ExportButton
              candidates={candidates}
              searchSessionId={currentSearchSessionId}
              vacancyId={currentDbVacancyId}
              appliedFilters={filters}
            />
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setIsAuthDialogOpen(true)}>
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Войти</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      <main className="mx-auto max-w-5xl space-y-6 p-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">1. API Авторизация</CardTitle>
            <CardDescription>Введите токен для доступа к API HH.ru</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenInput value={token} onChange={setToken} />
          </CardContent>
        </Card>

        {token && (
          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </span>
              Настройте вакансию
            </h2>
            <VacancyConfigForm
              config={vacancyConfig}
              onChange={setVacancyConfig}
              token={token}
              onFiltersChange={handleFiltersUpdate}
            />
          </div>
        )}

        {token && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  3
                </span>
                Поиск кандидатов
              </CardTitle>
              <CardDescription>Найдите подходящих специалистов по резюме на HH.ru</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchForm
                filters={filters}
                onFiltersChange={setFilters}
                onSearch={handleSearch}
                isLoading={isLoading}
                hasToken={!!token}
              />

              <div className="flex flex-wrap gap-3 border-t pt-4">
                <Button onClick={handleSearch} disabled={isLoading || !filters.text.trim()} className="gap-2">
                  <Search className="h-4 w-4" />
                  Быстрый поиск
                </Button>
                <Button
                  onClick={handleBatchSearch}
                  disabled={isLoading || !filters.text.trim()}
                  variant="secondary"
                  className="gap-2"
                >
                  <Rocket className="h-4 w-4" />
                  Полный поиск с оценкой (до 100)
                </Button>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Автосохранение в базу данных</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    При полном поиске все резюме автоматически сохраняются в Supabase
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-gray-600"></div>
                </label>
              </div>

              {currentSearchSessionId && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs dark:border-green-900 dark:bg-green-950">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-green-700 dark:text-green-300">
                    Сессия поиска: <code className="font-mono">{currentSearchSessionId.slice(0, 8)}...</code>
                  </span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Полный поиск загрузит до 100 резюме, оценит каждого кандидата по настройкам вакансии
                {autoSaveEnabled && " и автоматически сохранит в базу данных"}
              </p>
            </CardContent>
          </Card>
        )}

        {batchProgress && <BatchProgressCard progress={batchProgress} />}

        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {lastQuery && !error && (
          <StatisticsCard totalFound={totalFound} searchTime={searchTime} searchQuery={lastQuery} />
        )}

        {(candidates.length > 0 || isLoading) && (
          <div className="space-y-4">
            {candidates.length > 0 && !isLoading && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Найдено {candidates.length} кандидатов</p>
                        <p className="text-xs text-muted-foreground">
                          Сохраните их в базу данных, чтобы просматривать в любой момент
                        </p>
                      </div>
                    </div>
                    <SaveToDBButton candidates={candidates} vacancyConfig={vacancyConfig} disabled={isLoading} />
                  </div>
                </CardContent>
              </Card>
            )}
            <CandidatesList
              candidates={candidates}
              totalFound={totalFound}
              currentPage={currentPage}
              totalPages={isBatchMode ? 1 : totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
              vacancyConfig={vacancyConfig}
              onInvite={handleInvite}
            />
          </div>
        )}

        {!token && candidates.length === 0 && !isLoading && (
          <Card className="bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="h-16 w-16 text-muted-foreground/30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5S15.41 5 14 5 12 7.01 12 9.5 14 14 15.5 14z" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold">Начните поиск кандидатов</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Введите ваш API токен HH.ru и настройте параметры вакансии для поиска подходящих специалистов
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="mt-auto border-t py-4">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-muted-foreground">
          Данные предоставлены API HH.ru. Все найденные резюме автоматически сохраняются в базу данных Supabase.
        </div>
      </footer>

      <InviteDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        candidate={inviteCandidate}
        vacancyConfig={vacancyConfig}
        token={token}
        dbVacancyId={currentDbVacancyId}
      />
    </div>
  )
}
