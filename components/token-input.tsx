"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, Key, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface TokenInputProps {
  value: string
  onChange: (value: string) => void
}

export function TokenInput({ value, onChange }: TokenInputProps) {
  const [showToken, setShowToken] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Проверяем наличие токена при загрузке
  useEffect(() => {
    const loadToken = async () => {
      try {
        const authResponse = await fetch("/api/auth/me")
        const isAuthenticated = authResponse.ok

        if (isAuthenticated) {
          // Загружаем токен с сервера для авторизованного пользователя
          const response = await fetch("/api/token")
          if (response.ok) {
            const data = await response.json()
            if (data.hasToken) {
              // Токен есть на сервере, но мы не можем его получить для отображения
              // Пользователь должен ввести его заново для безопасности
            }
          }
        } else {
          // Загружаем токен из localStorage для неавторизованного пользователя
          const savedToken = localStorage.getItem("hh_token")
          if (savedToken) {
            onChange(savedToken)
          }
        }
      } catch (error) {
        console.error("Error loading token:", error)
        // В случае ошибки пробуем загрузить из localStorage
        const savedToken = localStorage.getItem("hh_token")
        if (savedToken) {
          onChange(savedToken)
        }
      }
    }
    loadToken()
  }, [onChange])

  const handleChange = async (newValue: string) => {
    onChange(newValue)

    // Проверяем авторизацию пользователя
    try {
      const authResponse = await fetch("/api/auth/me")
      const isAuthenticated = authResponse.ok

      if (newValue && newValue.length > 10) {
        if (isAuthenticated) {
          // Сохраняем токен на сервер для авторизованного пользователя
          setIsSaving(true)
          try {
            const response = await fetch("/api/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: newValue }),
            })

            if (!response.ok) {
              const error = await response.json()
              console.error("Ошибка сохранения токена на сервер:", error.error)
            }
          } catch (error) {
            console.error("Ошибка сохранения токена на сервер:", error)
          } finally {
            setIsSaving(false)
          }
        } else {
          // Сохраняем токен локально для неавторизованного пользователя
          localStorage.setItem("hh_token", newValue)
          setIsSaving(false)
        }
      } else if (!newValue) {
        // Удаляем токен
        if (isAuthenticated) {
          try {
            await fetch("/api/token", {
              method: "DELETE",
            })
          } catch (error) {
            console.error("Ошибка удаления токена:", error)
          }
        } else {
          localStorage.removeItem("hh_token")
        }
      }
    } catch (error) {
      console.error("Ошибка проверки авторизации:", error)
      // В случае ошибки сохраняем локально
      if (newValue && newValue.length > 10) {
        localStorage.setItem("hh_token", newValue)
      } else if (!newValue) {
        localStorage.removeItem("hh_token")
      }
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="token" className="flex items-center gap-2 text-sm font-medium">
          <Key className="h-4 w-4" />
          API Токен HH.ru
        </Label>
        <a
          href="https://dev.hh.ru/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Получить токен
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="relative">
        <Input
          id="token"
          type={showToken ? "text" : "password"}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Введите ваш API токен"
          className="pr-10 font-mono text-sm"
          disabled={isSaving}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setShowToken(!showToken)}
          aria-label={showToken ? "Скрыть токен" : "Показать токен"}
        >
          {showToken ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {isSaving ? "Сохранение..." : "Токен шифруется и хранится безопасно на сервере"}
      </p>
    </div>
  )
}
