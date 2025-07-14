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
    console.log('🔍 Verificando admin:', { 
      userEmail: user.email, 
      adminEmail: ADMIN_EMAIL,
      isMatch: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() 
    })
    
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Acesso negado - apenas administradores' }, { status: 403 })
    }

    // Buscar usuários do sistema com informações de premium
    console.log('🔍 Admin buscando usuários:', user.email)
    
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

    console.log('📊 Resultado da busca profiles:', { 
      profiles: profiles?.length || 0, 
      profilesError,
      sampleProfile: profiles?.[0] || null 
    })

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError)
      return NextResponse.json({ error: 'Erro ao buscar usuários', details: profilesError }, { status: 500 })
    }

    // Buscar informações adicionais da tabela auth.users usando client admin
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers()
    
    console.log('📊 Resultado da busca auth.users via admin API:', { 
      users: authUsers?.users?.length || 0, 
      authUsersError 
    })

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
    console.error('Erro na API de usuários admin:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}