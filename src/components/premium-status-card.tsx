'use client'

import { Crown, Clock, CheckCircle, XCircle, Star, Zap } from 'lucide-react'
import { usePremiumStatus } from '@/hooks/use-premium-status'

export function PremiumStatusCard() {
  const { isPremium, premiumUntil, isLoading, error } = usePremiumStatus()

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="text-gray-600">Verificando status premium...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <div className="flex items-center space-x-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Erro ao verificar status</h3>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 p-4 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-full">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-900">Conta Premium</h3>
              <p className="text-sm text-purple-700">Acesso completo a todas as funcionalidades</p>
              {premiumUntil && (
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600">
                    Válido até {new Date(premiumUntil).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            ATIVO
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm text-purple-800">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span>Acesso ilimitado a transações</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-800">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span>Relatórios avançados</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-800">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span>Suporte prioritário</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-800">
            <CheckCircle className="h-4 w-4 text-purple-600" />
            <span>Funcionalidades exclusivas</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-400 p-2 rounded-full">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Conta Gratuita</h3>
            <p className="text-sm text-gray-600">Acesso limitado às funcionalidades básicas</p>
          </div>
        </div>
        <div className="bg-gray-400 text-white px-2 py-1 rounded-full text-xs font-medium">
          GRATUITO
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Transações básicas</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Categorização simples</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <XCircle className="h-4 w-4 text-gray-400" />
          <span>Relatórios avançados</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <XCircle className="h-4 w-4 text-gray-400" />
          <span>Funcionalidades premium</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Quer mais funcionalidades?</span>
        </div>
        <p className="text-xs text-purple-600 mt-1">
          Entre em contato com o administrador para solicitar acesso premium gratuito.
        </p>
      </div>
    </div>
  )
} 