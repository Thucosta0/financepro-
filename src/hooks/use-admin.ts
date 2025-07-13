'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'

// Email do administrador
const ADMIN_EMAIL = 'arthurcos33@gmail.com'
const ADMIN_USERNAME = 'thucosta'

export function useAdmin() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = () => {
      if (!user || !user.email) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      // Verificar se o email corresponde ao admin
      const userIsAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      
      // Verificação adicional por username se disponível nos metadados do usuário
      const username = user.user_metadata?.username || user.user_metadata?.name
      const usernameIsAdmin = username?.toLowerCase() === ADMIN_USERNAME.toLowerCase()
      
      setIsAdmin(userIsAdmin || usernameIsAdmin)
      setIsLoading(false)
    }

    checkAdminStatus()
  }, [user])

  return {
    isAdmin,
    isLoading,
    adminEmail: ADMIN_EMAIL,
    adminUsername: ADMIN_USERNAME
  }
} 