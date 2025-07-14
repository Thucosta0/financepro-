'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, X, AlertTriangle } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import { ProtectedRoute } from '@/components/protected-route'

export default function CartoesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const { cards, updateCard, deleteCard, transactions } = useFinancial()
  const { canPerformAction, isTrialExpired } = useSubscription()

  const getCardSummary = (cardId: string) => {
    const cardTransactions = transactions.filter(t => t.card_id === cardId)
    const total = cardTransactions.reduce((sum, t) => {
      return t.type === 'expense' ? sum + t.amount : sum - t.amount
    }, 0)
    return { total, transactions: cardTransactions.length }
  }

  const cartoesFiltrados = cards.filter(cartao => {
    const matchNome = cartao.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchBanco = cartao.bank.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filtroTipo === 'todos' || cartao.type === filtroTipo
    return (matchNome || matchBanco) && matchTipo
  })

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getCardTypeLabel = (type: string) => {
    const types = {
      credit: 'Crédito',
      debit: 'Débito',
      cash: 'Dinheiro'
    }
    return types[type as keyof typeof types] || type
  }

  const getCardIcon = (type: string) => {
    const icons = {
      credit: '💳',
      debit: '💰',
      cash: '💵'
    }
    return icons[type as keyof typeof icons] || '💳'
  }

  const handleNewCard = () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    setShowModal(true)
  }

  const handleEditCard = (cardId: string) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    setEditingCard(cardId)
  }

  const handleDeleteCard = (cardId: string) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    deleteCard(cardId)
  }

  const handleUpdateCard = (cardId: string, updates: any) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    updateCard(cardId, updates)
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
      text: 'Novo Cartão',
      className: 'bg-blue-600 text-white hover:bg-blue-700 transition-colors',
      icon: Plus,
      title: 'Criar novo cartão'
    }
  }

  const buttonProps = getButtonProps()
  const ButtonIcon = buttonProps.icon

  return (
    <ProtectedRoute>
      <div className="space-y-4 lg:space-y-6">
        {/* Header Mobile-First */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">💳 Cartões</h1>
          <button 
            onClick={handleNewCard}
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
                    Seu trial completo acabou. Faça upgrade para continuar criando e gerenciando cartões.
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
                placeholder="Buscar por nome ou banco..."
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
              <option value="todos">Todos os tipos</option>
              <option value="credit">Crédito</option>
              <option value="debit">Débito</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>
        </div>

        {/* Cards de Estatísticas - Mobile-First */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">💳</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Total de Cartões</p>
                  <p className="text-lg lg:text-xl font-semibold text-gray-900">{cards.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">✅</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Cartões Ativos</p>
                  <p className="text-lg lg:text-xl font-semibold text-green-600">
                    {cards.filter(c => c.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">💰</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Cartões Crédito</p>
                  <p className="text-lg lg:text-xl font-semibold text-purple-600">
                    {cards.filter(c => c.type === 'credit').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-3 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-xl lg:text-2xl mr-2 lg:mr-3">🏦</div>
                <div>
                  <p className="text-xs lg:text-sm text-gray-600">Bancos Diferentes</p>
                  <p className="text-lg lg:text-xl font-semibold text-orange-600">
                    {[...new Set(cards.map(c => c.bank))].length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Cartões - Layout Responsivo */}
        {cartoesFiltrados.length > 0 ? (
          <div className="space-y-4">
            {/* Layout Mobile */}
            <div className="block lg:hidden space-y-3">
              {cartoesFiltrados.map((cartao) => {
                const { total, transactions } = getCardSummary(cartao.id)
                return (
                  <div key={cartao.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* Header do cartão mobile */}
                    <div 
                      className="h-24 p-3 text-white relative"
                      style={{ backgroundColor: cartao.color }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="text-lg">{getCardIcon(cartao.type)}</div>
                            <h3 className="font-semibold text-sm">{cartao.name}</h3>
                          </div>
                          <p className="text-xs opacity-90">{cartao.bank}</p>
                          {cartao.last_digits && (
                            <p className="text-xs opacity-75">**** {cartao.last_digits}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateCard(cartao.id, { is_active: !cartao.is_active })}
                            className={`p-1 rounded ${
                              isTrialExpired() 
                                ? 'bg-white/10 cursor-not-allowed' 
                                : cartao.is_active ? 'bg-white/20' : 'bg-red-500/20'
                            }`}
                            disabled={isTrialExpired()}
                            title={isTrialExpired() ? 'Trial expirado' : (cartao.is_active ? 'Desativar' : 'Ativar')}
                          >
                            {cartao.is_active ? 
                              <Eye className="h-3 w-3" /> : 
                              <EyeOff className="h-3 w-3" />
                            }
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-3">
                        <span className="text-xs opacity-75 uppercase font-medium">
                          {getCardTypeLabel(cartao.type)}
                        </span>
                      </div>
                    </div>

                    {/* Body do cartão mobile */}
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        {cartao.card_limit && (
                          <div>
                            <span className="text-gray-600">Limite:</span>
                            <div className="font-medium">{formatarValor(cartao.card_limit)}</div>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-600">Gasto:</span>
                          <div className={`font-medium ${total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatarValor(total)}
                          </div>
                        </div>
                      </div>

                      {cartao.card_limit && total > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Limite usado:</span>
                            <span>{((total / cartao.card_limit) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (total / cartao.card_limit) * 100 > 80 ? 'bg-red-500' : 
                                (total / cartao.card_limit) * 100 > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((total / cartao.card_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Ações mobile */}
                      <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          cartao.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cartao.is_active ? 'Ativo' : 'Inativo'}
                        </div>
                        <div className="flex items-center space-x-2 ml-auto">
                          <button 
                            onClick={() => handleEditCard(cartao.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTrialExpired() 
                                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                                : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                            }`}
                            disabled={isTrialExpired()}
                            title={isTrialExpired() ? 'Trial expirado' : 'Editar cartão'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCard(cartao.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTrialExpired() 
                                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                                : 'text-red-600 bg-red-50 hover:bg-red-100'
                            }`}
                            disabled={isTrialExpired()}
                            title={isTrialExpired() ? 'Trial expirado' : 'Excluir cartão'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Layout Desktop */}
            <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cartoesFiltrados.map((cartao) => {
                const { total, transactions } = getCardSummary(cartao.id)
                return (
                  <div key={cartao.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    {/* Header do cartão */}
                    <div 
                      className="h-32 p-4 text-white relative"
                      style={{ backgroundColor: cartao.color }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-2xl mb-2">{getCardIcon(cartao.type)}</div>
                          <h3 className="font-semibold text-lg">{cartao.name}</h3>
                          <p className="text-sm opacity-90">{cartao.bank}</p>
                          {cartao.last_digits && (
                            <p className="text-xs opacity-75">**** {cartao.last_digits}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateCard(cartao.id, { is_active: !cartao.is_active })}
                            className={`p-1 rounded ${
                              isTrialExpired() 
                                ? 'bg-white/10 cursor-not-allowed' 
                                : cartao.is_active ? 'bg-white/20' : 'bg-red-500/20'
                            }`}
                            disabled={isTrialExpired()}
                            title={isTrialExpired() ? 'Trial expirado' : (cartao.is_active ? 'Desativar' : 'Ativar')}
                          >
                            {cartao.is_active ? 
                              <Eye className="h-4 w-4" /> : 
                              <EyeOff className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <span className="text-xs opacity-75 uppercase font-medium">
                          {getCardTypeLabel(cartao.type)}
                        </span>
                      </div>
                    </div>

                    {/* Body do cartão */}
                    <div className="p-4">
                      <div className="space-y-3">
                        {cartao.card_limit && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Limite:</span>
                            <span className="font-medium">{formatarValor(cartao.card_limit)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Gasto Total:</span>
                          <span className={`font-medium ${total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatarValor(total)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Transações:</span>
                          <span className="font-medium">{transactions}</span>
                        </div>
                        {cartao.card_limit && total > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Limite usado:</span>
                              <span>{((total / cartao.card_limit) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  (total / cartao.card_limit) * 100 > 80 ? 'bg-red-500' : 
                                  (total / cartao.card_limit) * 100 > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min((total / cartao.card_limit) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          cartao.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cartao.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditCard(cartao.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTrialExpired() 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            disabled={isTrialExpired()}
                            title={isTrialExpired() ? 'Trial expirado' : 'Editar cartão'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCard(cartao.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              isTrialExpired() 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            disabled={isTrialExpired()}
                            title={isTrialExpired() ? 'Trial expirado' : 'Excluir cartão'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-8 lg:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl lg:text-4xl">💳</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cartão encontrado</h3>
              <p className="text-gray-600 text-sm lg:text-base mb-4">
                {cards.length === 0 
                  ? 'Comece adicionando seus cartões e contas para organizar suas transações.' 
                  : 'Tente ajustar os filtros para encontrar o cartão desejado.'
                }
              </p>
              <button 
                onClick={handleNewCard}
                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isTrialExpired() ? 'Renovar para Criar' : '+ Novo Cartão'}
              </button>
            </div>
          </div>
        )}

        {/* Modal de Novo/Editar Cartão */}
        <CardModal 
          isOpen={showModal || editingCard !== null} 
          onClose={() => {
            setShowModal(false)
            setEditingCard(null)
          }}
          cardId={editingCard}
        />
      </div>
    </ProtectedRoute>
  )
}

// Componente Modal para adicionar/editar cartão
function CardModal({ isOpen, onClose, cardId }: { 
  isOpen: boolean; 
  onClose: () => void; 
  cardId?: string | null;
}) {
  const { cards, addCard, updateCard } = useFinancial()
  const { isTrialExpired } = useSubscription()
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit' as 'credit' | 'debit' | 'cash',
    bank: '',
    card_limit: '',
    color: '#3b82f6',
    last_digits: '',
    is_active: true
  })

  // Se estiver editando, carrega os dados do cartão
  const editingCard = cardId ? cards.find(c => c.id === cardId) : null
  if (editingCard && formData.name === '') {
    setFormData({
      name: editingCard.name,
      type: editingCard.type,
      bank: editingCard.bank,
      card_limit: editingCard.card_limit?.toString() || '',
      color: editingCard.color,
      last_digits: editingCard.last_digits || '',
      is_active: editingCard.is_active
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    
    const cardData = {
      name: formData.name,
      type: formData.type,
      bank: formData.bank,
      card_limit: formData.card_limit ? parseFloat(formData.card_limit) : undefined,
      color: formData.color,
      last_digits: formData.last_digits,
      is_active: formData.is_active
    }

    if (cardId) {
      updateCard(cardId, cardData)
    } else {
      addCard(cardData)
    }

    setFormData({
      name: '',
      type: 'credit',
      bank: '',
      card_limit: '',
      color: '#3b82f6',
      last_digits: '',
      is_active: true
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white lg:rounded-lg shadow-lg max-w-md w-full m-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-600 to-amber-600 text-white lg:rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">💳</span>
            </div>
            <h3 className="text-lg font-semibold">
              {cardId ? 'Editar Cartão' : 'Novo Cartão'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-orange-100 hover:text-white p-2 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-100 hover:scrollbar-thumb-orange-500">
          <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Cartão
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: Cartão Principal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as 'credit' | 'debit' | 'cash'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="credit">Crédito</option>
              <option value="debit">Débito</option>
              <option value="cash">Dinheiro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <input
              type="text"
              required
              value={formData.bank}
              onChange={(e) => setFormData({...formData, bank: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: Banco do Brasil"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Últimos 4 dígitos
            </label>
            <input
              type="text"
              maxLength={4}
              pattern="[0-9]{4}"
              value={formData.last_digits}
              onChange={(e) => setFormData({...formData, last_digits: e.target.value.replace(/\D/g, '')})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="1234"
            />
            <p className="text-xs text-gray-500 mt-1">
              Os últimos 4 dígitos do cartão (apenas números)
            </p>
          </div>

          {formData.type === 'credit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limite (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.card_limit}
                onChange={(e) => setFormData({...formData, card_limit: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor do Cartão
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{formData.color}</span>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Cartão ativo
            </label>
          </div>

            {/* Espaçamento extra para melhor scroll no mobile */}
            <div className="pb-4"></div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 lg:bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700"
          >
            {cardId ? 'Atualizar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
