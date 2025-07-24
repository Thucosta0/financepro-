'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase-client'

interface PremiumStatus {
  isPremium: boolean
  premiumUntil: string | null
  isLoading: boolean
  error: string | null
}

export function usePremiumStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<PremiumStatus>({
    isPremium: false,
    premiumUntil: null,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setStatus({
          isPremium: false,
          premiumUntil: null,
          isLoading: false,
          error: null
        })
        return
      }

      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }))

        const { data, error } = await supabase
          .from('profiles')
          .select('is_premium, premium_until')
          .eq('id', user.id)
          .single()

        if (error) {
          setStatus({
            isPremium: false,
            premiumUntil: null,
            isLoading: false,
            error: 'Erro ao verificar status premium'
          })
          return
        }

        const isPremium = data?.is_premium || false
        const premiumUntil = data?.premium_until || null

        // Verificar se o premium ainda é válido
        const isPremiumValid = isPremium && (
          !premiumUntil || new Date(premiumUntil) > new Date()
        )

        setStatus({
          isPremium: isPremiumValid,
          premiumUntil: premiumUntil,
          isLoading: false,
          error: null
        })

      } catch (error) {
        setStatus({
          isPremium: false,
          premiumUntil: null,
          isLoading: false,
          error: 'Erro ao verificar status premium'
        })
      }
    }

    checkPremiumStatus()
  }, [user])

  return status
}