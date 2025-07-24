'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, 
  CreditCard, 
  BarChart3, 
  Target, 
  Calendar, 
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface UserProfile {
  name: string
  username?: string
  email: string
}

export default function BemVindoContent() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [countdown, setCountdown] = useState(8)
  const router = useRouter()

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Verificar se usuário está logado
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Buscar perfil completo do banco
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('name, username, email')
            .eq('id', user.id)
            .single()

          if (profile && !error) {
            // Perfil encontrado no banco
            setUserProfile(profile)
            setIsLoading(false)
            return
          }
        }

        // Fallback: tentar múltiplas estratégias
        // Usuário não logado ou perfil não encontrado, usando estratégias de fallback

        // 1. Buscar nos parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search)
        const nameFromUrl = urlParams.get('name')
        
        if (nameFromUrl) {
          // Nome encontrado na URL
          setUserProfile({ 
            name: nameFromUrl, 
            email: urlParams.get('email') || 'email@exemplo.com' 
          })
          setIsLoading(false)
          return
        }

        // 2. Buscar no localStorage (múltiplas chaves)
        const nameKeys = ['welcomeUserName', 'userName', 'userFullName', 'user_name']
        let nameFromStorage = null
        
        for (const key of nameKeys) {
          const stored = localStorage.getItem(key)
          if (stored) {
            nameFromStorage = stored
            // Nome encontrado no localStorage
            break
          }
        }

        if (nameFromStorage) {
          setUserProfile({ 
            name: nameFromStorage, 
            email: localStorage.getItem('userEmail') || 'email@exemplo.com' 
          })
          setIsLoading(false)
          return
        }

        // 3. Verificar se há usuário autenticado no Supabase (sem perfil)
        if (user) {
          const emailName = user.email?.split('@')[0] || 'usuário'
          // Usuário encontrado mas sem perfil, usando email
          setUserProfile({ 
            name: emailName, 
            email: user.email || 'email@exemplo.com' 
          })
          setIsLoading(false)
          return
        }

        // 4. Fallback final amigável
        // Usando fallback final
        setUserProfile({ 
          name: 'Amigo', 
          email: 'email@exemplo.com' 
        })
        setIsLoading(false)

      } catch (error) {
         // Silenciar erro de busca de perfil
         setUserProfile({ 
           name: 'Amigo', 
           email: 'email@exemplo.com' 
        })
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Countdown para redirecionamento automático
  useEffect(() => {
    if (!isLoading && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      router.push('/login')
    }
  }, [countdown, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  const firstName = userProfile?.username || userProfile?.name?.split(' ')[0] || 'Amigo'

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounceSubtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }
        
        .animate-bounce-subtle {
          animation: bounceSubtle 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white bg-opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white bg-opacity-5 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto pt-8">
          {/* Header com boas-vindas */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl mb-6 shadow-2xl animate-bounce-subtle">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              🎉 Bem-vindo, <span className="text-yellow-300">{firstName}</span>!
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              Sua conta foi confirmada com sucesso
            </p>
            <p className="text-lg text-blue-200">
              Agora você pode fazer seu <strong>login</strong> e começar a usar o FinancePRO
            </p>
          </div>

          {/* Aviso importante */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white border-opacity-20 animate-fade-in-up delay-200">
            <div className="flex items-start">
              <Clock className="h-6 w-6 text-yellow-300 mt-1 mr-4 flex-shrink-0 animate-bounce-subtle" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Próximo passo: Fazer Login
                </h3>
                <p className="text-blue-100 mb-4">
                  Sua conta foi criada com sucesso! Para começar a usar todas as funcionalidades do FinancePRO, 
                  você precisa <strong>fazer seu login</strong> com o email e senha que você criou.
                </p>
                <div className="bg-blue-600 bg-opacity-30 rounded-lg p-3 mb-4">
                  <p className="text-blue-100 text-sm">
                    <strong>📧 Email:</strong> {userProfile?.email}
                  </p>
                  {userProfile?.username && (
                    <p className="text-blue-100 text-sm">
                      <strong>👤 Username:</strong> @{userProfile.username}
                    </p>
                  )}
                </div>
                <p className="text-blue-200 text-sm">
                  Redirecionamento automático em <strong>{countdown} segundos</strong>...
                </p>
              </div>
            </div>
          </div>

          {/* Botão destacado para entrar */}
          <div className="text-center mb-12 animate-fade-in-up delay-300">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-lg rounded-2xl hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl active:scale-95 group animate-shimmer"
            >
              Entrar na Minha Conta
              <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Grid de funcionalidades */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Card 1 - Transações */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Transações</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Registre suas receitas e despesas, organize por categorias e mantenha suas finanças sempre atualizadas.
              </p>
            </div>

            {/* Card 2 - Categorias */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Categorias</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Organize seus gastos em categorias personalizadas e visualize onde está gastando mais dinheiro.
              </p>
            </div>

            {/* Card 3 - Orçamentos */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Orçamentos</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Defina metas de gastos por categoria e acompanhe seu progresso mensalmente.
              </p>
            </div>

            {/* Card 4 - Cartões */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-400">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Cartões & Contas</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Gerencie seus cartões de crédito, débito e contas bancárias em um só lugar.
              </p>
            </div>



            {/* Card 6 - Relatórios */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20 hover:bg-opacity-15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group animate-fade-in-up delay-600">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">Dashboard</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                Visualize gráficos detalhados e insights sobre seus hábitos financeiros.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center animate-fade-in-up delay-400">
            <p className="text-blue-200 mb-4">
              Pronto para transformar sua vida financeira? 
            </p>
            <Link
              href="/login"
              className="inline-flex items-center text-white hover:text-yellow-300 transition-all duration-300 hover:translate-x-1 group"
            >
              Começar agora
              <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}