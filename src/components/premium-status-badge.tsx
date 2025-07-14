'use client'

import { Crown, Clock, AlertCircle } from 'lucide-react'
import { usePremiumStatus } from '@/hooks/use-premium-status'

export function PremiumStatusBadge() {
  const { isPremium, premiumUntil, isLoading, error } = usePremiumStatus()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
        <div className="animate-spin rounded-full h-2 w-2 border-b border-gray-600"></div>
        <span>Verificando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
        <AlertCircle className="h-2 w-2" />
        <span>Erro</span>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-xs font-medium shadow-sm">
        <Crown className="h-2 w-2" />
        <span>Premium</span>
        {premiumUntil && (
          <div className="flex items-center space-x-0.5 text-[10px] opacity-90">
            <Clock className="h-1.5 w-1.5" />
            <span>Até {new Date(premiumUntil).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
      <span>Gratuito</span>
    </div>
  )
}