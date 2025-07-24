'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import type { Transaction } from '@/lib/supabase-client'

interface EditTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

export function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { updateTransaction, categories, cards, refreshTransactions } = useFinancial()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    card_id: '',
    transaction_date: '',
    due_date: '',
    notes: ''
  })

  // Carregar dados da transação quando o modal abrir
  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category_id: transaction.category_id,
        card_id: transaction.card_id || '',
        transaction_date: transaction.transaction_date,
        due_date: transaction.due_date || '',
        notes: transaction.notes || ''
      })
    }
  }, [isOpen, transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    setIsLoading(true)
    try {
      // Enviar apenas os campos modificáveis da tabela transactions
      const updatedTransaction = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        category_id: formData.category_id,
        card_id: formData.card_id || undefined,
        transaction_date: formData.transaction_date,
        due_date: formData.due_date || undefined,
        notes: formData.notes.trim() || undefined,
  
        
        is_completed: transaction.is_completed // Manter valor original
      }

      await updateTransaction(transaction.id, updatedTransaction)
      
      // Atualizar a lista de transações
      await refreshTransactions()
      
      onClose()
    } catch (error) {
      alert('Erro ao atualizar transação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const categoriesFiltradas = categories.filter(cat => cat.type === formData.type)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black bg-opacity-50">
      <style jsx>{`
        select option {
          padding: 12px 16px !important;
          font-size: 16px !important;
          line-height: 1.5 !important;
          min-height: 44px !important;
        }
        
        @media (max-width: 768px) {
          select {
            font-size: 16px !important;
            line-height: 1.5 !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          
          select option {
            padding: 16px !important;
            font-size: 16px !important;
            line-height: 1.6 !important;
            min-height: 50px !important;
          }
        }
      `}</style>
      <div className="bg-white w-full h-full lg:h-auto lg:max-h-[85vh] lg:rounded-lg shadow-lg lg:max-w-md lg:w-full lg:m-4 flex flex-col">
        {/* Header fixo */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white lg:rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">✏️</span>
            </div>
            <h3 className="text-lg lg:text-xl font-semibold">Editar Transação</h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário com scroll */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Ex: Compra no supermercado"
                required
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="0,00"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  type: e.target.value as 'income' | 'expense',
                  category_id: '' // Limpar categoria quando mudar o tipo
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
                required
              >
                <option value="expense" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>💸 Despesa</option>
                <option value="income" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>💰 Receita</option>
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
                required
              >
                <option value="" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>Selecione uma categoria</option>
                {categoriesFiltradas.map(category => (
                  <option key={category.id} value={category.id} style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cartão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cartão/Conta
                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              </label>
              <select
                value={formData.card_id}
                onChange={(e) => setFormData({ ...formData, card_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              >
                <option value="" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>Selecione um cartão</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id} style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>
                    {card.name} {card.last_digits ? `(**** ${card.last_digits})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Data da Transação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Transação *
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data de Vencimento
                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                min={formData.transaction_date}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'expense' ? 'Quando esta conta deve ser paga' : 'Quando esta receita deve ser recebida'}
              </p>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            {/* Espaçamento extra para melhor scroll no mobile */}
            <div className="pb-4"></div>
          </form>
        </div>

        {/* Footer com botões fixos */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-4 lg:p-6 border-t bg-gray-50 lg:bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium touch-manipulation"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}