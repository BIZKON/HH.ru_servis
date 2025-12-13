"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Users,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  Filter,
  Download,
  Star,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  ArrowLeft,
  MessagesSquare,
} from "lucide-react"
import Link from "next/link"

interface DBApplication {
  id: string
  candidate_id: string
  vacancy_id: string
  search_session_id: string
  status: string
  score: number
  score_breakdown: Record<string, number>
  rating: string
  created_at: string
  candidate: {
    id: string
    external_id: string
    full_name: string
    email?: string
    phone?: string
    current_position?: string
    location?: string
    experience_years?: number
    skills?: string[]
    resume_url?: string
    summary?: string
  }
  vacancy: {
    id: string
    external_id?: string
    title: string
    location?: string
    salary_min?: number
    salary_max?: number
    skills?: string[]
  }
  search_session: {
    id: string
    search_text: string
    created_at: string
  }
}

interface Vacancy {
  id: string
  title: string
}

interface DBCandidate {
  id: string
  external_id: string
  full_name: string
  email?: string
  phone?: string
  current_position?: string
  location?: string
  experience_years?: number
  skills?: string[]
  resume_url?: string
  summary?: string
  status?: string
  created_at: string
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<DBApplication[]>([])
  const [filteredApplications, setFilteredApplications] = useState<DBApplication[]>([])
  const [candidates, setCandidates] = useState<DBCandidate[]>([])
  const [filteredCandidates, setFilteredCandidates] = useState<DBCandidate[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"applications" | "candidates">("candidates")
  const [selectedVacancy, setSelectedVacancy] = useState<string>("all")
  const [minScore, setMinScore] = useState("")
  const [maxScore, setMaxScore] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [applications, candidates, selectedVacancy, minScore, maxScore, statusFilter, searchQuery, activeTab])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load applications
      const appsRes = await fetch("/api/db/applications")
      if (!appsRes.ok) {
        const errorData = await appsRes.json()
        throw new Error(errorData.error || "Failed to load applications")
      }
      const appsData = await appsRes.json()
      if (!Array.isArray(appsData)) {
        console.error("[v0] Invalid response format:", appsData)
        throw new Error("Invalid response format from server")
      }
      setApplications(appsData)
      if (appsData.length > 0) {
        const uniqueVacancies = Array.from(
          new Map(appsData.map((app: DBApplication) => [app.vacancy.id, app.vacancy])).values(),
        )
        setVacancies(uniqueVacancies)
      }

      // Load all candidates
      const candidatesRes = await fetch("/api/db/candidates")
      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json()
        if (candidatesData.candidates && Array.isArray(candidatesData.candidates)) {
          setCandidates(candidatesData.candidates)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      console.error("[v0] Error loading dashboard data:", errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (activeTab === "applications") {
      let filtered = [...applications]

      if (selectedVacancy !== "all") {
        filtered = filtered.filter((app) => app.vacancy_id === selectedVacancy)
      }

      if (minScore) {
        filtered = filtered.filter((app) => app.score >= Number.parseFloat(minScore))
      }

      if (maxScore) {
        filtered = filtered.filter((app) => app.score <= Number.parseFloat(maxScore))
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter((app) => app.status === statusFilter)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (app) =>
            app.candidate.full_name.toLowerCase().includes(query) ||
            app.candidate.current_position?.toLowerCase().includes(query) ||
            app.candidate.skills?.some((skill) => skill.toLowerCase().includes(query)),
        )
      }

      setFilteredApplications(filtered)
    } else {
      let filtered = [...candidates]

      if (statusFilter !== "all") {
        filtered = filtered.filter((c) => c.status === statusFilter)
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (c) =>
            c.full_name.toLowerCase().includes(query) ||
            c.current_position?.toLowerCase().includes(query) ||
            c.skills?.some((skill) => skill.toLowerCase().includes(query)),
        )
      }

      setFilteredCandidates(filtered)
    }
  }

  const stats = {
    total:
      activeTab === "applications"
        ? filteredApplications.length
        : filteredCandidates.length,
    avgScore:
      activeTab === "applications" && filteredApplications.length > 0
        ? Math.round(
            (filteredApplications.reduce((sum, app) => sum + app.score, 0) / filteredApplications.length) * 10,
          ) / 10
        : 0,
    excellent:
      activeTab === "applications"
        ? filteredApplications.filter((app) => app.score >= 80).length
        : 0,
    good:
      activeTab === "applications"
        ? filteredApplications.filter((app) => app.score >= 60 && app.score < 80).length
        : 0,
  }

  const exportCSV = () => {
    if (activeTab === "applications") {
      const headers = ["ФИО", "Должность", "Опыт (лет)", "Локация", "Скор", "Email", "Телефон", "Вакансия"]
      const rows = filteredApplications.map((app) => [
        app.candidate.full_name,
        app.candidate.current_position || "",
        app.candidate.experience_years?.toString() || "",
        app.candidate.location || "",
        app.score.toString(),
        app.candidate.email || "",
        app.candidate.phone || "",
        app.vacancy.title,
      ])

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `applications-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    } else {
      const headers = ["ФИО", "Должность", "Опыт (лет)", "Локация", "Email", "Телефон", "Статус"]
      const rows = filteredCandidates.map((c) => [
        c.full_name,
        c.current_position || "",
        c.experience_years?.toString() || "",
        c.location || "",
        c.email || "",
        c.phone || "",
        c.status || "new",
      ])

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `candidates-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Назад к поиску
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Дашборд кандидатов</h1>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <p className="text-red-600 font-medium">Ошибка загрузки данных</p>
              <p className="text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground">
                Это может быть проблема с настройками Row Level Security в Supabase.
              </p>
              <Button onClick={loadData} variant="outline">
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Назад к поиску
              </Button>
            </Link>
            <Link href="/crm">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <MessagesSquare className="h-4 w-4" />
                CRM Система
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Дашборд кандидатов</h1>
          <p className="text-muted-foreground">
            {activeTab === "applications"
              ? "Заявки кандидатов на вакансии"
              : "Все сохраненные кандидаты из базы данных"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            Обновить
          </Button>
          <Button
            onClick={exportCSV}
            disabled={activeTab === "applications" ? filteredApplications.length === 0 : filteredCandidates.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "applications" | "candidates")}>
        <TabsList>
          <TabsTrigger value="candidates">Все кандидаты ({candidates.length})</TabsTrigger>
          <TabsTrigger value="applications">Заявки ({applications.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего кандидатов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний скор</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отличные (80+)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хорошие (60-79)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {activeTab === "applications" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Вакансия</label>
                  <Select value={selectedVacancy} onValueChange={setSelectedVacancy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все вакансии</SelectItem>
                      {vacancies.map((vacancy) => (
                        <SelectItem key={vacancy.id} value={vacancy.id}>
                          {vacancy.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Мин. скор</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Макс. скор</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    min="0"
                    max="100"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Статус</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="new">Новый</SelectItem>
                  <SelectItem value="contacted">Связались</SelectItem>
                  <SelectItem value="interview">Интервью</SelectItem>
                  <SelectItem value="offer">Оффер</SelectItem>
                  <SelectItem value="rejected">Отклонен</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Поиск</label>
              <Input
                placeholder="Имя, должность, навыки..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {((activeTab === "applications" &&
            (selectedVacancy !== "all" || minScore || maxScore || statusFilter !== "all" || searchQuery)) ||
            (activeTab === "candidates" && (statusFilter !== "all" || searchQuery))) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedVacancy("all")
                setMinScore("")
                setMaxScore("")
                setStatusFilter("all")
                setSearchQuery("")
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="space-y-4">
        {activeTab === "applications" ? (
          filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Заявки не найдены. Измените параметры фильтрации или{" "}
                <Link href="/" className="text-primary hover:underline">
                  найдите новых кандидатов
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{app.candidate.full_name}</h3>
                        <p className="text-muted-foreground">{app.candidate.current_position}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={app.score >= 80 ? "default" : app.score >= 60 ? "secondary" : "outline"}>
                          <Star className="mr-1 h-3 w-3" />
                          {app.score} баллов
                        </Badge>
                        <Badge variant="outline">{app.rating}</Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {app.candidate.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {app.candidate.location}
                        </div>
                      )}
                      {app.candidate.experience_years !== undefined && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {app.candidate.experience_years} лет опыта
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(app.created_at).toLocaleDateString("ru-RU")}
                      </div>
                    </div>

                    {/* Skills */}
                    {app.candidate.skills && app.candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {app.candidate.skills.slice(0, 8).map((skill, idx) => (
                          <Badge key={idx} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {app.candidate.skills.length > 8 && (
                          <Badge variant="outline">+{app.candidate.skills.length - 8}</Badge>
                        )}
                      </div>
                    )}

                    {/* Vacancy */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Вакансия:</span>
                        <span className="text-muted-foreground">{app.vacancy.title}</span>
                        {app.vacancy.salary_min && app.vacancy.salary_max && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {app.vacancy.salary_min.toLocaleString()} - {app.vacancy.salary_max.toLocaleString()} ₽
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <Tabs defaultValue="contacts" className="w-full">
                      <TabsList>
                        <TabsTrigger value="contacts">Контакты</TabsTrigger>
                        <TabsTrigger value="score">Детали скоринга</TabsTrigger>
                      </TabsList>

                      <TabsContent value="contacts" className="space-y-2 pt-2">
                        <div className="flex flex-wrap gap-3">
                          {app.candidate.email && (
                            <a
                              href={`mailto:${app.candidate.email}`}
                              className="flex items-center gap-2 text-sm hover:text-primary"
                            >
                              <Mail className="h-4 w-4" />
                              {app.candidate.email}
                            </a>
                          )}
                          {app.candidate.phone && (
                            <a
                              href={`tel:${app.candidate.phone}`}
                              className="flex items-center gap-2 text-sm hover:text-primary"
                            >
                              <Phone className="h-4 w-4" />
                              {app.candidate.phone}
                            </a>
                          )}
                          {app.candidate.resume_url && (
                            <a
                              href={app.candidate.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Открыть резюме на HH.ru
                            </a>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="score" className="pt-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Опыт:</span>
                            <span className="ml-2 font-medium">{app.score_breakdown.experience || 0} б</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Навыки:</span>
                            <span className="ml-2 font-medium">{app.score_breakdown.skills || 0} б</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Зарплата:</span>
                            <span className="ml-2 font-medium">{app.score_breakdown.salary || 0} б</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Образование:</span>
                            <span className="ml-2 font-medium">{app.score_breakdown.education || 0} б</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Активность:</span>
                            <span className="ml-2 font-medium">{app.score_breakdown.jobSearchStatus || 0} б</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Бонус:</span>
                            <span className="ml-2 font-medium">{app.score_breakdown.bonus || 0} б</span>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
          )
        ) : (
          filteredCandidates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Кандидаты не найдены. Измените параметры фильтрации или{" "}
                <Link href="/" className="text-primary hover:underline">
                  найдите новых кандидатов
                </Link>
                .
              </CardContent>
            </Card>
          ) : (
            filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{candidate.full_name}</h3>
                          <p className="text-muted-foreground">{candidate.current_position}</p>
                        </div>
                        <Badge variant={candidate.status === "new" ? "default" : "secondary"}>
                          {candidate.status || "new"}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {candidate.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {candidate.location}
                          </div>
                        )}
                        {candidate.experience_years !== undefined && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {candidate.experience_years} лет опыта
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(candidate.created_at).toLocaleDateString("ru-RU")}
                        </div>
                      </div>

                      {/* Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 8).map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                          {candidate.skills.length > 8 && (
                            <Badge variant="outline">+{candidate.skills.length - 8}</Badge>
                          )}
                        </div>
                      )}

                      {/* Summary */}
                      {candidate.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{candidate.summary}</p>
                      )}

                      {/* Contacts */}
                      <div className="flex flex-wrap gap-3 pt-2 border-t">
                        {candidate.email && (
                          <a
                            href={`mailto:${candidate.email}`}
                            className="flex items-center gap-2 text-sm hover:text-primary"
                          >
                            <Mail className="h-4 w-4" />
                            {candidate.email}
                          </a>
                        )}
                        {candidate.phone && (
                          <a
                            href={`tel:${candidate.phone}`}
                            className="flex items-center gap-2 text-sm hover:text-primary"
                          >
                            <Phone className="h-4 w-4" />
                            {candidate.phone}
                          </a>
                        )}
                        {candidate.resume_url && (
                          <a
                            href={candidate.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Открыть резюме на HH.ru
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  )
}
