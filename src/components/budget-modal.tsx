'use client'

import { useState, useEffect } from 'react'
import { X, Target, Calendar, DollarSign } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import type { Category } from '@/lib/supabase-client'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCategory?: Category | null
}

export function BudgetModal({ isOpen, onClose, selectedCategory }: BudgetModalProps) {
  const { categories, budgets, addBudget, updateBudget } = useFinancial()
  const { isTrialExpired } = useSubscription()
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar trial expirado ao abrir modal
  useEffect(() => {
    if (isOpen && isTrialExpired()) {
      onClose()
      window.location.href = '/planos'
      return
    }
  }, [isOpen, isTrialExpired, onClose])

  // Reset form quando modal abre e pré-seleciona categoria se fornecida
  useEffect(() => {
    if (isOpen) {
      setFormData({
        category_id: selectedCategory?.id || '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      })
    }
  }, [isOpen, selectedCategory])

  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Verificar se já existe orçamento para categoria/mês/ano
  const existingBudget = budgets.find(b => 
    b.category_id === formData.category_id && 
    b.month === formData.month && 
    b.year === formData.year
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }

    if (!formData.category_id || !formData.amount) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const amount = parseFloat(formData.amount)
    if (amount <= 0) {
      alert('O valor do orçamento deve ser maior que zero.')
      return
    }

    setIsSubmitting(true)

    try {
      const budgetData = {
        category_id: formData.category_id,
        budget_limit: amount,
        period: 'monthly' as const,
        month: formData.month,
        year: formData.year
      }

      if (existingBudget) {
        // Atualizar orçamento existente
        await updateBudget(existingBudget.id, budgetData)
      } else {
        // Criar novo orçamento
        await addBudget(budgetData)
      }

      onClose()
    } catch (error) {
      alert('Erro ao salvar orçamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatarMes = (mes: number) => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return meses[mes - 1]
  }

  const foundCategory = categories.find(c => c.id === formData.category_id)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white lg:rounded-lg shadow-lg max-w-md w-full m-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white lg:rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold">
              {existingBudget ? 'Editar Orçamento' : 'Definir Orçamento'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 touch-manipulation"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria de Despesa *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="">Selecione uma categoria</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {expenseCategories.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Você precisa criar categorias de despesa primeiro
                </p>
              )}
            </div>

            {/* Mês e Ano */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {formatarMes(month)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano *
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isSubmitting}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Valor do Orçamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Orçamento *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Quanto você planeja gastar nesta categoria no mês selecionado
              </p>
            </div>

            {/* Preview */}
            {foundCategory && formData.amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xl">{foundCategory.icon}</span>
                  <div>
                    <h4 className="font-medium text-blue-900">Preview do Orçamento</h4>
                    <p className="text-sm text-blue-700">
                      {foundCategory.name} • {formatarMes(formData.month)} de {formData.year}
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(parseFloat(formData.amount) || 0)}
                </div>
                {existingBudget && (
                  <p className="text-xs text-amber-700 mt-2">
                    ⚠️ Já existe um orçamento para esta categoria/período. Ele será atualizado.
                  </p>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 lg:bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.category_id || !formData.amount}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : (
              existingBudget ? 'Atualizar Orçamento' : 'Criar Orçamento'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}