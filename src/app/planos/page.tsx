'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { PLANS, formatPrice, getStripe } from '@/lib/stripe'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Crown, Zap, Star, TrendingUp, Shield, Sparkles, Users, ArrowRight, Calendar, AlertCircle } from 'lucide-react'

// Componente que usa useSearchParams
function PlanosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { subscription, getStatusText, isInTrial, isPro, getTrialDaysRemaining, isTrialExpired, loading } = useSubscription()
  const [loadingState, setLoadingState] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  // Detectar se é um novo usuário
  useEffect(() => {
    // Verificar se veio de login (novos usuários)
    const fromLogin = sessionStorage.getItem('fromLogin')
    if (fromLogin) {
      setIsNewUser(true)
      sessionStorage.removeItem('fromLogin') // Limpar após usar
    }
  }, [])

  const handleUpgrade = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    // Verificar se Stripe está configurado
    const stripe = await getStripe()
    
    if (!stripe) {
      console.error('❌ Stripe não configurado')
      alert('Sistema de pagamentos não configurado. Entre em contato com o suporte.')
      return
    }

    try {
      setLoadingState('pro')

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: PLANS.PRO.stripePriceId,
          userId: user.id,
          successUrl: `${window.location.origin}/dashboard?upgrade=success`,
          cancelUrl: `${window.location.origin}/planos?upgrade=canceled`,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        console.error('Erro ao criar sessão:', error)
        alert('Erro ao processar pagamento. Tente novamente.')
        return
      }

      const stripe = await getStripe()
      if (stripe) {
        const { error: stripeError } = await (stripe as any).redirectToCheckout({ sessionId })
        if (stripeError) {
          console.error('Erro do Stripe:', stripeError)
          alert('Erro ao redirecionar para pagamento.')
        }
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setLoadingState(null)
    }
  }

  const handleStartTrial = () => {
    // Marcar que começou o trial e ir para dashboard
    router.push('/dashboard')
  }

  // ===== DADOS SEMPRE GARANTIDOS =====
  // Em caso de qualquer problema, sempre mostrar dados válidos
  
  // Calcular dados baseados no subscription ou fallbacks
  const diasTrialRestantes = (() => {
    if (subscription && isInTrial()) {
      return getTrialDaysRemaining()
    }
    if (subscription && isTrialExpired()) {
      return 0
    }
    // Fallback: 30 dias para novos usuários
    return 30
  })()

  const statusAtual = (() => {
    if (subscription && isPro()) {
      return 'Plano PRO ativo'
    }
    if (subscription && isInTrial()) {
      return `🎉 Trial ativo - ${diasTrialRestantes} dias restantes`
    }
    if (subscription && isTrialExpired()) {
      return 'Trial expirado - Upgrade necessário'
    }
    // Fallback
    return 'Pronto para começar trial de 30 dias'
  })()

  const trialExpirou = subscription ? isTrialExpired() : false
  const emTrial = subscription ? isInTrial() : false
  const planoPro = subscription ? isPro() : false

  // Informações do card de trial
  const trialInfo = (() => {
    if (trialExpirou) {
      return {
        badge: '🚨 TRIAL EXPIRADO',
        description: 'Período gratuito de 30 dias terminado',
        buttonText: 'Trial Expirado',
        disabled: true,
        color: 'red'
      }
    }
    
    if (emTrial) {
      return {
        badge: `🎉 TRIAL ATIVO - ${diasTrialRestantes} DIAS RESTANTES`,
        description: `Acesso completo por mais ${diasTrialRestantes} dias`,
        buttonText: 'Continuar Trial',
        disabled: false,
        color: 'green'
      }
    }
    
    // Padrão para novos usuários
    return {
      badge: '✨ TRIAL DISPONÍVEL - 30 DIAS GRÁTIS',
      description: 'Acesso completo e gratuito por 30 dias',
      buttonText: 'Começar Trial Gratuito',
      disabled: false,
      color: 'blue'
    }
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Seção especial para novos usuários */}
        {isNewUser && (
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 mb-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">
                  🎉 Bem-vindo ao FinancePRO!
                </h2>
                <p className="text-xl text-blue-100 mb-6">
                  Parabéns! Sua conta foi criada com sucesso.<br />
                  <strong>Aproveite 30 dias COMPLETOS e GRATUITOS</strong> de acesso a todas as funcionalidades!
                </p>
                
                <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-3">✨ Você tem acesso completo a:</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-left">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-300" />
                      <span>Transações ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-300" />
                      <span>Categorias personalizadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-300" />
                      <span>Múltiplos cartões e contas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-300" />
                      <span>Relatórios avançados</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={handleStartTrial}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-3 text-lg"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Começar Meu Trial Gratuito
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3"
                    onClick={() => setIsNewUser(false)}
                  >
                    Ver Detalhes dos Planos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Escolha o Plano Ideal para Você
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Gerencie suas finanças com ferramentas profissionais
          </p>

          {/* Status atual - sempre mostrar */}
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-lg mb-6">
            <div className={`w-3 h-3 rounded-full ${
              planoPro ? 'bg-blue-500' : emTrial ? 'bg-green-500' : 'bg-orange-500'
            }`} />
            <span className="font-medium text-gray-700">
              {statusAtual}
            </span>
          </div>

          {/* Banner informativo */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <div className="text-center">
                <h3 className="font-bold text-gray-800">
                  30 Dias Grátis - Acesso Completo Garantido
                </h3>
                <p className="text-gray-600 text-sm">
                  {emTrial 
                    ? `Você ainda tem ${diasTrialRestantes} dias de trial restantes com acesso total!`
                    : trialExpirou
                    ? 'Seu trial expirou. Faça upgrade para continuar usando todas as funcionalidades.'
                    : 'Teste gratuitamente por 30 dias todas as funcionalidades premium.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cards dos Planos */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plano FREE/TRIAL */}
          <Card className={`relative p-8 bg-white shadow-xl border-2 ${
            trialExpirou ? 'border-red-200 opacity-75' : 'border-green-200'
          }`}>
            <div className="absolute top-4 right-4">
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                trialExpirou 
                  ? 'bg-red-100 text-red-800' 
                  : emTrial
                  ? 'bg-green-100 text-green-800 animate-pulse'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {trialInfo.badge}
              </div>
            </div>

            <div className="text-center mb-6">
              <Zap className={`w-12 h-12 mx-auto mb-4 ${
                trialExpirou ? 'text-gray-400' : 'text-green-500'
              }`} />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Trial Completo - 30 Dias
              </h3>
              <p className="text-gray-600 mb-4">
                {trialInfo.description}
              </p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">
                  Grátis
                </span>
                <span className="text-gray-500 ml-2">por 30 dias</span>
              </div>

              {/* Status específico do trial */}
              {emTrial && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-green-800 text-sm">
                    🎉 <strong>TRIAL ATIVO!</strong><br />
                    ✨ Acesso completo • <strong>{diasTrialRestantes} dias restantes</strong>
                  </p>
                </div>
              )}

              {trialExpirou && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">
                    🚨 <strong>TRIAL EXPIRADO</strong><br />
                    Faça upgrade para continuar usando
                  </p>
                </div>
              )}

              {!emTrial && !trialExpirou && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-blue-800 text-sm">
                    🚀 <strong>30 DIAS GRATUITOS</strong><br />
                    ✨ Teste todas as funcionalidades sem limitações
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {[
                '🎉 ACESSO COMPLETO por 30 dias',
                '💰 Transações ilimitadas',
                '🏷️ Categorias ilimitadas',
                '💳 Cartões e contas ilimitados',
                '📊 Todos os relatórios e gráficos',
                '🎯 Orçamentos inteligentes',
      
                '✨ Experiência Premium completa'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className={`w-5 h-5 flex-shrink-0 ${
                    trialExpirou ? 'text-gray-400' : 'text-green-500'
                  }`} />
                  <span className={trialExpirou ? 'text-gray-500' : 'text-gray-700'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button 
              onClick={handleStartTrial}
              disabled={trialInfo.disabled}
              className={`w-full font-bold py-3 ${
                trialExpirou
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : emTrial
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {trialExpirou && <AlertCircle className="w-5 h-5 mr-2" />}
              {!trialExpirou && <ArrowRight className="w-5 h-5 mr-2" />}
              {trialInfo.buttonText}
            </Button>
          </Card>

          {/* Plano PRO */}
          <Card className="relative p-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl border-2 border-purple-500 transform scale-105">
            <div className="absolute top-4 right-4">
              <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                <Crown className="w-4 h-4" />
                Mais Popular
              </div>
            </div>

            <div className="text-center mb-6">
              <Star className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">FinancePRO Premium</h3>
              <p className="text-purple-100 mb-4">Acesso ilimitado a todas as funcionalidades</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {formatPrice(17.00)}
                </span>
                <span className="text-purple-200 ml-2">por mês</span>
              </div>

              {planoPro && (
                <div className="bg-green-500/20 border border-green-400 rounded-lg p-3 mb-4">
                  <p className="text-green-100 text-sm">
                    ✅ <strong>PLANO ATIVO!</strong><br />
                    Aproveite todos os recursos premium
                  </p>
                </div>
              )}

              {!planoPro && (
                <div className="bg-yellow-400/20 border border-yellow-400 rounded-lg p-3 mb-4">
                  <p className="text-yellow-100 text-sm">
                    ⚡ <strong>UPGRADE PREMIUM</strong><br />
                    Acesso ilimitado para sempre
                  </p>
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Transações ilimitadas',
                'Categorias personalizadas ilimitadas',
                'Cartões e contas ilimitados',
                'Relatórios e gráficos avançados',
                'Análises financeiras profissionais',
                'Exportação de dados (Excel, PDF)',
      
                'Orçamentos inteligentes',
                'Suporte prioritário via chat',
                'ThFinanceAI'
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </li>
              ))}
            </ul>

            {planoPro ? (
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3"
                disabled
              >
                ✅ Plano Ativo
              </Button>
            ) : (
              <Button 
                onClick={handleUpgrade}
                disabled={loadingState === 'pro'}
                className="w-full bg-white text-purple-700 hover:bg-gray-100 font-bold py-3"
              >
                {loadingState === 'pro' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Fazer Upgrade - {formatPrice(17.00)}/mês
                  </div>
                )}
              </Button>
            )}
          </Card>
        </div>

        {/* Resumo comparativo */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Comparação de Planos
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl mx-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Funcionalidade</th>
                    <th className="text-center py-3 px-4">Trial (30 dias)</th>
                    <th className="text-center py-3 px-4">PRO ({formatPrice(17.00)}/mês)</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-3 px-4">Transações</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Ilimitadas</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Ilimitadas</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Categorias</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Ilimitadas</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Ilimitadas</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Cartões/Contas</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Ilimitados</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Ilimitados</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Relatórios</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Todos</td>
                    <td className="text-center py-3 px-4 text-green-600">✅ Todos</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4">Suporte</td>
                    <td className="text-center py-3 px-4 text-yellow-600">📧 Email</td>
                    <td className="text-center py-3 px-4 text-green-600">💬 Prioritário</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Duração</td>
                    <td className="text-center py-3 px-4 text-blue-600">
                      1 mês grátis
                    </td>
                    <td className="text-center py-3 px-4 text-purple-600">♾️ Para sempre</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4">Dúvidas Frequentes</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">📱 Posso cancelar a qualquer momento?</h4>
                <p className="text-gray-600 text-sm">Sim! Sem taxas de cancelamento ou multas.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">💳 Quais formas de pagamento?</h4>
                <p className="text-gray-600 text-sm">Cartão de crédito, débito e PIX via Stripe.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🔄 Como funciona o upgrade?</h4>
                <p className="text-gray-600 text-sm">Instantâneo! Recursos liberados imediatamente.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">💰 O trial é realmente grátis?</h4>
                <p className="text-gray-600 text-sm">Sim! 30 dias completos sem cobrança ou cartão.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal com Suspense boundary
export default function PlanosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando planos...</p>
        </div>
      </div>
    }>
      <PlanosContent />
    </Suspense>
  )
} 