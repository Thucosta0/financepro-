import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe não configurado. Configure as chaves de API.' },
        { status: 500 }
      )
    }

    const { priceId, userId, successUrl, cancelUrl } = await req.json()

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Price ID e User ID são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar se o priceId não é um placeholder
    if (priceId.includes('COLE_AQUI') || priceId === 'price_test' || priceId.length < 10) {
      return NextResponse.json(
        { error: 'Price ID do Stripe não configurado corretamente. Verifique as variáveis de ambiente.' },
        { status: 500 }
      )
    }

    // Buscar o usuário no Supabase
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe um customer no Stripe
    let customerId: string | undefined
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id
    } else {
      // Criar novo customer no Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: userId
        }
      })
      customerId = customer.id

      // Salvar customer ID no banco
      await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId
        })
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/planos?payment=canceled`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}