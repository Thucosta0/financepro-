'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { Charts } from '@/components/dashboard/charts'
import { NewTransactionModal } from '@/components/new-transaction-modal'

import { ProtectedRoute } from '@/components/protected-route'
import { Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { categories, cards, isLoading } = useFinancial()
  const { canPerformAction, isInTrial, isTrialExpired, getTrialDaysRemaining } = useSubscription()
  
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)

  const [showOnboarding, setShowOnboarding] = useState(false)

  // Detectar se precisa de configuração inicial
  useEffect(() => {
    // Só verificar onboarding após os dados carregarem
    if (!isLoading && !isTrialExpired()) {
      const needsConfiguration = categories.length === 0 || 
                                categories.filter(c => c.type === 'expense').length === 0 ||
                                cards.length === 0

      if (needsConfiguration && categories.length === 0) {
        setShowOnboarding(true)
      } else {
        setShowOnboarding(false)
      }
    }
  }, [categories, cards, isTrialExpired, isLoading])



  // Função para determinar se pode criar transação
  const canCreateTransaction = categories.filter(c => c.type === 'expense').length > 0 && 
                              cards.length > 0

  const canCreateTransactionFull = canCreateTransaction && canPerformAction('transactions')



  // Função para obter propriedades do botão de transação
  const getTransactionButtonProps = () => {
    if (isTrialExpired()) {
      return {
        text: 'Trial Expirado - Renovar',
        className: 'bg-red-600 text-white hover:bg-red-700 animate-pulse',
        icon: AlertTriangle,
        onClick: () => router.push('/planos'),
        title: 'Seu trial expirou. Clique para renovar.'
      }
    }
    
    if (!canCreateTransaction) {
      return {
        text: 'Preparar Sistema',
        className: 'bg-yellow-600 text-white hover:bg-yellow-700',
        icon: Clock,
        onClick: () => router.push('/categorias'),
        title: 'Configure categorias e cartões primeiro'
      }
    }
    
    return {
      text: 'Nova Transação',
      className: 'bg-blue-600 text-white hover:bg-blue-700',
      icon: Plus,
      onClick: () => setShowNewTransactionModal(true),
      title: 'Adicionar nova transação'
    }
  }

  const transactionButtonProps = getTransactionButtonProps()
  const TransactionIcon = transactionButtonProps.icon

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }



  // Mostrar loading enquanto carrega dados
  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando seus dados financeiros...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Container centralizado */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header centralizado */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
              <p className="text-gray-600 mt-2">Visão completa das suas finanças</p>
              
              {/* Botões de ação centralizados */}
              <div className="flex justify-center gap-4 mt-6">
                <button 
                  onClick={transactionButtonProps.onClick}
                  className={`px-6 py-3 rounded-lg flex items-center space-x-2 ${transactionButtonProps.className} transition-all`}
                  title={transactionButtonProps.title}
                >
                  <TransactionIcon className="h-5 w-5" />
                  <span>{transactionButtonProps.text}</span>
                </button>
                

              </div>
            </div>

            {/* Alert de trial expirado */}
            {isTrialExpired() && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-red-600 mr-3">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Trial de 30 dias expirado</h3>
                      <p className="text-sm text-red-700 mt-1">
                        Seu trial completo acabou. Faça upgrade para continuar usando todas as funcionalidades.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/planos')}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors font-medium"
                    >
                      Renovar Agora
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status do trial */}
            {isInTrial() && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-green-600 mr-3">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800">
                        🎉 Trial Ativo - Acesso Completo!
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Você tem <strong>{getTrialDaysRemaining()} dias restantes</strong> de acesso ilimitado a todas as funcionalidades.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/planos')}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors font-medium"
                    >
                      Ver Planos
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* Análise Visual Avançada - centralizada */}
            <div className="max-w-6xl mx-auto">
              <Charts />
            </div>


          </div>
        </div>

        {/* Modais */}
        <NewTransactionModal
          isOpen={showNewTransactionModal}
          onClose={() => setShowNewTransactionModal(false)}
        />

        

        {/* Onboarding Wizard para contas novas */}
        {showOnboarding && (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        )}
      </div>
    </ProtectedRoute>
  )
}