import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Email do administrador
const ADMIN_EMAIL = 'arthurcos33@gmail.com'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso negado - apenas administradores' }, { status: 403 })
    }

    // Buscar estatísticas do sistema usando client admin (bypassa RLS)
    const [
      usersResult,
      transactionsResult,
      categoriesResult,
      cardsResult
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, username, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('transactions').select('id, amount, type, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('categories').select('id, name, type, created_at'),
      supabaseAdmin.from('cards').select('id, name, type, created_at')
    ])

    // Verificar se há erros nas consultas

    if (usersResult.error || transactionsResult.error || categoriesResult.error || cardsResult.error) {
      return NextResponse.json({ error: 'Erro ao buscar dados do sistema' }, { status: 500 })
    }

    // Calcular estatísticas
    const totalUsers = usersResult.data?.length || 0
    const totalTransactions = transactionsResult.data?.length || 0
    const totalCategories = categoriesResult.data?.length || 0
    const totalCards = cardsResult.data?.length || 0

    const totalRevenue = transactionsResult.data
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) || 0

    const totalExpenses = transactionsResult.data
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) || 0

    // Usuários recentes (últimos 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentUsers = usersResult.data?.filter(u => u.created_at > sevenDaysAgo).length || 0

    // Transações recentes (últimos 7 dias)
    const recentTransactions = transactionsResult.data?.filter(t => t.created_at > sevenDaysAgo).length || 0

    const stats = {
      users: {
        total: totalUsers,
        recent: recentUsers,
        growth: totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0
      },
      transactions: {
        total: totalTransactions,
        recent: recentTransactions,
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses
      },
      categories: {
        total: totalCategories,
        income: categoriesResult.data?.filter(c => c.type === 'income').length || 0,
        expense: categoriesResult.data?.filter(c => c.type === 'expense').length || 0
      },
      cards: {
        total: totalCards,
        credit: cardsResult.data?.filter(c => c.type === 'credit').length || 0,
        debit: cardsResult.data?.filter(c => c.type === 'debit').length || 0,
        cash: cardsResult.data?.filter(c => c.type === 'cash').length || 0
      },
      system: {
        status: 'online',
        lastUpdate: new Date().toISOString(),
        version: '1.0.0'
      }
    }



    return NextResponse.json({
      success: true,
      stats,
      adminUser: {
        email: user.email,
        name: user.user_metadata?.name || 'Admin',
        lastLogin: new Date().toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}