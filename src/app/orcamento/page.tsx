'use client'

import { useState, useEffect } from 'react'
import { Plus, AlertTriangle, Lightbulb, Edit2, Trash2, Loader2, Sparkles } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import { NewCategoryModal } from '@/components/new-category-modal'
import { BudgetModal } from '@/components/budget-modal'
import { ProtectedRoute } from '@/components/protected-route'

export default function OrcamentoPage() {
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [aiTip, setAiTip] = useState<{ titulo: string; descricao: string } | null>(null)
  const [isLoadingTip, setIsLoadingTip] = useState(false)
  const { transactions, categories, budgets, deleteBudget, getFinancialSummary } = useFinancial()
  const { canPerformAction, isTrialExpired } = useSubscription()

  // Obter mês e ano atual
  const mesAtual = new Date().getMonth() + 1
  const anoAtual = new Date().getFullYear()

  // Orçamentos para o mês atual
  const orcamentosAtuais = budgets
    .filter(b => b.month === mesAtual && b.year === anoAtual)
    .map(budget => {
      const categoria = categories.find(c => c.id === budget.category_id)
      const gastoReal = transactions
        .filter(t => {
          const transactionDate = new Date(t.transaction_date)
          return t.category_id === budget.category_id && 
                 t.type === 'expense' &&
                 transactionDate.getMonth() + 1 === mesAtual &&
                 transactionDate.getFullYear() === anoAtual
        })
        .reduce((sum, t) => sum + t.amount, 0)
      
      return {
        id: budget.id,
        categoria: categoria?.name || 'Categoria não encontrada',
        categoriaIcon: categoria?.icon || '❓',
        limite: budget.budget_limit,
        gasto: gastoReal,
        cor: categoria?.color || '#666'
      }
    })
    .sort((a, b) => a.categoria.localeCompare(b.categoria))

  // Calcular totais
  const totalOrcamento = orcamentosAtuais.reduce((sum, o) => sum + o.limite, 0)
  const totalGasto = orcamentosAtuais.reduce((sum, o) => sum + o.gasto, 0)
  const percentualGeral = totalOrcamento > 0 ? (totalGasto / totalOrcamento) * 100 : 0

  // Gerar dica de IA personalizada
  const generateAiTip = async () => {
    setIsLoadingTip(true)
    try {
      const financialData = getFinancialSummary()
      
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Baseado nos meus dados financeiros (receitas: ${financialData.receitas}, despesas: ${financialData.despesas}, saldo: ${financialData.saldo}), me dê UMA dica financeira específica e prática para orçamento. Responda APENAS no formato: "Título: [título da dica] | Descrição: [descrição detalhada]"`,
          financialData: financialData,
          isForBudgetTip: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Parse da resposta da IA
        const responseText = data.response
        const titleMatch = responseText.match(/Título:\s*([^|]+)/i)
        const descMatch = responseText.match(/Descrição:\s*(.+)/i)
        
        if (titleMatch && descMatch) {
          setAiTip({
            titulo: titleMatch[1].trim(),
            descricao: descMatch[1].trim()
          })
        } else {
          // Fallback se o formato não for seguido
          setAiTip({
            titulo: "💡 Dica Personalizada",
            descricao: responseText
          })
        }
      } else {
        throw new Error('Erro ao gerar dica')
      }
    } catch (error) {
      console.error('Erro ao gerar dica da IA:', error)
      // Dica padrão em caso de erro
      setAiTip({
        titulo: "💡 Dica Financeira",
        descricao: "Revise seus gastos semanalmente e ajuste seu orçamento conforme necessário. Pequenos ajustes regulares evitam grandes problemas futuros."
      })
    } finally {
      setIsLoadingTip(false)
    }
  }

  // Gerar dica ao carregar a página
  useEffect(() => {
    if (!isTrialExpired()) {
      generateAiTip()
    }
  }, [])

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const obterCorProgressBar = (percentual: number) => {
    if (percentual >= 100) return 'bg-red-500'
    if (percentual >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const obterIconeStatus = (percentual: number) => {
    if (percentual >= 100) return '🚨'
    if (percentual >= 80) return '⚠️'
    return '✅'
  }

  const handleCreateCategory = () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    setShowNewCategoryModal(true)
  }

  const handleDefinirOrcamento = () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    setShowBudgetModal(true)
  }

  const handleDeleteBudget = async (budgetId: string, categoryName: string) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }

    if (confirm(`Tem certeza que deseja excluir o orçamento da categoria "${categoryName}"?`)) {
      try {
        await deleteBudget(budgetId)
      } catch (error) {
        console.error('Erro ao excluir orçamento:', error)
        alert('Erro ao excluir orçamento. Tente novamente.')
      }
    }
  }

  // Função para obter props do botão baseado no status
  const getButtonProps = () => {
    if (isTrialExpired()) {
      return {
        text: 'Trial Expirado - Renovar',
        className: 'bg-red-600 text-white hover:bg-red-700 animate-pulse',
        icon: AlertTriangle,
        title: 'Seu trial expirou. Clique para renovar.'
      }
    }
    
    return {
      text: 'Definir Orçamento',
      className: 'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
      icon: Plus,
      title: 'Definir novo orçamento'
    }
  }

  const buttonProps = getButtonProps()
  const ButtonIcon = buttonProps.icon

  const formatarMes = (mes: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return meses[mes - 1]
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 lg:space-y-6">
        {/* Header Mobile-First */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">🎯 Orçamento</h1>
            <p className="text-gray-600 text-sm lg:text-base mt-1">{formatarMes(mesAtual)} de {anoAtual}</p>
          </div>
          <button 
            onClick={handleDefinirOrcamento}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${buttonProps.className}`}
            title={buttonProps.title}
          >
            <ButtonIcon className="h-4 w-4" />
            <span>{buttonProps.text}</span>
          </button>
        </div>

        {/* Alert de trial expirado - Mobile-First */}
        {isTrialExpired() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-center flex-1">
                <div className="text-red-600 mr-3 flex-shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Trial de 30 dias expirado</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Seu trial completo acabou. Faça upgrade para continuar criando e gerenciando orçamentos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/planos'}
                className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors font-medium"
              >
                Renovar Agora
              </button>
            </div>
          </div>
        )}

        {/* Dica da IA - Mobile-First */}
        {!isTrialExpired() && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 lg:p-6">
            <div className="flex items-center space-x-3 mb-3 lg:mb-4">
              <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              <div className="flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900">🤖 Dica Financeira Personalizada</h3>
                <p className="text-xs lg:text-sm text-gray-600">
                  Baseada nos seus dados financeiros
                </p>
              </div>
              <button
                onClick={generateAiTip}
                disabled={isLoadingTip}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                title="Gerar nova dica"
              >
                {isLoadingTip ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {isLoadingTip ? (
              <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <p className="text-gray-600">Gerando dica personalizada...</p>
                </div>
              </div>
            ) : aiTip ? (
              <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm lg:text-lg">{aiTip.titulo}</h4>
                <p className="text-gray-700 leading-relaxed text-sm lg:text-base">{aiTip.descricao}</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <p className="text-gray-600 text-sm lg:text-base">Clique no ícone ✨ para gerar sua dica personalizada!</p>
              </div>
            )}
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              🤖 Dicas geradas por IA baseadas no seu perfil financeiro
            </div>
          </div>
        )}

        {/* Cards de Resumo - Mobile-First */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">🎯</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Orçamento Total</p>
                  <p className="text-lg lg:text-xl font-semibold text-blue-600">{formatarValor(totalOrcamento)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">💸</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Total Gasto</p>
                  <p className="text-lg lg:text-xl font-semibold text-red-600">{formatarValor(totalGasto)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">💰</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Restante</p>
                  <p className={`text-lg lg:text-xl font-semibold ${(totalOrcamento - totalGasto) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatarValor(totalOrcamento - totalGasto)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">📊</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">% Utilizado</p>
                  <p className={`text-lg lg:text-xl font-semibold ${percentualGeral >= 100 ? 'text-red-600' : percentualGeral >= 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {percentualGeral.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orçamentos por Categoria - Layout Responsivo */}
        {orcamentosAtuais.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 lg:p-6 border-b">
              <h3 className="text-lg font-semibold">Orçamentos - {formatarMes(mesAtual)} {anoAtual}</h3>
            </div>
            <div className="p-4 lg:p-6">
              <div className="space-y-4 lg:space-y-6">
                {orcamentosAtuais.map((orcamento) => {
                  const percentual = orcamento.limite > 0 ? (orcamento.gasto / orcamento.limite) * 100 : 0
                  const restante = orcamento.limite - orcamento.gasto

                  return (
                    <div key={orcamento.id} className="border rounded-lg p-3 lg:p-4">
                      {/* Mobile Layout */}
                      <div className="block lg:hidden">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="text-xl">{orcamento.categoriaIcon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{orcamento.categoria}</h4>
                              <p className="text-sm text-gray-600">
                                {formatarValor(orcamento.gasto)} de {formatarValor(orcamento.limite)}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteBudget(orcamento.id, orcamento.categoria)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTrialExpired() 
                                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                            title={isTrialExpired() ? 'Trial expirado' : 'Excluir orçamento'}
                            disabled={isTrialExpired()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <div className={`font-medium ${restante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {restante >= 0 ? 'Dentro do limite' : 'Excedeu limite'}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Usado:</span>
                            <div className="font-medium text-gray-900">
                              {percentual.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">{orcamento.categoriaIcon}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{orcamento.categoria}</h4>
                            <p className="text-sm text-gray-600">
                              {formatarValor(orcamento.gasto)} de {formatarValor(orcamento.limite)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right mr-4">
                            <p className={`font-semibold ${restante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {restante >= 0 ? 'Restam' : 'Excedeu'} {formatarValor(Math.abs(restante))}
                            </p>
                            <p className="text-sm text-gray-600">{percentual.toFixed(1)}% usado</p>
                          </div>
                          <button 
                            onClick={() => handleDeleteBudget(orcamento.id, orcamento.categoria)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTrialExpired() 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={isTrialExpired() ? 'Trial expirado' : 'Excluir orçamento'}
                            disabled={isTrialExpired()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${obterCorProgressBar(percentual)}`}
                          style={{ width: `${Math.min(percentual, 100)}%` }}
                        />
                      </div>

                      {/* Alert */}
                      {percentual >= 80 && (
                        <div className={`mt-2 p-2 rounded-md ${percentual >= 100 ? 'bg-red-50 text-red-800' : 'bg-yellow-50 text-yellow-800'}`}>
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {percentual >= 100 
                                ? 'Orçamento excedido!' 
                                : 'Atenção: orçamento quase no limite!'
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 lg:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl lg:text-4xl">🎯</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {categories.filter(c => c.type === 'expense').length === 0 
                  ? 'Nenhuma categoria de despesa cadastrada' 
                  : 'Nenhum orçamento definido para este mês'
                }
              </h3>
              <p className="text-gray-600 text-sm lg:text-base mb-4">
                {categories.filter(c => c.type === 'expense').length === 0 
                  ? 'Primeiro cadastre algumas categorias de despesas para poder definir orçamentos.'
                  : `Defina orçamentos para suas categorias em ${formatarMes(mesAtual)} de ${anoAtual}.`
                }
              </p>
              <button 
                onClick={categories.filter(c => c.type === 'expense').length === 0 ? handleCreateCategory : handleDefinirOrcamento}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isTrialExpired() ? 'Renovar para Criar' : 
                  categories.filter(c => c.type === 'expense').length === 0 ? 'Criar Primeira Categoria' : 'Definir Primeiro Orçamento'
                }
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        <NewCategoryModal
          isOpen={showNewCategoryModal}
          onClose={() => setShowNewCategoryModal(false)}
        />

        <BudgetModal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
        />
      </div>
    </ProtectedRoute>
  )
}