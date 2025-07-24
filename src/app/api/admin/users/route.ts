import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
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
    
    // Buscar os perfis com todos os campos necessários usando client admin
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        email,
        username,
        created_at,
        updated_at,
        is_premium,
        premium_until
      `)
      .order('created_at', { ascending: false })

    if (profilesError) {
      return NextResponse.json({ error: 'Erro ao buscar usuários', details: profilesError }, { status: 500 })
    }

    // Buscar informações adicionais da tabela auth.users usando client admin
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    


    // Combinar dados de profiles e auth.users
    const usersWithAuthInfo = profiles?.map(profile => {
      const authUser = authUsers?.users?.find(au => au.id === profile.id)
      return {
        ...profile,
        email_confirmed_at: authUser?.email_confirmed_at || profile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        is_premium: profile.is_premium || false,
        premium_until: profile.premium_until
      }
    }) || []

    return NextResponse.json({
      success: true,
      users: usersWithAuthInfo,
      total: usersWithAuthInfo.length
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

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

    // Buscar usuário específico por email
    const { data: authUsers, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    const targetUser = authUsers.users.find(u => u.email === email.trim())
    
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar perfil do usuário
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, created_at')
      .eq('id', targetUser.id)
      .single()

    // Buscar estatísticas de transações
    const { data: stats } = await supabaseAdmin
      .from('transactions')
      .select('type, amount')
      .eq('user_id', targetUser.id)

    const transactionStats = {
      total: stats?.length || 0,
      receitas: stats?.filter(t => t.type === 'income').length || 0,
      despesas: stats?.filter(t => t.type === 'expense').length || 0,
      valorReceitas: stats?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
      valorDespesas: stats?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
    }

    const userData = {
      id: targetUser.id,
      email: targetUser.email,
      username: userProfile?.username || targetUser.user_metadata?.username || 'Não definido',
      created_at: userProfile?.created_at || targetUser.created_at,
      stats: transactionStats
    }

    return NextResponse.json({ user: userData })
    
  } catch (error) {
    console.error('Erro na busca de usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}