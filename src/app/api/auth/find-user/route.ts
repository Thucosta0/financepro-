import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: 'Username é obrigatório' }, { status: 400 })
    }

    // Buscar username na tabela profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id, 
        username,
        email
      `)
      .ilike('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Se temos email direto da tabela profiles
    if (profile.email) {
      return NextResponse.json({ 
        email: profile.email,
        user_id: profile.id
      })
    }

    return NextResponse.json({ error: 'Email do usuário não encontrado' }, { status: 404 })

  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 