'use client'

import { Crown, Clock, AlertCircle } from 'lucide-react'
import { usePremiumStatus } from '@/hooks/use-premium-status'

export function PremiumStatusBadge() {
  const { isPremium, premiumUntil, isLoading, error } = usePremiumStatus()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
        <span>Verificando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">
        <AlertCircle className="h-3 w-3" />
        <span>Erro</span>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-sm">
        <Crown className="h-3 w-3" />
        <span>Premium</span>
        {premiumUntil && (
          <div className="flex items-center space-x-1 text-xs opacity-90">
            <Clock className="h-2 w-2" />
            <span>Até {new Date(premiumUntil).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
      <span>Gratuito</span>
    </div>
  )
} 