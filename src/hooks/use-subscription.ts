import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/context/auth-context'

export interface SubscriptionStatus {
  plan_id: string
  status: string
  trial_start: string | null
  trial_end: string | null
  trial_days_remaining: number
  current_period_start: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  cancel_at_period_end: boolean
  transactions_count: number
  categories_count: number
  cards_count: number
  transactions_remaining: number
  categories_remaining: number
  cards_remaining: number
  effective_status: string
}

export interface UsageLimits {
  transactions: number
  categories: number
  cards: number
}

export const useSubscription = () => {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calcular dados de subscription baseados no perfil do usuário
  const calculateSubscription = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // 1. Buscar perfil do usuário para pegar data de criação E status premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, is_premium, premium_until')
        .eq('id', user.id)
        .single()

      const userCreatedAt = profile?.created_at || user.created_at
      const creationDate = new Date(userCreatedAt)
      const now = new Date()
      
      // 2. Verificar se tem premium ativo
      const isPremium = profile?.is_premium || false
      let premiumValid = false
      
      if (isPremium) {
        // Se tem premium_until, verificar se ainda é válido
        if (profile?.premium_until) {
          const premiumUntil = new Date(profile.premium_until)
          premiumValid = now <= premiumUntil
        } else {
          // Se não tem data de expiração, assume que é válido
          premiumValid = true
        }
      }
      
      // 3. Calcular dias desde criação (só para trial)
      const daysSinceCreation = Math.floor((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // 4. Determinar status baseado em premium primeiro, depois trial
      const trialDaysRemaining = Math.max(0, 30 - daysSinceCreation)
      const isTrialActive = trialDaysRemaining > 0
      
      // 5. Data de fim do trial
      const trialEnd = new Date(creationDate.getTime() + (30 * 24 * 60 * 60 * 1000))

      // 6. Verificar se tem assinatura PRO ativa (Stripe ou Premium manual)
      const hasProSubscription = premiumValid // Premium manual ou Stripe

      // 7. Determinar status efetivo
      let effectiveStatus = 'expired'
      if (hasProSubscription) {
        effectiveStatus = 'active_paid'
      } else if (isTrialActive) {
        effectiveStatus = 'active_trial'
      }

      // 8. Criar objeto de subscription
      const subscriptionData: SubscriptionStatus = {
        plan_id: hasProSubscription ? 'premium' : 'free',
        status: 'active',
        trial_start: creationDate.toISOString(),
        trial_end: trialEnd.toISOString(),
        trial_days_remaining: trialDaysRemaining,
        current_period_start: creationDate.toISOString(),
        current_period_end: profile?.premium_until || trialEnd.toISOString(),
        stripe_customer_id: null,
        stripe_subscription_id: null,
        cancel_at_period_end: false,
        transactions_count: 0,
        categories_count: 0,
        cards_count: 0,
        transactions_remaining: isTrialActive || hasProSubscription ? -1 : 0,
        categories_remaining: isTrialActive || hasProSubscription ? -1 : 0,
        cards_remaining: isTrialActive || hasProSubscription ? -1 : 0,
        effective_status: effectiveStatus
      }

      setSubscription(subscriptionData)
      setError(null)

    } catch (err) {
      console.error('Erro ao calcular subscription:', err)
      
      // Fallback: criar subscription padrão para trial
      const now = new Date()
      const trialEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000))
      
      const fallbackSub: SubscriptionStatus = {
        plan_id: 'free',
        status: 'active',
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
        trial_days_remaining: 30,
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        stripe_customer_id: null,
        stripe_subscription_id: null,
        cancel_at_period_end: false,
        transactions_count: 0,
        categories_count: 0,
        cards_count: 0,
        transactions_remaining: -1,
        categories_remaining: -1,
        cards_remaining: -1,
        effective_status: 'active_trial'
      }
      
      setSubscription(fallbackSub)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.created_at])

  // Verificar se pode executar uma ação
  const canPerformAction = useCallback((action: 'transactions' | 'categories' | 'cards'): boolean => {
    if (!subscription) return true // Durante loading, permitir

    // Se está em trial ou PRO, pode fazer tudo
    if (subscription.effective_status === 'active_trial' || 
        subscription.effective_status === 'active_paid') {
      return true
    }

    // Se trial expirou, bloquear
    if (subscription.effective_status === 'expired') {
      return false
    }

    return true
  }, [subscription])

  // Verificar se é plano PRO/PREMIUM
  const isPro = useCallback((): boolean => {
    return subscription?.effective_status === 'active_paid'
  }, [subscription])

  // Verificar se está em trial
  const isInTrial = useCallback((): boolean => {
    return subscription?.effective_status === 'active_trial'
  }, [subscription])

  // Verificar se trial expirou
  const isTrialExpired = useCallback((): boolean => {
    return subscription?.effective_status === 'expired'
  }, [subscription])

  // Dias restantes do trial
  const getTrialDaysRemaining = useCallback((): number => {
    if (!subscription) return 30
    return subscription.trial_days_remaining
  }, [subscription])

  // Obter status humanizado
  const getStatusText = useCallback((): string => {
    if (!subscription) return 'Carregando...'

    switch (subscription.effective_status) {
      case 'active_trial':
        return `🎉 Acesso completo ativo - ${subscription.trial_days_remaining} dias restantes`
      case 'active_paid':
        return '✨ Plano PREMIUM ativo'
      case 'expired':
        return 'Trial expirado - Faça upgrade para continuar'
      default:
        return 'Trial disponível - 30 dias grátis'
    }
  }, [subscription])

  // Funções simplificadas (mantidas para compatibilidade)
  const incrementUsage = useCallback(async (type: 'transactions' | 'categories' | 'cards') => {
    // Implementação futura se necessário
  }, [])

  const checkLimits = useCallback(async (type: 'transactions' | 'categories' | 'cards'): Promise<boolean> => {
    return canPerformAction(type)
  }, [canPerformAction])

  const getLimits = useCallback((): UsageLimits => {
    if (!subscription) {
      return { transactions: -1, categories: -1, cards: -1 }
    }

    return {
      transactions: subscription.transactions_remaining,
      categories: subscription.categories_remaining,
      cards: subscription.cards_remaining,
    }
  }, [subscription])

  const fetchSubscription = useCallback(() => {
    calculateSubscription()
  }, [calculateSubscription])

  useEffect(() => {
    if (user?.id) {
      calculateSubscription()
    }
  }, [user?.id, calculateSubscription])

  return {
    subscription,
    loading,
    error,
    fetchSubscription,
    canPerformAction,
    incrementUsage,
    checkLimits,
    getLimits,
    isPro,
    isInTrial,
    isTrialExpired,
    getTrialDaysRemaining,
    getStatusText,
  }
} 