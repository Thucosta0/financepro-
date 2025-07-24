'use client'

import { useState } from 'react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Plus, ArrowRight, Sparkles, Target, Zap, Star } from 'lucide-react'

interface OnboardingWizardProps {
  onComplete: () => void
}

// Categorias sugeridas organizadas por perfil
const SUGGESTED_CATEGORIES = {
  essential: [
    { name: 'Alimentação', icon: '🍽️', color: '#ef4444', type: 'expense' as const },
    { name: 'Transporte', icon: '🚗', color: '#f97316', type: 'expense' as const },
    { name: 'Moradia', icon: '🏠', color: '#eab308', type: 'expense' as const },
    { name: 'Salário', icon: '💰', color: '#10b981', type: 'income' as const },
  ],
  lifestyle: [
    { name: 'Lazer', icon: '🎮', color: '#8b5cf6', type: 'expense' as const },
    { name: 'Compras', icon: '🛒', color: '#ec4899', type: 'expense' as const },
    { name: 'Saúde', icon: '🏥', color: '#22c55e', type: 'expense' as const },
    { name: 'Educação', icon: '📚', color: '#3b82f6', type: 'expense' as const },
  ],
  business: [
    { name: 'Freelance', icon: '💻', color: '#059669', type: 'income' as const },
    { name: 'Investimentos', icon: '📈', color: '#0d9488', type: 'income' as const },
    { name: 'Serviços', icon: '🔧', color: '#6b7280', type: 'expense' as const },
    { name: 'Equipamentos', icon: '🖥️', color: '#6366f1', type: 'expense' as const },
  ]
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { addCategory } = useFinancial()
  const { isTrialExpired } = useSubscription()
  const [step, setStep] = useState(1)
  const [selectedCategories, setSelectedCategories] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const handleCategoryToggle = (category: any) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.name === category.name)
      if (exists) {
        return prev.filter(c => c.name !== category.name)
      } else {
        return [...prev, category]
      }
    })
  }

  const handleCreateCategories = async () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }

    if (selectedCategories.length === 0) {
      onComplete()
      return
    }

    setIsCreating(true)

    try {
      // Criar todas as categorias selecionadas
      for (const category of selectedCategories) {
        await addCategory({
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color
        })
      }

      onComplete()
    } catch (error) {
      alert('Erro ao criar categorias padrão. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
        <Card className="max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 lg:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">🎉 Bem-vindo ao FinancePRO!</h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Vamos configurar sua conta para ter a melhor experiência personalizada
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Quer começar com categorias sugeridas?
              </h2>
              <p className="text-gray-600 text-sm sm:text-base px-2">
                Podemos criar algumas categorias para você começar rapidamente, 
                ou você pode criar suas próprias categorias do zero.
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className="p-4 sm:p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <div className="text-center">
                  <Target className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
                  <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Categorias Sugeridas</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 px-2">
                    Escolha entre categorias organizadas por perfil
                  </p>
                  <Button 
                    onClick={() => setStep(2)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                </div>
              </Card>

              <Card className="p-4 sm:p-6 border-2 border-gray-200 hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
                  <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Começar do Zero</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 px-2">
                    Criar suas próprias categorias conforme a necessidade
                  </p>
                  <Button 
                    onClick={handleSkip}
                    variant="outline"
                    className="w-full text-sm sm:text-base"
                  >
                    Começar Limpo
                  </Button>
                </div>
              </Card>
            </div>

            <div className="text-center text-xs sm:text-sm text-gray-500 px-4">
              💡 Você pode sempre criar, editar ou excluir categorias depois
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <Card className="max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl font-bold mb-2">📋 Escolha suas categorias iniciais</h1>
          <p className="text-blue-100 text-sm sm:text-base">
            Selecione as categorias que fazem sentido para seu perfil financeiro
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {/* Categorias Essenciais */}
          <div className="mb-6 sm:mb-8">
            <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              Essenciais (Recomendado)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {SUGGESTED_CATEGORIES.essential.map((category) => {
                const isSelected = selectedCategories.find(c => c.name === category.name)
                return (
                  <div
                    key={category.name}
                    onClick={() => handleCategoryToggle(category)}
                    className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs sm:text-sm font-medium leading-tight">{category.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(category.type as string) === 'income' ? 'Receita' : 'Despesa'}
                      </div>
                      {isSelected && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mx-auto mt-1" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Categorias de Estilo de Vida */}
          <div className="mb-6 sm:mb-8">
            <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">🏖️ Estilo de Vida</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {SUGGESTED_CATEGORIES.lifestyle.map((category) => {
                const isSelected = selectedCategories.find(c => c.name === category.name)
                return (
                  <div
                    key={category.name}
                    onClick={() => handleCategoryToggle(category)}
                    className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs sm:text-sm font-medium leading-tight">{category.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(category.type as string) === 'income' ? 'Receita' : 'Despesa'}
                      </div>
                      {isSelected && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mx-auto mt-1" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Categorias de Negócio */}
          <div className="mb-6 sm:mb-8">
            <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">💼 Negócios & Investimentos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {SUGGESTED_CATEGORIES.business.map((category) => {
                const isSelected = selectedCategories.find(c => c.name === category.name)
                return (
                  <div
                    key={category.name}
                    onClick={() => handleCategoryToggle(category)}
                    className={`p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl mb-1">{category.icon}</div>
                      <div className="text-xs sm:text-sm font-medium leading-tight">{category.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(category.type as string) === 'income' ? 'Receita' : 'Despesa'}
                      </div>
                      {isSelected && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mx-auto mt-1" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Status selecionado */}
          {selectedCategories.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-blue-800 text-xs sm:text-sm">
                ✅ <strong>{selectedCategories.length} categorias selecionadas</strong>
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                {selectedCategories.map((cat) => (
                  <span 
                    key={cat.name}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    {cat.icon} {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col gap-3">
            {/* Botão pular em cima no mobile */}
            <div className="sm:hidden">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="w-full text-sm"
              >
                Pular - Começar Limpo
              </Button>
            </div>

            {/* Botões principais */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <div className="hidden sm:block">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="text-sm"
                >
                  Pular - Começar Limpo
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-full sm:w-auto text-sm"
                >
                  Voltar
                </Button>
                
                <Button
                  onClick={handleCreateCategories}
                  disabled={isCreating}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Criando...</span>
                      <span className="sm:hidden">Criando</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {selectedCategories.length > 0 
                          ? `Criar ${selectedCategories.length} Categorias` 
                          : 'Continuar sem Categorias'
                        }
                      </span>
                      <span className="sm:hidden">
                        {selectedCategories.length > 0 
                          ? `Criar ${selectedCategories.length}` 
                          : 'Continuar'
                        }
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}