import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Email do administrador
const ADMIN_EMAIL = 'arthurcos33@gmail.com'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    // Verificar se o usuário existe usando client admin
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar email do usuário na tabela auth.users
    const { data: authUser } = await supabaseAdmin
      .from('auth.users')
      .select('email')
      .eq('id', userId)
      .single()

    const userEmail = authUser?.email || ''

    // Não permitir ação no próprio admin
    if (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Não é possível executar ações no administrador' }, { status: 403 })
    }

    let result
    let message

    switch (action) {
      case 'grant_premium':
        // Conceder acesso premium gratuito
        const premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
        
        console.log('🔄 Tentando conceder premium para:', {
          userId,
          targetUser: userEmail,
          premiumUntil: premiumUntil.toISOString()
        })
        
        const { data: updateData, error: grantError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_premium: true,
            premium_until: premiumUntil.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()

        console.log('📊 Resultado do update:', { updateData, grantError })

        if (grantError) {
          console.error('❌ Erro ao conceder premium:', grantError)
          return NextResponse.json({ error: 'Erro ao conceder premium', details: grantError }, { status: 500 })
        }

        if (!updateData || updateData.length === 0) {
          console.error('⚠️ Nenhuma linha foi atualizada. Usuário não encontrado ou sem permissão.')
          return NextResponse.json({ error: 'Usuário não encontrado ou sem permissão para atualizar' }, { status: 404 })
        }

        console.log('✅ Premium concedido com sucesso!')
        result = { premium: true, until: premiumUntil.toISOString() }
        message = `Usuário ${targetUser.username} recebeu acesso premium gratuito por 1 ano`
        break

      case 'revoke_premium':
        // Remover acesso premium
        console.log('🔄 Tentando remover premium de:', {
          userId,
          targetUser: userEmail
        })
        
        const { data: revokeData, error: revokeError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_premium: false,
            premium_until: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()

        console.log('📊 Resultado da remoção:', { revokeData, revokeError })

        if (revokeError) {
          console.error('❌ Erro ao remover premium:', revokeError)
          return NextResponse.json({ error: 'Erro ao remover premium', details: revokeError }, { status: 500 })
        }

        if (!revokeData || revokeData.length === 0) {
          console.error('⚠️ Nenhuma linha foi atualizada na remoção. Usuário não encontrado.')
          return NextResponse.json({ error: 'Usuário não encontrado para remoção de premium' }, { status: 404 })
        }

        console.log('✅ Premium removido com sucesso!')
        result = { premium: false }
        message = `Acesso premium removido do usuário ${targetUser.username}`
        break

      default:
        return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 })
    }

    // Log da ação administrativa
    console.log(`Admin ${user.email} executou ação "${action}" no usuário ${userEmail}`)

    return NextResponse.json({
      success: true,
      message,
      result,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: userEmail
      }
    })

  } catch (error) {
    console.error('Erro na API de ações de usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 