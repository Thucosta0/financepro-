'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, Info, Linkedin, Github, ExternalLink, RotateCcw } from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [userEmailToVerify, setUserEmailToVerify] = useState('')
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    
    const result = await login(formData.emailOrUsername, formData.password)
    
    if (result.success) {
      setFeedback({ type: 'success', message: 'Login realizado com sucesso!' })
      // Aguardar um pouco para mostrar a mensagem de sucesso
      setTimeout(async () => {
        // Verificar se é um usuário novo ou existente
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            // Verificar se o usuário tem dados existentes (transações, categorias, cartões)
            const [transactionsResult, categoriesResult, cardsResult] = await Promise.all([
              supabase.from('transactions').select('id').eq('user_id', user.id).limit(1),
              supabase.from('categories').select('id').eq('user_id', user.id).limit(1),
              supabase.from('cards').select('id').eq('user_id', user.id).limit(1)
            ])
            
            const hasTransactions = transactionsResult.data && transactionsResult.data.length > 0
            const hasCategories = categoriesResult.data && categoriesResult.data.length > 0
            const hasCards = cardsResult.data && cardsResult.data.length > 0
            
            // Se não tem nenhum dado, é provável que seja um usuário novo
            if (!hasTransactions && !hasCategories && !hasCards) {
              // Marcar que é um novo usuário para mostrar boas-vindas especiais
              sessionStorage.setItem('fromLogin', 'newUser')
              router.push('/planos')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Fallback se não conseguir verificar
            router.push('/dashboard')
          }
        } catch (error) {
          // Silenciar erro de verificação de dados
          // Em caso de erro, redirecionar para dashboard
          router.push('/dashboard')
        }
      }, 1500)
    } else {
      setFeedback({ type: 'error', message: result.message || 'Erro ao fazer login' })
      
      // Detectar se é erro de email não confirmado
      if (result.message?.includes('confirmar seu email') || result.message?.includes('not confirmed')) {
        setShowResendVerification(true)
        // Detectar se o input é um email ou username
        if (formData.emailOrUsername.includes('@')) {
          setUserEmailToVerify(formData.emailOrUsername)
        } else {
          // Se for username, vamos usar o email do contexto de erro ou deixar vazio
          setUserEmailToVerify('')
        }
      }
    }
  }

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    setFeedback(null)

    let emailToUse = userEmailToVerify

    // Se não temos email definido, pedir ao usuário
    if (!emailToUse) {
      const inputEmail = prompt('Digite seu email para reenviar a confirmação:')
      if (!inputEmail || !inputEmail.includes('@')) {
        setFeedback({ type: 'error', message: 'Email inválido ou cancelado.' })
        setIsResendingVerification(false)
        return
      }
      emailToUse = inputEmail
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse
      })

      if (error) {
        // Silenciar erro de reenvio de email
        setFeedback({ type: 'error', message: 'Erro ao reenviar email. Tente novamente.' })
      } else {
        setFeedback({ type: 'success', message: 'Email de confirmação reenviado! Verifique sua caixa de entrada.' })
        setShowResendVerification(false)
      }
    } catch (error) {
      // Silenciar erro de reenvio de email
      setFeedback({ type: 'error', message: 'Erro ao reenviar email. Tente novamente.' })
    } finally {
      setIsResendingVerification(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setIsResetting(true)

    if (!resetEmail) {
      setFeedback({ type: 'error', message: 'Por favor, digite seu email!' })
      setIsResetting(false)
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetEmail)) {
      setFeedback({ type: 'error', message: 'Por favor, digite um email válido!' })
      setIsResetting(false)
      return
    }

    try {
      // URL completa para redirect
      const redirectUrl = `${window.location.origin}/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl
      })

      if (error) {
        // Silenciar erro de envio de reset
        setFeedback({ type: 'error', message: 'Erro ao enviar email de recuperação. Tente novamente.' })
      } else {
        setFeedback({ 
          type: 'success', 
          message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
        })
        setTimeout(() => {
          setIsResetMode(false)
          setResetEmail('')
          setFeedback(null)
        }, 3000)
      }
    } catch (error) {
      // Silenciar erro de reset de senha
      setFeedback({ type: 'error', message: 'Erro ao enviar email de recuperação. Tente novamente.' })
    } finally {
      setIsResetting(false)
    }
  }

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
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-down {
          animation: slideDown 0.4s ease-out;
        }
        
        .animate-bounce-subtle {
          animation: bounceSubtle 2s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fadeInUp 0.4s ease-out;
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
        
        .delay-700 {
          animation-delay: 0.7s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white bg-opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white bg-opacity-5 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white bg-opacity-5 rounded-full animate-pulse delay-1000"></div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        <div className="relative w-full max-w-md animate-fade-in-up">
          {/* Back to landing */}
          <Link 
            href="/"
            className="inline-flex items-center text-white hover:text-blue-200 transition-all duration-300 hover:translate-x-1 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Voltar ao início
          </Link>

          <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95 transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 hover:scale-110 hover:rotate-3 shadow-lg hover:shadow-xl animate-bounce-subtle">
                <span className="text-2xl font-bold text-white animate-pulse">₿</span>
              </div>
              <div className="transition-all duration-500 ease-in-out">
                {isResetMode ? (
                  <div className="animate-slide-in-right">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">Recuperar senha</h1>
                    <p className="text-gray-600 animate-fade-in delay-100">Digite seu email para receber as instruções</p>
                  </div>
                ) : (
                  <div className="animate-slide-in-left">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">Bem-vindo de volta!</h1>
                    <p className="text-gray-600 animate-fade-in delay-100">Acesse sua conta do FinancePRO</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info sobre login por username ou reset */}
            <div className="transition-all duration-500 ease-in-out">
              {!isResetMode ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in transform hover:scale-[1.02] transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0 animate-bounce-subtle" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Login com nome de usuário</p>
                      <p className="text-blue-700">
                        Você pode fazer login com seu <strong>email</strong> ou <strong>nome de usuário</strong>. 
                        Se ainda não configurou um nome de usuário, use apenas o email.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 animate-fade-in transform hover:scale-[1.02] transition-all duration-300 hover:shadow-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0 animate-bounce-subtle" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Como funciona a recuperação</p>
                      <p className="text-amber-700">
                        Enviaremos um email com um link seguro para redefinir sua senha. 
                        Verifique também sua caixa de spam.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`mb-4 p-4 rounded-lg flex items-center animate-slide-down transform transition-all duration-500 hover:scale-[1.02] ${
                feedback.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200 shadow-green-100' 
                  : 'bg-red-50 text-red-800 border border-red-200 shadow-red-100'
              } shadow-lg`}>
                {feedback.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 animate-bounce" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 animate-pulse" />
                )}
                <span className="text-sm animate-fade-in">{feedback.message}</span>
              </div>
            )}

            {/* Botão para reenviar verificação de email */}
            {showResendVerification && !isResetMode && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-slide-down">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0 animate-bounce-subtle" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">
                      Precisa confirmar seu email?
                    </h3>
                    <p className="text-xs text-blue-700 mb-3">
                      Reenvie o email de confirmação para ativar sua conta.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      {isResendingVerification ? (
                        <>
                          <RotateCcw className="h-3 w-3 mr-2 animate-spin" />
                          Reenviando...
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3 mr-2" />
                          Reenviar confirmação
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="animate-fade-in delay-200">
              {!isResetMode ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="animate-slide-up delay-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2 transition-all duration-300">
                      Email ou Nome de usuário
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                      <input
                        type="text"
                        required
                        value={formData.emailOrUsername}
                        onChange={(e) => setFormData({...formData, emailOrUsername: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 focus:scale-[1.02] bg-white hover:bg-blue-50/30 focus:bg-blue-50/50"
                        placeholder="email@exemplo.com ou @seu_usuario"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="animate-slide-up delay-400">
                    <label className="block text-sm font-medium text-gray-700 mb-2 transition-all duration-300">
                      Senha
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 focus:scale-[1.02] bg-white hover:bg-blue-50/30 focus:bg-blue-50/50"
                        placeholder="Sua senha"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between animate-slide-up delay-500">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" disabled={isLoading} />
                      <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true)
                        setFeedback(null)
                        setShowResendVerification(false)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-all duration-300 hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <div className="animate-slide-up delay-600">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Entrando...
                        </div>
                      ) : (
                        'Entrar na minha conta'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div className="animate-slide-up delay-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email da conta
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 focus:scale-[1.02] bg-white hover:bg-blue-50/30 focus:bg-blue-50/50"
                        placeholder="email@exemplo.com"
                        disabled={isResetting}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Digite o email associado à sua conta do FinancePRO
                    </p>
                  </div>

                  <div className="flex space-x-3 animate-slide-up delay-400">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false)
                        setResetEmail('')
                        setFeedback(null)
                        setShowResendVerification(false)
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02]"
                      disabled={isResetting}
                    >
                      Voltar
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    >
                      {isResetting ? (
                        <div className="flex items-center justify-center">
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        'Enviar instruções'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center animate-fade-in delay-700">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link href="/cadastro" className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 hover:underline">
                  Criar conta gratuita
                </Link>
              </p>
            </div>

            {/* Links Sociais */}
            <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in delay-700">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Conecte-se comigo</p>
              </div>
              <div className="flex justify-center items-center gap-4">
                <a
                  href="https://www.linkedin.com/in/thucosta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium group shadow-sm hover:shadow-md transform hover:scale-105"
                  title="Conectar no LinkedIn"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
                
                <a
                  href="https://github.com/thucosta0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all duration-300 text-sm font-medium group shadow-sm hover:shadow-md transform hover:scale-105"
                  title="Ver repositórios no GitHub"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                  <ExternalLink className="h-3 w-3 ml-1 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-center animate-fade-in delay-700">
              <p className="text-xs text-gray-500">
                Seus dados estão protegidos com criptografia de ponta 🔒
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}