'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'

interface NewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
  const { categories, cards, addTransaction, refreshTransactions } = useFinancial()
  const { canPerformAction, isTrialExpired } = useSubscription()
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '', // Valor total da transação
    amount: '',      // Valor por parcela
    type: 'expense' as 'income' | 'expense',
    category: '',
    card: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    format: '' as '' | 'unica' | 'parcelada' | 'recorrente_fixa' | 'recorrente_variavel',
    startDate: '',
    endDate: '',
    installments: 0,
    notes: ''
  })

  const activeCards = cards.filter(card => card.is_active)
  const filteredCategories = categories.filter(cat => cat.type === formData.type)

  // Função para calcular parcelas
  const calcularParcelas = (dataInicio: string, dataFim: string): number => {
    if (!dataInicio || !dataFim) return 0;

    const inicioDate = new Date(dataInicio);
    const fimDate = new Date(dataFim);

    // Verificar se as datas são válidas
    if (isNaN(inicioDate.getTime()) || isNaN(fimDate.getTime())) return 0;

    if (fimDate < inicioDate) return -1; // data fim antes da inicio (inválido)

    const yearsDiff = fimDate.getFullYear() - inicioDate.getFullYear();
    const monthsDiff = fimDate.getMonth() - inicioDate.getMonth();

    // +1 para contar o mês inicial também como parcela
    return yearsDiff * 12 + monthsDiff + 1;
  }

  // Efeito para atualizar parcelas quando datas mudam
  useEffect(() => {
    if (formData.format === 'parcelada' && formData.startDate && formData.endDate) {
      const numParcelas = calcularParcelas(formData.startDate, formData.endDate);
      if (numParcelas === -1) {
        setFormData(prev => ({ ...prev, installments: 0 }));
        // Removido alert daqui - validação será feita apenas no submit
      } else {
        setFormData(prev => ({ ...prev, installments: numParcelas }));
      }
    } else if (formData.format !== 'parcelada') {
      // Limpar campos de parcelamento quando formato não for parcelado
      setFormData(prev => ({ ...prev, installments: 0 }));
    }
  }, [formData.startDate, formData.endDate, formData.format]);

  // Efeito para calcular valor total automaticamente
  useEffect(() => {
    if (formData.format === 'parcelada' && formData.amount && formData.installments > 0) {
      const valorPorParcela = parseFloat(formData.amount);
      if (!isNaN(valorPorParcela) && valorPorParcela > 0) {
        const valorTotal = valorPorParcela * formData.installments;
        setFormData(prev => ({ ...prev, totalAmount: valorTotal.toFixed(2) }));
      }
    } else if (formData.format !== 'parcelada') {
      // Para transações não parceladas, valor total = valor por parcela
      setFormData(prev => ({ ...prev, totalAmount: prev.amount }));
    }
  }, [formData.amount, formData.installments, formData.format]);

  // Verificar trial expirado quando o modal abrir
  useEffect(() => {
    if (isOpen && isTrialExpired()) {
      onClose()
      window.location.href = '/planos'
    }
  }, [isOpen, isTrialExpired, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar novamente se o trial expirou antes de submeter
    if (isTrialExpired()) {
      onClose()
      window.location.href = '/planos'
      return
    }
    
    // Verificar se pode executar a ação
    if (!canPerformAction('transactions')) {
      alert('Você não tem permissão para criar transações.')
      return
    }
    
    // Validação para transações parceladas
    if (formData.format === 'parcelada') {
      if (!formData.description || !formData.amount || !formData.category || !formData.format) {
        alert('Por favor, preencha todos os campos obrigatórios.')
        return
      }

      if (!formData.startDate || !formData.endDate) {
        alert('Por favor, preencha as datas de início e término das parcelas.')
        return
      }
      
      const numParcelas = calcularParcelas(formData.startDate, formData.endDate);
      if (numParcelas === -1) {
        alert('A Data de Término das Parcelas não pode ser anterior à Data de Início.')
        return
      }
      if (numParcelas <= 0) {
        alert('Por favor, preencha datas válidas para início e término das parcelas.')
        return
      }

      const valorPorParcela = parseFloat(formData.amount);
      if (valorPorParcela <= 0) {
        alert('O valor da parcela deve ser maior que zero para transações parceladas.')
        return
      }
    } else {
      // Validação para transações não parceladas
      if (!formData.description || !formData.amount || !formData.category || !formData.format) {
        alert('Por favor, preencha todos os campos obrigatórios.')
        return
      }
    }

    const transactionData = {
      description: formData.description,
      amount: formData.format === 'parcelada' ? parseFloat(formData.totalAmount) : parseFloat(formData.amount), // Usar valor total para parceladas, valor unitário para outras
      type: formData.type,
      category_id: formData.category,
      card_id: formData.card || undefined,
      transaction_date: formData.date,
      due_date: formData.dueDate || undefined,
      format: formData.format,
      start_date: formData.startDate || undefined,
      end_date: formData.endDate || undefined,
      installments: formData.installments > 0 ? formData.installments : undefined,
      notes: formData.notes || undefined
    }

    try {
      await addTransaction(transactionData)
      
      // Atualizar a lista de transações
      await refreshTransactions()
      
      // Reset form apenas após sucesso
      setFormData({
        description: '',
        totalAmount: '',
        amount: '',
        type: 'expense',
        category: '',
        card: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        format: '',
        startDate: '',
        endDate: '',
        installments: 0,
        notes: ''
      })

      onClose()
    } catch (error) {
      alert('Erro ao adicionar transação. Tente novamente.')
    }
  }

  const formatCardName = (card: any) => {
    return `${card.name} ${card.last_digits ? `(**** ${card.last_digits})` : ''} - ${card.bank}`
  }

  if (!isOpen) return null

  // Se trial expirou, mostrar modal de bloqueio
  if (isTrialExpired()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full m-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Nova Transação</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-xl font-bold text-red-800 mb-2">Trial Expirado</h4>
            <p className="text-gray-600 mb-6">
              Seu trial de 30 dias expirou. Faça upgrade para continuar criando transações.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  onClose()
                  window.location.href = '/planos'
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Fazer Upgrade Agora
              </button>
              <button 
                onClick={onClose}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
        <div className="flex items-center justify-between p-4 lg:p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white lg:rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">+</span>
            </div>
            <h3 className="text-lg lg:text-xl font-semibold">Nova Transação</h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white p-2 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 hover:scrollbar-thumb-blue-500">
          <div className="p-4 lg:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                placeholder="Ex: Supermercado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    type: e.target.value as 'income' | 'expense',
                    category: '' // Reset categoria quando muda o tipo
                  })
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              >
                <option value="expense" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>💸 Despesa</option>
                <option value="income" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>💰 Receita</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato da Transação *
              </label>
              <select
                value={formData.format}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    format: e.target.value as '' | 'unica' | 'parcelada' | 'recorrente_fixa' | 'recorrente_variavel',
                    startDate: '',
                    endDate: '',
                    installments: 0
                  })
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
                required
              >
                <option value="" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>Selecione</option>
                <option value="unica" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>💳 Única (à vista)</option>
                <option value="parcelada" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>📅 Parcelada</option>
                <option value="recorrente_fixa" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>🔄 Recorrente com valor fixo</option>
                <option value="recorrente_variavel" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>🔄 Recorrente com valor variável</option>
              </select>
                              {formData.format && formData.format !== 'parcelada' && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600">
                      {formData.format === 'unica' && '💳 Transação única realizada na data especificada'}
                      {formData.format === 'recorrente_fixa' && '🔄 Transação que se repete com valor fixo'}
                      {formData.format === 'recorrente_variavel' && '🔄 Transação que se repete com valor variável'}
                    </p>
                  </div>
                )}
                
                {formData.format === 'parcelada' && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <div className="text-blue-600 mt-0.5">💡</div>
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">Como funciona o parcelamento:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• O sistema criará uma transação para cada parcela</li>
                          <li>• Cada parcela aparecerá com 1/6, 2/6, 3/6, etc.</li>
                          <li>• Você pode filtrar por mês de vencimento no dashboard</li>
                          <li>• Todas as parcelas podem ser marcadas individualmente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {formData.format === 'parcelada' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-blue-800">Configuração de Parcelamento</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início das Parcelas *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Término das Parcelas *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    value={formData.installments}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-base touch-manipulation"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⏰ Calculado automaticamente com base nas datas
                  </p>
                </div>
              </div>
            )}

            {/* Valor por Parcela */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.format === 'parcelada' ? 'Valor por Parcela *' : 'Valor *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                placeholder="0,00"
              />
            </div>

            {/* Valor Total - Apenas para transações parceladas */}
            {formData.format === 'parcelada' && formData.installments > 0 && formData.totalAmount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalAmount}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-base touch-manipulation"
                />
                <p className="text-xs text-blue-600 mt-1">
                  💡 Calculado automaticamente: R$ {formData.amount} × {formData.installments} parcelas
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
                required
              >
                <option value="" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>Selecione uma categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id} style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              {filteredCategories.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  Nenhuma categoria de {formData.type === 'income' ? 'receita' : 'despesa'} cadastrada
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cartão/Conta
                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              </label>
              <select
                value={formData.card}
                onChange={(e) => setFormData({...formData, card: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation appearance-none bg-white"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
              >
                <option value="" style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>Selecione um cartão</option>
                {activeCards.map((card) => (
                  <option key={card.id} value={card.id} style={{ fontSize: '16px', padding: '12px 16px', lineHeight: '1.5' }}>
                    {formatCardName(card)}
                  </option>
                ))}
              </select>
              {activeCards.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  💡 Nenhum cartão cadastrado - você pode criar um na página de Cartões
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data da Transação *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Data de Vencimento
                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation"
                min={formData.date}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'expense' ? 'Quando esta conta deve ser paga' : 'Quando esta receita deve ser recebida'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Observações
                <span className="text-xs text-gray-500 ml-1">(opcional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base touch-manipulation resize-none"
                rows={3}
                placeholder="Adicione observações sobre esta transação..."
              />
            </div>

            {/* Resumo da transação para parceladas */}
            {formData.format === 'parcelada' && formData.installments > 0 && formData.amount && formData.totalAmount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-green-800">Resumo da Transação</span>
                </div>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>Valor por Parcela:</strong> R$ {parseFloat(formData.amount).toFixed(2).replace('.', ',')}</p>
                  <p><strong>Parcelas:</strong> {formData.installments}x de R$ {parseFloat(formData.amount).toFixed(2).replace('.', ',')}</p>
                  <p><strong>Valor Total:</strong> R$ {parseFloat(formData.totalAmount).toFixed(2).replace('.', ',')}</p>
                  <p><strong>Período:</strong> {formData.startDate ? new Date(formData.startDate).toLocaleDateString('pt-BR') : ''} até {formData.endDate ? new Date(formData.endDate).toLocaleDateString('pt-BR') : ''}</p>
                </div>
              </div>
            )}

            {/* Espaçamento extra para melhor scroll no mobile */}
            <div className="pb-8"></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-4 lg:p-6 border-t bg-gray-50 lg:bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium touch-manipulation"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium touch-manipulation"
            disabled={filteredCategories.length === 0}
          >
            {formData.format === 'parcelada' && formData.installments > 0 && formData.amount
              ? `Adicionar Transação (${formData.installments} parcelas de R$ ${parseFloat(formData.amount).toFixed(2).replace('.', ',')})` 
              : 'Adicionar Transação'}
          </button>
        </div>
      </div>
    </div>
  )
}