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
    const checkToken = async () => {
      try {
        const response = await fetch("/api/token")
        if (response.ok) {
          const data = await response.json()
          if (data.hasToken) {
            // Токен есть, но мы не можем его получить (безопасность)
            // Пользователь должен ввести его заново или он уже используется на сервере
          }
        }
      } catch (error) {
        console.error("Error checking token:", error)
      }
    }
    checkToken()
  }, [])

  const handleChange = async (newValue: string) => {
    onChange(newValue)

    // Сохраняем токен на сервер при изменении
    if (newValue && newValue.length > 10) {
      setIsSaving(true)
      try {
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: newValue }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Ошибка сохранения токена:", error.error)
        }
      } catch (error) {
        console.error("Ошибка сохранения токена:", error)
      } finally {
        setIsSaving(false)
      }
    } else if (!newValue) {
      // Удаляем токен если поле очищено
      try {
        await fetch("/api/token", {
          method: "DELETE",
        })
      } catch (error) {
        console.error("Ошибка удаления токена:", error)
      }
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
