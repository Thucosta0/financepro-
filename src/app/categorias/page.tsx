'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, AlertTriangle, Eye, EyeOff, CheckCircle, Users, Sparkles, Target, DollarSign } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { NewCategoryModal } from '@/components/new-category-modal'
import { BudgetModal } from '@/components/budget-modal'
import type { Category } from '@/lib/supabase-client'
import { ProtectedRoute } from '@/components/protected-route'

export default function CategoriasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todas')
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategoryForBudget, setSelectedCategoryForBudget] = useState<Category | null>(null)
  const { categories, transactions, budgets, deleteCategory } = useFinancial()
  const { canPerformAction, isTrialExpired } = useSubscription()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Detectar se é uma conta nova (sem categorias)
  useEffect(() => {
    if (categories.length === 0 && !isTrialExpired()) {
      setShowOnboarding(true)
    }
  }, [categories, isTrialExpired])

  const categoriasFiltradas = categories.filter(categoria => {
    const matchNome = categoria.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filtroTipo === 'todas' || categoria.type === filtroTipo.replace('receita', 'income').replace('despesa', 'expense')
    return matchNome && matchTipo
  })

  const obterTotalCategoria = (categoriaId: string) => {
    const transacoesCategoria = transactions.filter(t => t.category_id === categoriaId)
    return transacoesCategoria.reduce((sum, t) => sum + t.amount, 0)
  }

  const obterOrcamentoCategoria = (categoriaId: string) => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    const orcamento = budgets.find(b => 
      b.category_id === categoriaId && 
      b.year === currentYear && 
      b.month === currentMonth &&
      b.period === 'monthly'
    )
    
    return orcamento ? orcamento.budget_limit : 0
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!canPerformAction('categories')) {
      alert('Trial expirado! Renove para continuar usando.')
      return
    }

    if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryId)
      } catch (error) {
        console.error('Erro ao excluir categoria:', error)
        alert('Erro ao excluir categoria. Verifique se não há transações vinculadas a ela.')
      }
    }
  }

  const handleEditCategory = (category: Category) => {
    if (!canPerformAction('categories')) {
      alert('Trial expirado! Renove para continuar usando.')
      return
    }
    setEditingCategory(category)
    setShowNewCategoryModal(true)
  }

  const handleCloseModal = () => {
    setShowNewCategoryModal(false)
    setEditingCategory(null)
  }

  const handleNewCategory = () => {
    if (!canPerformAction('categories')) {
      alert('Trial expirado! Renove para continuar usando.')
      return
    }
    setEditingCategory(null)
    setShowNewCategoryModal(true)
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Funcionalidade temporariamente removida
    alert('Funcionalidade de ativar/desativar em desenvolvimento')
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  const handleDefinirOrcamento = (category: Category) => {
    if (!canPerformAction('categories')) {
      alert('Trial expirado! Renove para continuar usando.')
      return
    }
    setSelectedCategoryForBudget(category)
    setShowBudgetModal(true)
  }

  const handleCloseBudgetModal = () => {
    setShowBudgetModal(false)
    setSelectedCategoryForBudget(null)
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Função para obter props do botão baseado no status
  const getButtonProps = () => {
    if (!canPerformAction('categories')) {
      return {
        text: 'Trial Expirado - Renovar',
        className: 'bg-red-600 text-white hover:bg-red-700 animate-pulse',
        icon: AlertTriangle,
        title: 'Seu trial expirou. Clique para renovar.'
      }
    }
    
    return {
      text: 'Nova Categoria',
      className: 'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
      icon: Plus,
      title: 'Criar nova categoria'
    }
  }

  const buttonProps = getButtonProps()
  const ButtonIcon = buttonProps.icon

  return (
    <ProtectedRoute>
      <div className="space-y-4 lg:space-y-6">
        {/* Header Mobile-First */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">📂 Categorias</h1>
          <button 
            onClick={handleNewCategory}
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
                    Renove sua assinatura para continuar gerenciando suas categorias.
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

        {/* Filtros Mobile-First */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todas">Todas</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>
        </div>

        {/* Cards de Estatísticas - Mobile-First */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📊</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Total Categorias</p>
                  <p className="text-lg lg:text-xl font-semibold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">💰</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Categorias Receita</p>
                  <p className="text-lg lg:text-xl font-semibold text-green-600">
                    {categories.filter(c => c.type === 'income').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">💸</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Categorias Despesa</p>
                  <p className="text-lg lg:text-xl font-semibold text-red-600">
                    {categories.filter(c => c.type === 'expense').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado vazio para usuários sem categorias */}
        {categories.length === 0 && !showOnboarding && (
          <div className="text-center py-12 lg:py-16">
            <div className="max-w-md mx-auto px-4">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 lg:w-12 lg:h-12 text-blue-600" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3">
                🎯 Pronto para começar?
              </h3>
              <p className="text-gray-600 mb-6 text-sm lg:text-base">
                Crie suas primeiras categorias para organizar suas finanças. 
                Você pode começar com sugestões ou criar do zero.
              </p>
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 justify-center">
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Ver Sugestões</span>
                </button>
                <button
                  onClick={() => setShowNewCategoryModal(true)}
                  disabled={!canPerformAction('categories')}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar do Zero</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid de Categorias - Layout Responsivo */}
        {categoriasFiltradas.length > 0 ? (
          <div className="space-y-4">
            {/* Layout Mobile */}
            <div className="block lg:hidden space-y-3">
              {categoriasFiltradas.map((categoria) => {
                const total = obterTotalCategoria(categoria.id)
                const orcamento = obterOrcamentoCategoria(categoria.id)
                const porcentagemUsada = orcamento > 0 ? (total / orcamento) * 100 : 0
                const hasOrcamento = orcamento > 0
                
                return (
                  <div key={categoria.id} className="bg-white rounded-lg shadow-sm border p-4">
                    {/* Header do Card Mobile */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="text-2xl">{categoria.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{categoria.name}</h3>
                          <p className="text-xs text-gray-600 capitalize">
                            {categoria.type === 'income' ? '💰 Receita' : '💸 Despesa'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Valor principal mobile */}
                      <div className="text-right">
                        <div className={`font-semibold ${
                          categoria.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatarValor(total)}
                        </div>
                        {hasOrcamento && (
                          <div className="text-xs text-gray-500">
                            de {formatarValor(orcamento)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informações secundárias mobile */}
                    {hasOrcamento && (
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Restante:</span>
                          <div className={`font-medium ${orcamento - total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarValor(orcamento - total)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Usado:</span>
                          <div className="font-medium text-gray-900">
                            {Math.round(porcentagemUsada)}%
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Barra de progresso mobile */}
                    {hasOrcamento && (
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              porcentagemUsada > 100 
                                ? 'bg-red-500' 
                                : porcentagemUsada > 80 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(porcentagemUsada, 100)}%` }}
                          />
                        </div>
                        {porcentagemUsada > 100 && (
                          <div className="text-xs text-red-500 font-medium mt-1">
                            {Math.round(porcentagemUsada - 100)}% acima do orçamento
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botões de ação mobile */}
                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => handleDefinirOrcamento(categoria)}
                        className={`flex-1 p-3 rounded-lg transition-colors text-center ${
                          !canPerformAction('categories') 
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                            : hasOrcamento 
                              ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                              : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                        title={!canPerformAction('categories') ? 'Trial expirado' : hasOrcamento ? 'Editar orçamento' : 'Definir orçamento'}
                        disabled={!canPerformAction('categories')}
                      >
                        <Target className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs font-medium">
                          {hasOrcamento ? 'Orçamento' : 'Definir'}
                        </span>
                      </button>
                      <button 
                        onClick={() => handleEditCategory(categoria)}
                        className={`flex-1 p-3 rounded-lg transition-colors text-center ${
                          !canPerformAction('categories') 
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                        title={!canPerformAction('categories') ? 'Trial expirado' : 'Editar categoria'}
                        disabled={!canPerformAction('categories')}
                      >
                        <Edit2 className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs font-medium">Editar</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(categoria.id, categoria.name)}
                        className={`flex-1 p-3 rounded-lg transition-colors text-center ${
                          !canPerformAction('categories') 
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                            : 'text-red-600 bg-red-50 hover:bg-red-100'
                        }`}
                        title={!canPerformAction('categories') ? 'Trial expirado' : 'Excluir categoria'}
                        disabled={!canPerformAction('categories')}
                      >
                        <Trash2 className="h-4 w-4 mx-auto mb-1" />
                        <span className="text-xs font-medium">Excluir</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Layout Desktop */}
            <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {categoriasFiltradas.map((categoria) => {
                const total = obterTotalCategoria(categoria.id)
                const orcamento = obterOrcamentoCategoria(categoria.id)
                const porcentagemUsada = orcamento > 0 ? (total / orcamento) * 100 : 0
                const hasOrcamento = orcamento > 0
                
                return (
                  <div key={categoria.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{categoria.icon}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{categoria.name}</h3>
                          <p className="text-sm text-gray-600 capitalize">{categoria.type === 'income' ? 'Receita' : 'Despesa'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDefinirOrcamento(categoria)}
                          className={`p-2 rounded-lg transition-colors ${
                            !canPerformAction('categories') 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : hasOrcamento 
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={!canPerformAction('categories') ? 'Trial expirado' : hasOrcamento ? 'Editar orçamento' : 'Definir orçamento'}
                          disabled={!canPerformAction('categories')}
                        >
                          <Target className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditCategory(categoria)}
                          className={`p-2 rounded-lg transition-colors ${
                            !canPerformAction('categories') 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={!canPerformAction('categories') ? 'Trial expirado' : 'Editar categoria'}
                          disabled={!canPerformAction('categories')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(categoria.id, categoria.name)}
                          className={`p-2 rounded-lg transition-colors ${
                            !canPerformAction('categories') 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={!canPerformAction('categories') ? 'Trial expirado' : 'Excluir categoria'}
                          disabled={!canPerformAction('categories')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      {/* Orçamento definido */}
                      {hasOrcamento && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Orçamento</span>
                          <span className="font-medium text-blue-600">
                            {formatarValor(orcamento)}
                          </span>
                        </div>
                      )}
                      
                      {/* Total usado */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {hasOrcamento ? 'Gasto' : 'Total Usado'}
                        </span>
                        <span className={`font-medium ${
                          hasOrcamento 
                            ? porcentagemUsada > 100 ? 'text-red-600' : 'text-gray-900'
                            : categoria.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatarValor(total)}
                        </span>
                      </div>

                      {/* Saldo restante (apenas se tem orçamento) */}
                      {hasOrcamento && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Restante</span>
                          <span className={`font-medium ${orcamento - total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatarValor(orcamento - total)}
                          </span>
                        </div>
                      )}
                      
                      {/* Barra de progresso */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>
                            {hasOrcamento ? `${Math.round(porcentagemUsada)}% usado` : 'Sem orçamento'}
                          </span>
                          {hasOrcamento && porcentagemUsada > 100 && (
                            <span className="text-red-500 font-medium">
                              {Math.round(porcentagemUsada - 100)}% acima
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              hasOrcamento
                                ? porcentagemUsada > 100 
                                  ? 'bg-red-500' 
                                  : porcentagemUsada > 80 
                                    ? 'bg-yellow-500' 
                                    : 'bg-green-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ 
                              width: hasOrcamento 
                                ? `${Math.min(porcentagemUsada, 100)}%` 
                                : '100%' 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : searchTerm || filtroTipo !== 'todas' ? (
          // Estado vazio para pesquisa sem resultados
          <div className="text-center py-12">
            <div className="max-w-md mx-auto px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-gray-600 text-sm">
                Tente ajustar os filtros ou criar uma nova categoria.
              </p>
            </div>
          </div>
        ) : null}

        {/* Onboarding Wizard */}
        {showOnboarding && (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        )}

        {/* Modals */}
        <NewCategoryModal 
          isOpen={showNewCategoryModal} 
          onClose={handleCloseModal}
          editingCategory={editingCategory}
        />

        <BudgetModal
          isOpen={showBudgetModal}
          onClose={handleCloseBudgetModal}
          selectedCategory={selectedCategoryForBudget}
        />
      </div>
    </ProtectedRoute>
  )
}