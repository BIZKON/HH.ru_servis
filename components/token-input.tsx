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
              console.log("[TokenInput] Token exists on server for authenticated user")
            }
          }
        } else {
          // Загружаем токен из localStorage для неавторизованного пользователя
          const savedToken = localStorage.getItem("hh_token")
          if (savedToken && savedToken !== value) {
            console.log("[TokenInput] Loading token from localStorage:", savedToken.substring(0, 10) + "...")
            onChange(savedToken)
          }
        }
      } catch (error) {
        console.error("[TokenInput] Error loading token:", error)
        // В случае ошибки пробуем загрузить из localStorage
        const savedToken = localStorage.getItem("hh_token")
        if (savedToken && savedToken !== value) {
          console.log("[TokenInput] Loading token from localStorage after error:", savedToken.substring(0, 10) + "...")
          onChange(savedToken)
        }
      }
    }
    loadToken()
  }, [onChange, value])

  const handleChange = async (newValue: string) => {
    console.log("[TokenInput] handleChange called with value:", newValue ? `${newValue.substring(0, 10)}...` : "EMPTY")
    onChange(newValue)

    // Проверяем авторизацию пользователя
    try {
      const authResponse = await fetch("/api/auth/me")
      const isAuthenticated = authResponse.ok
      console.log("[TokenInput] User authenticated:", isAuthenticated)

      if (newValue && newValue.length > 10) {
        if (isAuthenticated) {
          // Сохраняем токен на сервер для авторизованного пользователя
          console.log("[TokenInput] Saving token to server")
          setIsSaving(true)
          try {
            const response = await fetch("/api/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: newValue }),
            })

            if (!response.ok) {
              const error = await response.json()
              console.error("[TokenInput] Error saving token to server:", error.error)
            } else {
              console.log("[TokenInput] Token saved to server successfully")
            }
          } catch (error) {
            console.error("[TokenInput] Error saving token to server:", error)
          } finally {
            setIsSaving(false)
          }
        } else {
          // Сохраняем токен локально для неавторизованного пользователя
          console.log("[TokenInput] Saving token to localStorage")
          localStorage.setItem("hh_token", newValue)
          setIsSaving(false)
        }
      } else if (!newValue) {
        // Удаляем токен
        console.log("[TokenInput] Removing token")
        if (isAuthenticated) {
          try {
            await fetch("/api/token", {
              method: "DELETE",
            })
            console.log("[TokenInput] Token removed from server")
          } catch (error) {
            console.error("[TokenInput] Error removing token from server:", error)
          }
        } else {
          localStorage.removeItem("hh_token")
          console.log("[TokenInput] Token removed from localStorage")
        }
      }
    } catch (error) {
      console.error("[TokenInput] Error checking authentication:", error)
      // В случае ошибки сохраняем локально
      if (newValue && newValue.length > 10) {
        console.log("[TokenInput] Saving token to localStorage due to error")
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
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-colors font-medium"
        >
          ⚠️ Токен истек - получить новый
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
