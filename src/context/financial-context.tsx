'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './auth-context'
import { supabase } from '@/lib/supabase-client'
import type { Category, Card, Transaction, Budget } from '@/lib/supabase-client'

interface FinancialContextType {
  // Estados
  categories: Category[]
  cards: Card[]
  transactions: Transaction[]

  budgets: Budget[]
  
  // Paginação de transações
  loadMoreTransactions: () => Promise<void>
  hasMoreTransactions: boolean
  transactionsLoading: boolean
  refreshTransactions: () => Promise<void>
  
  // Categorias
  addCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  
  // Cartões
  addCard: (card: Omit<Card, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateCard: (id: string, card: Partial<Card>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  
  // Transações
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  

  
  // Orçamentos
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  
  // Resumo Financeiro
  getFinancialSummary: () => { receitas: number; despesas: number; saldo: number; categorias: string }
  getCompleteSummary: () => { receitas: number; despesas: number; saldo: number; categorias: string }
  
  // Loading states
  isLoading: boolean
  loadData: () => Promise<void>
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Estados de paginação para transações
  const [transactionsPage, setTransactionsPage] = useState(0)
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const TRANSACTIONS_PER_PAGE = 50

  // Carrega dados quando o usuário está logado
  useEffect(() => {
    if (user) {
      loadData()
    } else {
      // Limpa dados quando não há usuário
      setCategories([])
      setCards([])
      setTransactions([])

      setBudgets([])
      // Reset paginação
      setTransactionsPage(0)
      setHasMoreTransactions(true)
    }
  }, [user])





  const loadData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      await Promise.all([
        loadCategories(),
        loadCards(),
        loadTransactions(),
        loadBudgets()
      ])
    } catch (error) {
      // Silenciar erro de carregamento
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadCategories = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (error) {
      // Silenciar erro de carregamento de categorias
      return
    }
    
    setCategories(data || [])
  }

  const loadCards = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    if (error) {
      // Silenciar erro de carregamento de cartões
      return
    }
    
    setCards(data || [])
  }

  const loadTransactions = async (page = 0, reset = false) => {
    if (!user) return
    
    if (page === 0 || reset) {
      setTransactionsLoading(true)
    }
    
    console.log('🔍 Carregando transações para usuário:', user.id, 'página:', page)
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(*),
        card:cards!card_id(*)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .range(page * TRANSACTIONS_PER_PAGE, (page + 1) * TRANSACTIONS_PER_PAGE - 1)
    
    if (error) {
      console.error('❌ Erro ao carregar transações:', error)
      setTransactionsLoading(false)
      return
    }
    
    const newTransactions = data || []
    console.log('📊 Transações carregadas:', newTransactions.length)
    console.log('💰 Tipos de transações:', newTransactions.map(t => ({ id: t.id, type: t.type, description: t.description, amount: t.amount })))
    
    if (reset || page === 0) {
      setTransactions(newTransactions)
    } else {
      setTransactions(prev => [...prev, ...newTransactions])
    }
    
    setHasMoreTransactions(newTransactions.length === TRANSACTIONS_PER_PAGE)
    setTransactionsPage(page)
    setTransactionsLoading(false)
  }

  const loadMoreTransactions = async () => {
    if (!hasMoreTransactions || transactionsLoading) return
    await loadTransactions(transactionsPage + 1)
  }



  const loadBudgets = async () => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
    
    if (error) {
      // Silenciar erro de carregamento de orçamentos
      return
    }
    
    setBudgets(data || [])
  }

  // === CATEGORIAS ===
  const addCategory = async (categoryData: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...categoryData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) {
       // Silenciar erro de adição de categoria
       throw error
     }
    
    setCategories(prev => [...prev, data])
  }

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
       // Silenciar erro de atualização de categoria
       throw error
     }
    
    setCategories(prev => prev.map(cat => cat.id === id ? data : cat))
    
    // OTIMIZAÇÃO: Atualizar apenas as transações que usam essa categoria
    setTransactions(prev => prev.map(transaction => 
      transaction.category_id === id 
        ? { ...transaction, category: data }
        : transaction
    ))
    

    
    // Atualizar orçamentos relacionados
    setBudgets(prev => prev.map(budget => 
      budget.category_id === id 
        ? { ...budget, category: data }
        : budget
    ))
  }

  const deleteCategory = async (id: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
       // Silenciar erro de exclusão de categoria
       throw error
     }
    
    setCategories(prev => prev.filter(cat => cat.id !== id))
    // OTIMIZAÇÃO: Não recarregar transações - o RLS do banco já impede visualização
    // As transações com categoria deletada não serão mais visíveis due to FK constraint
  }

  // === CARTÕES ===
  const addCard = async (cardData: Omit<Card, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('cards')
      .insert({
        ...cardData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) {
       // Silenciar erro de adição de cartão
       throw error
     }
    
    setCards(prev => [...prev, data])
  }

  const updateCard = async (id: string, cardData: Partial<Card>) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('cards')
      .update(cardData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
       // Silenciar erro de atualização de cartão
       throw error
     }
    
    setCards(prev => prev.map(card => card.id === id ? data : card))
    
    // OTIMIZAÇÃO: Atualizar apenas as transações que usam esse cartão
    setTransactions(prev => prev.map(transaction => 
      transaction.card_id === id 
        ? { ...transaction, card: data }
        : transaction
    ))
    

  }

  const deleteCard = async (id: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
       // Silenciar erro de exclusão de cartão
       throw error
     }
    
    setCards(prev => prev.filter(card => card.id !== id))
    // OTIMIZAÇÃO: Não recarregar transações - o RLS do banco já impede visualização
  }

  // === TRANSAÇÕES ===
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return
    
    // Verificar se é uma transação parcelada
    const isInstallmentTransaction = (transactionData as any).format === 'parcelada' && 
                                   (transactionData as any).installments && 
                                   (transactionData as any).start_date && 
                                   (transactionData as any).end_date

    if (isInstallmentTransaction) {
      // Lógica para transações parceladas
      const installments = (transactionData as any).installments
      const startDate = new Date((transactionData as any).start_date)
      const valuePerInstallment = transactionData.amount / installments
      const installmentGroupId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      
      // Criar array de transações (uma para cada parcela)
      const installmentTransactions = []
      
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
        
        const installmentTransaction = {
          description: `${transactionData.description} (${i + 1}/${installments})`,
          amount: valuePerInstallment,
          type: transactionData.type,
          category_id: transactionData.category_id,
          card_id: transactionData.card_id,
          transaction_date: installmentDate.toISOString().split('T')[0],
          due_date: transactionData.due_date,
          notes: `${transactionData.notes || ''}\n🔄 Parcela ${i + 1} de ${installments}`.trim(),
          installment_number: i + 1,
          total_installments: installments,
          installment_group_id: installmentGroupId,
          user_id: user.id
        }
        
        installmentTransactions.push(installmentTransaction)
      }
      
      // Inserir todas as parcelas no banco
      const { data, error } = await supabase
        .from('transactions')
        .insert(installmentTransactions)
        .select(`
          *,
          category:categories(*),
          card:cards!card_id(*)
        `)
      
      if (error) {
         // Silenciar erro de adição de transações parceladas
         throw error
       }
      
      // Atualizar estado com todas as parcelas
      setTransactions(prev => [...(data || []), ...prev])
      
    } else {
      // Lógica para transações normais (única, recorrente, etc.)
      const cleanTransactionData = {
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category_id: transactionData.category_id,
        card_id: transactionData.card_id,
        transaction_date: transactionData.transaction_date,
        due_date: transactionData.due_date,
        notes: transactionData.notes,
        user_id: user.id
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(cleanTransactionData)
        .select(`
          *,
          category:categories(*),
          card:cards!card_id(*)
        `)
        .single()
      
      if (error) {
         // Silenciar erro de adição de transação
         throw error
       }
      
      setTransactions(prev => [data, ...prev])
    }
  }

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
    if (!user) return
    
    // Filtrar apenas os campos válidos da tabela transactions
    const validFields = {
      description: transactionData.description,
      amount: transactionData.amount,
      type: transactionData.type,
      category_id: transactionData.category_id,
      card_id: transactionData.card_id,
      transaction_date: transactionData.transaction_date,

      
      notes: transactionData.notes,
      is_completed: transactionData.is_completed
    }
    
    // Remover campos undefined
    const cleanData = Object.fromEntries(
      Object.entries(validFields).filter(([_, value]) => value !== undefined)
    )
    
    const { data, error } = await supabase
      .from('transactions')
      .update(cleanData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        category:categories(*),
        card:cards!card_id(*)
      `)
      .single()
    
    if (error) {
       // Silenciar erro de atualização de transação
       throw error
     }
    
    setTransactions(prev => prev.map(trans => trans.id === id ? data : trans))
  }

  const deleteTransaction = async (id: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
       // Silenciar erro de exclusão de transação
       throw error
     }
    
    setTransactions(prev => prev.filter(trans => trans.id !== id))
  }



  // === ORÇAMENTOS ===
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        ...budgetData,
        user_id: user.id
      })
      .select(`
        *,
        category:categories(*)
      `)
      .single()
    
    if (error) {
       // Silenciar erro de adição de orçamento
       throw error
     }
    
    setBudgets(prev => [...prev, data])
  }

  const updateBudget = async (id: string, budgetData: Partial<Budget>) => {
    if (!user) return
    
    const { data, error } = await supabase
      .from('budgets')
      .update(budgetData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()
    
    if (error) {
       // Silenciar erro de atualização de orçamento
       throw error
     }
    
    setBudgets(prev => prev.map(budget => budget.id === id ? data : budget))
  }

  const deleteBudget = async (id: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
       // Silenciar erro de exclusão de orçamento
       throw error
     }
    
    setBudgets(prev => prev.filter(budget => budget.id !== id))
  }

  // === RESUMO FINANCEIRO ===
  const getFinancialSummary = () => {
    // Filtrar apenas transações não finalizadas para o dashboard
    const pendingTransactions = transactions.filter(t => !t.is_completed)
    
    const receitas = pendingTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const despesas = pendingTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const saldo = receitas - despesas
    
    const categoriasUsadas = new Set(pendingTransactions.map(t => t.category?.name).filter(Boolean)).size
    
    return {
      receitas,
      despesas,
      saldo,
      categorias: `${categoriasUsadas} categoria${categoriasUsadas !== 1 ? 's' : ''}`
    }
  }

  const getCompleteSummary = () => {
    // Incluir todas as transações (finalizadas e pendentes)
    const receitas = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const despesas = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const saldo = receitas - despesas
    
    const categoriasUsadas = new Set(transactions.map(t => t.category?.name).filter(Boolean)).size
    
    return {
      receitas,
      despesas,
      saldo,
      categorias: `${categoriasUsadas} categoria${categoriasUsadas !== 1 ? 's' : ''}`
    }
  }

  return (
    <FinancialContext.Provider value={{
      categories,
      cards,
      transactions,
      budgets,
      addCategory,
      updateCategory,
      deleteCategory,
      addCard,
      updateCard,
      deleteCard,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget,
      getFinancialSummary,
      getCompleteSummary,
      isLoading,
      loadData,
      loadMoreTransactions,
      hasMoreTransactions,
      transactionsLoading,
      refreshTransactions: () => loadTransactions(0, true)
    }}>
      {children}
    </FinancialContext.Provider>
  )
}

export function useFinancial() {
  const context = useContext(FinancialContext)
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider')
  }
  return context
}