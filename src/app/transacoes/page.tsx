'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Download, Calendar, X, AlertTriangle, Trash2, Edit2, Check, CheckSquare, Square, MoreHorizontal } from 'lucide-react'
import { useFinancial } from '@/context/financial-context'
import { useSubscription } from '@/hooks/use-subscription'
import { NewTransactionModal } from '@/components/new-transaction-modal'
import { EditTransactionModal } from '@/components/edit-transaction-modal'
import { TransactionPrerequisitesGuide } from '@/components/transaction-prerequisites-guide'
import { TransactionsList } from '@/components/transactions-list'
import { useTransactionPrerequisites } from '@/hooks/use-transaction-prerequisites'
import { ProtectedRoute } from '@/components/protected-route'
import type { Transaction } from '@/lib/supabase-client'

export default function TransacoesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todas')
  const [showNewTransactionModal, setShowNewTransactionModal] = useState(false)
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showPrerequisitesGuide, setShowPrerequisitesGuide] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [categoryFilter, setCategoryFilter] = useState('')
  const [cardFilter, setCardFilter] = useState('')
  const [amountFilter, setAmountFilter] = useState({
    min: '',
    max: ''
  })
  const [installmentFilter, setInstallmentFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  })
  
  const { 
    transactions, 
    cards, 
    categories, 
    getCompleteSummary, 
    deleteTransaction, 
    updateTransaction,
    loadMoreTransactions,
    hasMoreTransactions,
    transactionsLoading
  } = useFinancial()
  const { canCreateTransaction } = useTransactionPrerequisites()
  const { canPerformAction, isTrialExpired } = useSubscription()

  const { receitas, despesas, saldo } = getCompleteSummary()

  // Verificar se pode criar transações considerando tanto pré-requisitos quanto trial
  const canCreateTransactionFull = canCreateTransaction && canPerformAction('transactions')

  // Função para lidar com o clique no botão Nova Transação
  const handleNewTransactionClick = () => {
    if (isTrialExpired()) {
      // Se trial expirou, redirecionar para planos
      window.location.href = '/planos'
      return
    }
    
    if (canCreateTransaction) {
      setShowNewTransactionModal(true)
    } else {
      setShowPrerequisitesGuide(true)
    }
  }

  // Função para continuar para o modal de transação após o guia
  const handleContinueToTransaction = () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    setShowNewTransactionModal(true)
  }

  // Função para editar transação
  const handleEditTransaction = (transaction: Transaction) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    
    if (!canPerformAction('transactions')) {
      alert('Você não tem permissão para editar transações.')
      return
    }
    
    setEditingTransaction(transaction)
    setShowEditTransactionModal(true)
  }

  // Função para finalizar/desfinalizar transação
  const handleToggleTransactionStatus = async (transaction: Transaction) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    
    if (!canPerformAction('transactions')) {
      alert('Você não tem permissão para modificar transações.')
      return
    }
    
    try {
      const isCompleting = !transaction.is_completed
      const hoje = new Date().toLocaleDateString('pt-BR')
      
      let updatedTransaction
      let mensagem = ''
      
      if (isCompleting) {
        // Finalizando a transação
        if (transaction.type === 'income') {
          mensagem = `💰 Receita confirmada!\n\nA receita "${transaction.description}" foi marcada como recebida em ${hoje}.`
          updatedTransaction = {
            ...transaction,
            is_completed: true,
            notes: `${transaction.notes || ''}\n✅ Recebida em ${hoje}`.trim()
          }
        } else {
          mensagem = `💳 Despesa paga!\n\nA conta "${transaction.description}" foi marcada como paga em ${hoje}.`
          updatedTransaction = {
            ...transaction,
            is_completed: true,
            notes: `${transaction.notes || ''}\n✅ Paga em ${hoje}`.trim()
          }
        }
      } else {
        // Desfazendo a finalização
        mensagem = `🔄 Status revertido!\n\nA transação "${transaction.description}" foi marcada como pendente novamente.`
        
        // Remover a nota de finalização anterior
        const notesWithoutCompletion = (transaction.notes || '').replace(/\n?✅\s*(Paga|Recebida|Finalizada)\s*em\s*\d{2}\/\d{2}\/\d{4}/g, '').trim()
        
        updatedTransaction = {
          ...transaction,
          is_completed: false,
          notes: notesWithoutCompletion || undefined
        }
      }
      
      await updateTransaction(transaction.id, updatedTransaction)
      
      // Mostrar feedback personalizado
      alert(mensagem)
    } catch (error) {
      console.error('Erro ao atualizar status da transação:', error)
      alert('Erro ao atualizar transação. Tente novamente.')
    }
  }

  // Funções de seleção em massa
  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactions(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === transacoesFiltradas.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transacoesFiltradas.map(t => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    
    if (!canPerformAction('transactions')) {
      alert('Você não tem permissão para excluir transações.')
      return
    }

    if (selectedTransactions.size === 0) {
      alert('Selecione pelo menos uma transação para excluir.')
      return
    }

    const confirmMessage = selectedTransactions.size === 1 
      ? 'Tem certeza que deseja excluir a transação selecionada?'
      : `Tem certeza que deseja excluir ${selectedTransactions.size} transações selecionadas?`

    if (confirm(confirmMessage)) {
      try {
        const deletePromises = Array.from(selectedTransactions).map(id => deleteTransaction(id))
        await Promise.all(deletePromises)
        setSelectedTransactions(new Set())
        setIsSelectMode(false)
        alert(`${selectedTransactions.size} transação(ões) excluída(s) com sucesso!`)
      } catch (error) {
        console.error('Erro ao excluir transações:', error)
        alert('Erro ao excluir algumas transações. Tente novamente.')
      }
    }
  }

  const handleBulkMarkComplete = async () => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    
    if (!canPerformAction('transactions')) {
      alert('Você não tem permissão para modificar transações.')
      return
    }

    if (selectedTransactions.size === 0) {
      alert('Selecione pelo menos uma transação para finalizar.')
      return
    }

    // Obter informações das transações selecionadas
    const selectedTransactionsList = Array.from(selectedTransactions).map(id => 
      transactions.find(t => t.id === id)
    ).filter((t): t is Transaction => t !== undefined)

    const receitas = selectedTransactionsList.filter(t => t.type === 'income').length
    const despesas = selectedTransactionsList.filter(t => t.type === 'expense').length
    const hoje = new Date().toLocaleDateString('pt-BR')

    // Criar mensagem personalizada
    let mensagem = `✅ Finalizado em ${hoje}!\n\n`
    
    if (receitas > 0 && despesas > 0) {
      mensagem += `📈 ${receitas} receita(s) confirmada(s) como recebida(s)\n`
      mensagem += `💸 ${despesas} despesa(s) marcada(s) como paga(s)\n\n`
      mensagem += `Todas as transações foram processadas com sucesso!`
    } else if (receitas > 0) {
      mensagem += `💰 ${receitas} receita(s) confirmada(s) como recebida(s)!\n\n`
      mensagem += `O dinheiro foi creditado em sua conta no dia de hoje.`
    } else if (despesas > 0) {
      mensagem += `💳 ${despesas} despesa(s) marcada(s) como paga(s)!\n\n`
      mensagem += `As contas foram quitadas no dia de hoje.`
    }

    try {
      const updatePromises = Array.from(selectedTransactions).map(id => {
        const transaction = transactions.find(t => t.id === id)
        if (transaction) {
          return updateTransaction(id, { 
            ...transaction, 
            is_completed: true,
            notes: `${transaction.notes || ''}\n✅ Finalizada em ${new Date().toLocaleDateString('pt-BR')}`.trim()
          })
        }
        return Promise.resolve()
      })
      await Promise.all(updatePromises)
      setSelectedTransactions(new Set())
      setIsSelectMode(false)
      
      // Mostrar mensagem personalizada
      alert(mensagem)
    } catch (error) {
      console.error('Erro ao finalizar transações:', error)
      alert('Erro ao finalizar algumas transações. Tente novamente.')
    }
  }

  const exitSelectMode = () => {
    setIsSelectMode(false)
    setSelectedTransactions(new Set())
  }

  // Função para obter texto e estilo do botão baseado no status
  const getTransactionButtonProps = () => {
    if (isTrialExpired()) {
      return {
        text: 'Trial Expirado - Renovar',
        className: 'bg-red-600 text-white hover:bg-red-700 animate-pulse',
        icon: AlertTriangle,
        title: 'Seu trial expirou. Clique para renovar.'
      }
    }
    
    if (!canCreateTransaction) {
      return {
        text: 'Começar Transações',
        className: 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse',
        icon: Plus,
        title: 'Configure categorias e cartões primeiro'
      }
    }
    
    return {
      text: 'Nova Transação',
      className: 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105',
      icon: Plus,
      title: 'Criar nova transação'
    }
  }

  const buttonProps = getTransactionButtonProps()
  const ButtonIcon = buttonProps.icon

  const transacoesFiltradas = transactions.filter(transacao => {
    const categoryName = transacao.category?.name || ''
    const matchDescricao = transacao.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = filtroTipo === 'todas' || transacao.type === filtroTipo.replace('receita', 'income').replace('despesa', 'expense')
    
    // Filtros avançados
    const matchCategory = !categoryFilter || transacao.category_id === categoryFilter
    const matchCard = !cardFilter || transacao.card_id === cardFilter
    
    // Filtro de data
    const transactionDate = new Date(transacao.transaction_date)
    const matchStartDate = !dateFilter.startDate || transactionDate >= new Date(dateFilter.startDate)
    const matchEndDate = !dateFilter.endDate || transactionDate <= new Date(dateFilter.endDate)
    
    // Filtro de valor
    const matchMinAmount = !amountFilter.min || transacao.amount >= parseFloat(amountFilter.min)
    const matchMaxAmount = !amountFilter.max || transacao.amount <= parseFloat(amountFilter.max)
    
    // Filtro de parcelas (por mês de vencimento)
    const matchInstallment = !installmentFilter || (() => {
      const transactionMonth = transactionDate.getMonth() + 1
      const transactionYear = transactionDate.getFullYear()
      const [filterYear, filterMonth] = installmentFilter.split('-').map(Number)
      return transactionYear === filterYear && transactionMonth === filterMonth
    })()
    
    // Filtro por mês específico
    const matchMonth = !monthFilter || (() => {
      const transactionMonth = transactionDate.getMonth() + 1
      const transactionYear = transactionDate.getFullYear()
      const [filterYear, filterMonth] = monthFilter.split('-').map(Number)
      return transactionYear === filterYear && transactionMonth === filterMonth
    })()
    
    return (matchDescricao || matchCategoria) && matchTipo && matchCategory && matchCard && 
           matchStartDate && matchEndDate && matchMinAmount && matchMaxAmount && matchInstallment && matchMonth
  })

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getCardName = (cardId?: string) => {
    if (!cardId) return 'Sem cartão'
    const card = cards.find(c => c.id === cardId)
    if (!card) return 'Cartão não encontrado'
    return `${card.name} ${card.last_digits ? `(**** ${card.last_digits})` : ''}`
  }

  const exportToCSV = () => {
    if (transacoesFiltradas.length === 0) {
      alert('Nenhuma transação para exportar!')
      return
    }

            const headers = ['Data', 'Descrição', 'Categoria', 'Cartão', 'Tipo', 'Valor', 'Data Vencimento', 'Parcela']
    const csvData = [
      headers.join(','),
      ...transacoesFiltradas.map(t => [
        formatarData(t.transaction_date),
        `"${t.description}"`,
        `"${t.category?.name || 'Sem categoria'}"`,
        `"${getCardName(t.card_id)}"`,
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.amount.toString().replace('.', ','),
        t.due_date ? formatarData(t.due_date) : 'Sem vencimento',
        t.installment_number && t.total_installments ? `${t.installment_number}/${t.total_installments}` : 'Única'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    if (transacoesFiltradas.length === 0) {
      alert('Nenhuma transação para exportar!')
      return
    }

    let htmlContent = `
      <html>
        <head>
          <title>Relatório de Transações - FinancePRO</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .income { color: green; }
            .expense { color: red; }
            .summary { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Relatório de Transações - FinancePRO</h1>
          <div class="summary">
            <p><strong>Período:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de Transações:</strong> ${transacoesFiltradas.length}</p>
            <p><strong>Receitas:</strong> ${formatarValor(receitas)}</p>
            <p><strong>Despesas:</strong> ${formatarValor(despesas)}</p>
            <p><strong>Saldo:</strong> ${formatarValor(saldo)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Cartão</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Parcela</th>
              </tr>
            </thead>
            <tbody>
    `

    transacoesFiltradas.forEach(t => {
      htmlContent += `
        <tr>
          <td>${formatarData(t.transaction_date)}</td>
          <td>${t.description}</td>
          <td>${t.category?.name || 'Sem categoria'}</td>
          <td>${getCardName(t.card_id)}</td>
          <td>${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
          <td class="${t.type === 'income' ? 'income' : 'expense'}">
            ${t.type === 'income' ? '+' : '-'}${formatarValor(t.amount)}
          </td>
          <td>${t.due_date ? formatarData(t.due_date) : '-'}</td>
          <td>${t.installment_number && t.total_installments ? `${t.installment_number}/${t.total_installments}` : 'Única'}</td>
        </tr>
      `
    })

    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `

    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
      newWindow.print()
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFiltroTipo('todas')
    setDateFilter({ startDate: '', endDate: '' })
    setCategoryFilter('')
    setCardFilter('')
    setAmountFilter({ min: '', max: '' })
    setInstallmentFilter('')
    setMonthFilter('')
    setShowAdvancedFilters(false)
  }

  const handleDeleteTransaction = async (transactionId: string, description: string) => {
    if (isTrialExpired()) {
      window.location.href = '/planos'
      return
    }
    
    if (!canPerformAction('transactions')) {
      alert('Você não tem permissão para excluir transações.')
      return
    }
    
    if (confirm(`Tem certeza que deseja excluir a transação "${description}"?`)) {
      try {
        await deleteTransaction(transactionId)
      } catch (error) {
        console.error('Erro ao excluir transação:', error)
        alert('Erro ao excluir transação. Tente novamente.')
      }
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-4 lg:space-y-6">
        {/* Header Mobile-First */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center justify-between sm:justify-start space-x-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">💳 Transações</h1>
            {transacoesFiltradas.length > 0 && !isSelectMode && (
              <button
                onClick={() => setIsSelectMode(true)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm lg:text-base bg-white"
                title="Selecionar múltiplas transações"
              >
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Selecionar</span>
              </button>
            )}
          </div>
          
          <button 
            onClick={handleNewTransactionClick}
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 rounded-lg transition-all font-medium ${buttonProps.className}`}
            title={buttonProps.title}
          >
            <ButtonIcon className="h-4 w-4" />
            <span>{buttonProps.text}</span>
          </button>
        </div>

        {/* Barra de ações em massa - Mobile Otimizada */}
        {isSelectMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center sm:justify-start space-x-2 text-blue-700 hover:text-blue-800 p-2 sm:p-0"
                >
                  {selectedTransactions.size === transacoesFiltradas.length ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {selectedTransactions.size === transacoesFiltradas.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </span>
                </button>
                {selectedTransactions.size > 0 && (
                  <span className="text-blue-700 font-medium text-center sm:text-left">
                    {selectedTransactions.size} selecionada(s)
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedTransactions.size > 0 && (
                  <>
                    <button
                      onClick={handleBulkMarkComplete}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      title="Marcar como finalizadas"
                    >
                      <Check className="h-4 w-4" />
                      <span>Finalizar</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      title="Excluir selecionadas"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir</span>
                    </button>
                  </>
                )}
                <button
                  onClick={exitSelectMode}
                  className="flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm bg-white"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards de Resumo - Mobile-First */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">💰</div>
              <div>
                  <p className="text-xs lg:text-sm text-gray-600">Receitas</p>
                  <p className="text-lg lg:text-xl font-bold text-green-600">{formatarValor(receitas)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">💸</div>
              <div>
                  <p className="text-xs lg:text-sm text-gray-600">Despesas</p>
                  <p className="text-lg lg:text-xl font-bold text-red-600">{formatarValor(despesas)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-blue-600 mr-3">💳</div>
              <div>
                  <p className="text-xs lg:text-sm text-gray-600">Saldo</p>
                  <p className={`text-lg lg:text-xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatarValor(saldo)}
                </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert de trial expirado */}
        {isTrialExpired() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-start sm:items-center">
                <div className="text-red-600 mr-3 mt-0.5 sm:mt-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Trial de 30 dias expirado</h3>
                <p className="text-sm text-red-700 mt-1">
                  Seu trial completo acabou. Faça upgrade para continuar criando e gerenciando transações.
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

        {/* Alert de pré-requisitos se necessário */}
        {!isTrialExpired() && !canCreateTransaction && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-start sm:items-center">
                <div className="text-orange-600 mr-3 mt-0.5 sm:mt-0">⚠️</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">Configuração necessária</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Para criar transações você precisa ter pelo menos uma categoria e um cartão/conta cadastrados.
                </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrerequisitesGuide(true)}
                className="w-full sm:w-auto bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors"
              >
                Ver guia
              </button>
            </div>
          </div>
        )}

        {/* Filtros - Mobile-First */}
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
          <div className="flex flex-col gap-4">
            {/* Filtros básicos */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todas">Todas</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Despesas</option>
                </select>
                
                <div className="flex-1 sm:flex-none">
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Filtrar por mês específico"
                    placeholder="Selecionar mês"
                  />
                </div>
                
                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm bg-white"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>
              </div>
            </div>

            {/* Filtros avançados */}
            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Todas as categorias</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cartão/Conta</label>
                    <select
                      value={cardFilter}
                      onChange={(e) => setCardFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Todos os cartões</option>
                      {cards.map(card => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📅 Mês Parcela</label>
                    <input
                      type="month"
                      value={installmentFilter}
                      onChange={(e) => setInstallmentFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      title="Filtrar por mês de vencimento das parcelas"
                    />
                  </div>
                  </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Faixa de Valor</label>
                  <div className="flex gap-2">
                      <input
                        type="number"
                        value={amountFilter.min}
                        onChange={(e) => setAmountFilter({...amountFilter, min: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Valor mínimo"
                        step="0.01"
                      />
                      <input
                        type="number"
                        value={amountFilter.max}
                        onChange={(e) => setAmountFilter({...amountFilter, max: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Valor máximo"
                        step="0.01"
                      />
                  </div>
                </div>

                {/* Botão limpar filtros */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Limpar Filtros</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Transações com Agrupamento de Parcelas */}
        <TransactionsList
          transactions={transacoesFiltradas}
          selectedTransactions={selectedTransactions}
          isSelectMode={isSelectMode}
          onSelect={handleSelectTransaction}
          onToggleStatus={handleToggleTransactionStatus}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          formatValue={formatarValor}
          formatDate={formatarData}
          getCardName={getCardName}
          isTrialExpired={isTrialExpired()}
        />

        {/* Botão Carregar Mais */}
        {hasMoreTransactions && transacoesFiltradas.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreTransactions}
              disabled={transactionsLoading}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {transactionsLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <span>Carregar Mais</span>
                  <MoreHorizontal className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Modais */}
        <NewTransactionModal
          isOpen={showNewTransactionModal}
          onClose={() => setShowNewTransactionModal(false)}
        />

        <EditTransactionModal
          isOpen={showEditTransactionModal}
          onClose={() => {
            setShowEditTransactionModal(false)
            setEditingTransaction(null)
          }}
          transaction={editingTransaction}
        />

        <TransactionPrerequisitesGuide
          isOpen={showPrerequisitesGuide}
          onClose={() => setShowPrerequisitesGuide(false)}
          onContinueToTransaction={handleContinueToTransaction}
        />
      </div>
    </ProtectedRoute>
  )
}