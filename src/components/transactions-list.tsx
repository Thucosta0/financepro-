'use client'

import { memo, useMemo, useState } from 'react'
import { Check, Edit2, Trash2, ChevronDown, ChevronRight, CreditCard, Calendar, Eye, EyeOff } from 'lucide-react'
import type { Transaction } from '@/lib/supabase-client'

interface TransactionGroup {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: any
  card_id?: string
  transactions: Transaction[]
  isInstallmentGroup: boolean
  totalInstallments?: number
  completedInstallments: number
  nextDueDate?: string
  installmentGroupId?: string
}

interface TransactionItemProps {
  transaction: Transaction
  isSelected?: boolean
  isSelectMode?: boolean
  onSelect?: (id: string) => void
  onToggleStatus?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string, description: string) => void
  formatValue: (value: number) => string
  formatDate: (date: string) => string
  getCardName: (cardId?: string) => string
  isTrialExpired: boolean
  isInGroup?: boolean
}

const TransactionItem = memo(function TransactionItem({
  transaction,
  isSelected = false,
  isSelectMode = false,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete,
  formatValue,
  formatDate,
  getCardName,
  isTrialExpired,
  isInGroup = false
}: TransactionItemProps) {
  return (
    <div className={`${isInGroup ? 'ml-6 border-l-2 border-blue-200 pl-4' : ''} p-2 sm:p-4 ${isInGroup ? 'py-2 sm:py-3' : 'py-4 sm:py-6'} transition-colors ${
      transaction.is_completed ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
    }`}>
      <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
        <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
          {/* Checkbox de seleção em massa */}
          {isSelectMode && (
            <button
              onClick={() => onSelect?.(transaction.id)}
              className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                isSelected
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              title={isSelected ? 'Desmarcar transação' : 'Selecionar transação'}
            >
              {isSelected && <Check className="h-3 w-3" />}
            </button>
          )}
          
          {/* Checkbox para finalizar */}
          {!isSelectMode && (
            <button
              onClick={() => onToggleStatus?.(transaction)}
              className={`flex items-center justify-center w-5 h-5 rounded-lg border-2 transition-all ${
                transaction.is_completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300 hover:border-green-400'
              } ${isTrialExpired ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
              disabled={isTrialExpired}
              title={transaction.is_completed ? 'Marcar como pendente' : 'Marcar como finalizada'}
            >
              {transaction.is_completed && <Check className="h-3 w-3" />}
            </button>
          )}

          {/* Informações da transação */}
          <div className="flex-1">
            <h3 className={`${isInGroup ? 'text-base' : 'text-lg'} font-medium ${
              transaction.is_completed ? 'text-gray-600 line-through' : 'text-gray-900'
            }`}>
              {transaction.description}
            </h3>
            <div className="mt-1 space-y-1">
              {/* Primeira linha: Categoria e Cartão */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                <span className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: transaction.category?.color || '#gray' }}></span>
                  {transaction.category?.name || 'Sem categoria'}
                </span>
                <span className="hidden sm:inline">•</span>
                <span>{getCardName(transaction.card_id)}</span>
              </div>
              
              {/* Segunda linha: Data, Parcela e Status */}
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                <span>{formatDate(transaction.transaction_date)}</span>
                
                {/* Mostrar informações de parcela se existir */}
                {transaction.installment_number && transaction.total_installments && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📅 {transaction.installment_number}/{transaction.total_installments}
                  </span>
                )}

                {transaction.is_completed && (
                  <span className="text-green-600 font-medium">✅ Finalizada</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Valor e botões de ação */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <div className={`text-right font-semibold ${isInGroup ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} ${
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          } ${transaction.is_completed ? 'opacity-60' : ''} min-w-0`}>
            <div className="truncate">
              {transaction.type === 'income' ? '+' : '-'}{formatValue(transaction.amount)}
            </div>
          </div>

          {/* Botões de ação individual - ocultos no modo de seleção */}
          {!isSelectMode && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Botão de editar */}
              <button
                onClick={() => onEdit?.(transaction)}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isTrialExpired 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
                title={isTrialExpired ? 'Trial expirado' : 'Editar transação'}
                disabled={isTrialExpired}
              >
                <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              {/* Botão de excluir */}
              <button
                onClick={() => onDelete?.(transaction.id, transaction.description)}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isTrialExpired 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-red-600 hover:bg-red-50'
                }`}
                title={isTrialExpired ? 'Trial expirado' : 'Excluir transação'}
                disabled={isTrialExpired}
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

interface TransactionGroupItemProps {
  group: TransactionGroup
  selectedTransactions: Set<string>
  isSelectMode: boolean
  onSelect: (id: string) => void
  onToggleStatus: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string, description: string) => void
  formatValue: (value: number) => string
  formatDate: (date: string) => string
  getCardName: (cardId?: string) => string
  isTrialExpired: boolean
}

const TransactionGroupItem = memo(function TransactionGroupItem({
  group,
  selectedTransactions,
  isSelectMode,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete,
  formatValue,
  formatDate,
  getCardName,
  isTrialExpired
}: TransactionGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const totalAmount = group.transactions.reduce((sum, t) => sum + t.amount, 0)
  const allCompleted = group.transactions.every(t => t.is_completed)
  const someCompleted = group.transactions.some(t => t.is_completed)
  const groupSelected = group.transactions.every(t => selectedTransactions.has(t.id))
  const someSelected = group.transactions.some(t => selectedTransactions.has(t.id))

  const handleGroupSelect = () => {
    if (groupSelected) {
      // Desmarcar todos
      group.transactions.forEach(t => onSelect(t.id))
    } else {
      // Selecionar todos que não estão selecionados
      group.transactions.forEach(t => {
        if (!selectedTransactions.has(t.id)) {
          onSelect(t.id)
        }
      })
    }
  }

  const handleGroupToggleStatus = async () => {
    if (isTrialExpired) return
    
    // Marcar todas as parcelas como completas/incompletas
    const shouldComplete = !allCompleted
    
    for (const transaction of group.transactions) {
      if (transaction.is_completed !== shouldComplete) {
        await onToggleStatus(transaction)
      }
    }
  }

  const handleGroupDelete = () => {
    if (isTrialExpired) return
    
    if (confirm(`Tem certeza que deseja excluir todas as ${group.transactions.length} parcelas de "${group.description}"?`)) {
      group.transactions.forEach(t => onDelete(t.id, t.description))
    }
  }

  return (
    <div className={`border-l-4 transition-all ${
      allCompleted ? 'border-green-500 bg-green-50' : 
      someCompleted ? 'border-yellow-500 bg-yellow-50' : 
      'border-blue-500 bg-blue-50'
    }`}>
      {/* Cabeçalho do grupo */}
      <div className="p-2 sm:p-4 hover:bg-white/50 transition-colors">
        <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
          <div className="flex items-start sm:items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            {/* Checkbox de seleção em massa */}
            {isSelectMode && (
              <button
                onClick={handleGroupSelect}
                className={`flex items-center justify-center w-6 h-6 rounded border-2 transition-all ${
                  groupSelected
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : someSelected 
                      ? 'bg-blue-300 border-blue-300 text-white'
                      : 'border-gray-300 hover:border-blue-400'
                }`}
                title={groupSelected ? 'Desmarcar grupo' : 'Selecionar grupo'}
              >
                {groupSelected && <Check className="h-4 w-4" />}
                {someSelected && !groupSelected && <div className="w-2 h-2 bg-white rounded-full" />}
              </button>
            )}
            
            {/* Checkbox para finalizar grupo */}
            {!isSelectMode && (
              <button
                onClick={handleGroupToggleStatus}
                className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all ${
                  allCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : someCompleted
                      ? 'bg-yellow-500 border-yellow-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                } ${isTrialExpired ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                disabled={isTrialExpired}
                title={allCompleted ? 'Marcar todas como pendentes' : 'Marcar todas como finalizadas'}
              >
                {allCompleted && <Check className="h-4 w-4" />}
                {someCompleted && !allCompleted && <div className="w-2 h-2 bg-white rounded-full" />}
              </button>
            )}

            {/* Botão de expandir/recolher */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>

            {/* Informações do grupo */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-base sm:text-lg font-semibold ${
                allCompleted ? 'text-gray-600 line-through' : 'text-gray-900'
              }`}>
                <CreditCard className="inline h-4 w-4 mr-2" />
                <span className="truncate">{group.description}</span>
              </h3>
              <div className="mt-1 space-y-1">
                {/* Primeira linha: Categoria e Cartão */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: group.category?.color || '#gray' }}></span>
                    {group.category?.name || 'Sem categoria'}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span>{getCardName(group.card_id)}</span>
                </div>
                
                {/* Segunda linha: Parcelas e Próxima data */}
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📅 {group.completedInstallments}/{group.totalInstallments} parcelas
                  </span>
                  {group.nextDueDate && (
                    <span className="text-orange-600 font-medium">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      Próxima: {formatDate(group.nextDueDate)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Valor total e botões de ação */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div className="text-right min-w-0">
              <div className={`font-bold text-base sm:text-lg ${
                group.type === 'income' ? 'text-green-600' : 'text-red-600'
              } ${allCompleted ? 'opacity-60' : ''}`}>
                <div className="truncate">
                  {group.type === 'income' ? '+' : '-'}{formatValue(totalAmount)}
                </div>
              </div>
              <div className="text-xs text-gray-500 truncate">
                {formatValue(group.amount)} × {group.totalInstallments}
              </div>
            </div>

            {/* Botões de ação do grupo */}
            {!isSelectMode && (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                  title={isExpanded ? 'Recolher parcelas' : 'Ver parcelas'}
                >
                  {isExpanded ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>
                
                <button
                  onClick={handleGroupDelete}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                    isTrialExpired 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={isTrialExpired ? 'Trial expirado' : 'Excluir todas as parcelas'}
                  disabled={isTrialExpired}
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parcelas individuais (expandidas) */}
      {isExpanded && (
        <div className="bg-white/80 border-t border-gray-200">
          {group.transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedTransactions.has(transaction.id)}
              isSelectMode={isSelectMode}
              onSelect={onSelect}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              formatValue={formatValue}
              formatDate={formatDate}
              getCardName={getCardName}
              isTrialExpired={isTrialExpired}
              isInGroup={true}
            />
          ))}
        </div>
      )}
    </div>
  )
})

interface TransactionsListProps {
  transactions: Transaction[]
  selectedTransactions: Set<string>
  isSelectMode: boolean
  onSelect: (id: string) => void
  onToggleStatus: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string, description: string) => void
  formatValue: (value: number) => string
  formatDate: (date: string) => string
  getCardName: (cardId?: string) => string
  isTrialExpired: boolean
}

export const TransactionsList = memo(function TransactionsList({
  transactions,
  selectedTransactions,
  isSelectMode,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete,
  formatValue,
  formatDate,
  getCardName,
  isTrialExpired
}: TransactionsListProps) {
  
  const { groups, individualTransactions } = useMemo(() => {
    const groups: TransactionGroup[] = []
    const individualTransactions: Transaction[] = []
    const processedGroupIds = new Set<string>()

    // Debug: Log das transações recebidas
    console.log('🔍 TransactionsList - Total de transações:', transactions.length)
    console.log('🔍 TransactionsList - Transações com installment_group_id:', 
      transactions.filter(t => t.installment_group_id).length)
    
    // Primeiro, identificar grupos por installment_group_id
    const groupedByInstallmentId = new Map<string, Transaction[]>()
    
    transactions.forEach(transaction => {
      if (transaction.installment_group_id) {
        console.log('📦 Encontrada transação parcelada:', {
          id: transaction.id,
          description: transaction.description,
          installment_group_id: transaction.installment_group_id,
          installment_number: transaction.installment_number,
          total_installments: transaction.total_installments
        })
        
        if (!groupedByInstallmentId.has(transaction.installment_group_id)) {
          groupedByInstallmentId.set(transaction.installment_group_id, [])
        }
        groupedByInstallmentId.get(transaction.installment_group_id)!.push(transaction)
      }
    })

    // Criar grupos das transações com installment_group_id
    groupedByInstallmentId.forEach((groupTransactions, groupId) => {
      if (groupTransactions.length > 1) {
        processedGroupIds.add(groupId)
        const firstTransaction = groupTransactions[0]
        const completedCount = groupTransactions.filter(t => t.is_completed).length
        const nextDue = groupTransactions
          .filter(t => !t.is_completed)
          .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())[0]

        groups.push({
          id: groupId,
          description: firstTransaction.description,
          amount: firstTransaction.amount,
          type: firstTransaction.type,
          category: firstTransaction.category,
          card_id: firstTransaction.card_id,
          transactions: groupTransactions.sort((a, b) => 
            (a.installment_number || 0) - (b.installment_number || 0)
          ),
          isInstallmentGroup: true,
          totalInstallments: firstTransaction.total_installments,
          completedInstallments: completedCount,
          nextDueDate: nextDue?.transaction_date,
          installmentGroupId: groupId
        })
      }
    })

    // Agrupar transações similares sem installment_group_id
    const ungroupedTransactions = transactions.filter(t => 
      !t.installment_group_id || !processedGroupIds.has(t.installment_group_id)
    )

    const similarGroups = new Map<string, Transaction[]>()
    
    ungroupedTransactions.forEach(transaction => {
      // Criar chave baseada na descrição e valor para agrupar transações similares
      const key = `${transaction.description.toLowerCase()}-${transaction.amount}-${transaction.type}`
      
      if (!similarGroups.has(key)) {
        similarGroups.set(key, [])
      }
      similarGroups.get(key)!.push(transaction)
    })

    // Processar grupos similares
    similarGroups.forEach((groupTransactions, key) => {
      if (groupTransactions.length > 1) {
        // Verificar se são realmente parcelas (valores iguais e datas sequenciais)
        const allSameAmount = groupTransactions.every(t => t.amount === groupTransactions[0].amount)
        const sortedByDate = groupTransactions.sort((a, b) => 
          new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        )
        
        if (allSameAmount) {
          const firstTransaction = sortedByDate[0]
          const completedCount = groupTransactions.filter(t => t.is_completed).length
          const nextDue = groupTransactions
            .filter(t => !t.is_completed)
            .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())[0]

          groups.push({
            id: key,
            description: firstTransaction.description,
            amount: firstTransaction.amount,
            type: firstTransaction.type,
            category: firstTransaction.category,
            card_id: firstTransaction.card_id,
            transactions: sortedByDate,
            isInstallmentGroup: false,
            totalInstallments: groupTransactions.length,
            completedInstallments: completedCount,
            nextDueDate: nextDue?.transaction_date
          })
        } else {
          // Não são parcelas, tratar como transações individuais
          individualTransactions.push(...groupTransactions)
        }
      } else {
        // Transação única
        individualTransactions.push(...groupTransactions)
      }
    })

    return { groups, individualTransactions }
  }, [transactions])

  const sortedGroups = useMemo(() => {
    return groups.sort((a, b) => {
      // Ordenar por data da próxima parcela ou data mais recente
      const aDate = a.nextDueDate || a.transactions[a.transactions.length - 1]?.transaction_date
      const bDate = b.nextDueDate || b.transactions[b.transactions.length - 1]?.transaction_date
      return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime()
    })
  }, [groups])

  const sortedIndividualTransactions = useMemo(() => {
    return individualTransactions.sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
  }, [individualTransactions])

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {(sortedGroups.length > 0 || sortedIndividualTransactions.length > 0) ? (
        <div className="divide-y divide-gray-200">
          {/* Grupos de parcelas */}
          {sortedGroups.map((group) => (
            <TransactionGroupItem
              key={group.id}
              group={group}
              selectedTransactions={selectedTransactions}
              isSelectMode={isSelectMode}
              onSelect={onSelect}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              formatValue={formatValue}
              formatDate={formatDate}
              getCardName={getCardName}
              isTrialExpired={isTrialExpired}
            />
          ))}

          {/* Transações individuais */}
          {sortedIndividualTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              isSelected={selectedTransactions.has(transaction.id)}
              isSelectMode={isSelectMode}
              onSelect={onSelect}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              formatValue={formatValue}
              formatDate={formatDate}
              getCardName={getCardName}
              isTrialExpired={isTrialExpired}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando sua primeira transação.
          </p>
        </div>
      )}
    </div>
  )
})