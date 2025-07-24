'use client'

import { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, AtSign, Linkedin, Github, ExternalLink, MailCheck, RotateCcw, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UsernameInput } from '@/components/ui/username-input'

export default function CadastroPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const { register, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    // Validações do cliente
    if (formData.password !== formData.confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas não coincidem!' })
      return
    }

    if (formData.password.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres!' })
      return
    }

    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Nome é obrigatório!' })
      return
    }

    if (!formData.username.trim()) {
      setFeedback({ type: 'error', message: 'Nome de usuário é obrigatório!' })
      return
    }

    if (formData.username.length < 3) {
      setFeedback({ type: 'error', message: 'Nome de usuário deve ter pelo menos 3 caracteres!' })
      return
    }

    // Verificar se username tem apenas caracteres válidos
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setFeedback({ type: 'error', message: 'Nome de usuário deve conter apenas letras, números e underscore!' })
      return
    }

    // Tentar criar a conta
    const result = await register(formData.name, formData.username, formData.email, formData.password)
    
    if (result.success) {
      // Salvar email e mostrar tela de verificação
      setUserEmail(formData.email)
      setShowEmailVerification(true)
      setFeedback({ type: 'success', message: 'Conta criada! Verifique seu email para continuar.' })
    } else {
      setFeedback({ type: 'error', message: result.message || 'Erro ao criar conta' })
    }
  }

  const handleResendEmail = async () => {
    setIsResendingEmail(true)
    setFeedback(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })

      if (error) {
        // Silenciar erro de reenvio de email
        setFeedback({ type: 'error', message: 'Erro ao reenviar email. Tente novamente.' })
      } else {
        setFeedback({ type: 'success', message: 'Email reenviado! Verifique sua caixa de entrada.' })
      }
    } catch (error) {
      // Silenciar erro de reenvio de email
      setFeedback({ type: 'error', message: 'Erro ao reenviar email. Tente novamente.' })
    } finally {
      setIsResendingEmail(false)
    }
  }

  // Tela de verificação de email
  if (showEmailVerification) {
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
          
          .delay-700 {
            animation-delay: 0.7s;
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
            {/* Back to login */}
            <Link 
              href="/login"
              className="inline-flex items-center text-white hover:text-blue-200 transition-all duration-300 hover:translate-x-1 mb-8 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              Ir para login
            </Link>

            <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95 transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform transition-all duration-500 hover:scale-110 hover:rotate-3 shadow-lg hover:shadow-xl animate-bounce-subtle">
                  <MailCheck className="h-8 w-8 text-white animate-pulse" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">Verifique seu email</h1>
                <p className="text-gray-600 animate-fade-in delay-100">Sua conta foi criada com sucesso!</p>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`mb-6 p-4 rounded-lg flex items-center animate-slide-down transform transition-all duration-500 hover:scale-[1.02] ${
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

              {/* Instruções */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 animate-fade-in transform hover:scale-[1.02] transition-all duration-300 hover:shadow-md">
                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0 animate-bounce-subtle" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Próximo passo:
                    </h3>
                    <p className="text-blue-800 mb-3">
                      Enviamos um email de confirmação para:
                    </p>
                    <p className="font-medium text-blue-900 bg-blue-100 px-3 py-2 rounded-lg break-all transition-all duration-300 hover:bg-blue-200">
                      {userEmail}
                    </p>
                    <p className="text-blue-700 mt-3 text-sm">
                      Clique no link do email para ativar sua conta e fazer login.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dicas */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 animate-fade-in delay-200 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-md">
                <h4 className="text-sm font-medium text-amber-800 mb-2">💡 Dicas importantes:</h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• Verifique sua caixa de spam ou lixo eletrônico</li>
                  <li>• O email pode demorar alguns minutos para chegar</li>
                  <li>• Você precisa confirmar o email antes de fazer login</li>
                  <li>• O link de verificação é válido por 24 horas</li>
                </ul>
              </div>

              {/* Botões de ação */}
              <div className="space-y-4 animate-fade-in delay-300">
                <button
                  onClick={handleResendEmail}
                  disabled={isResendingEmail}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                >
                  {isResendingEmail ? (
                    <div className="flex items-center justify-center">
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Reenviando...
                    </div>
                  ) : (
                    'Reenviar email de confirmação'
                  )}
                </button>

                <Link
                  href="/login"
                  className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300 text-center transform hover:scale-[1.02]"
                >
                  Ir para página de login
                </Link>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center animate-fade-in delay-300">
                <p className="text-xs text-gray-500">
                  Ainda com problemas? Entre em contato conosco 📧
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
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
        
        .delay-800 {
          animation-delay: 0.8s;
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fade-in">Criar sua conta</h1>
              <p className="text-gray-600 animate-fade-in delay-100">Comece sua jornada financeira hoje mesmo</p>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className={`mb-6 p-4 rounded-lg flex items-center animate-slide-down transform transition-all duration-500 hover:scale-[1.02] ${
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

            {/* Form */}
            <div className="animate-fade-in delay-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-slide-up delay-300">
                  <label className="block text-sm font-medium text-gray-700 mb-2 transition-all duration-300">
                    Nome completo
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 focus:scale-[1.02] bg-white hover:bg-blue-50/30 focus:bg-blue-50/50"
                      placeholder="Seu nome completo"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="mb-4">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome de usuário
                  </label>
                  <UsernameInput
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="seu_username"
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Permite login alternativo. Apenas letras, números e underscore.
                  </p>
                </div>

                <div className="animate-slide-up delay-500">
                  <label className="block text-sm font-medium text-gray-700 mb-2 transition-all duration-300">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 focus:scale-[1.02] bg-white hover:bg-blue-50/30 focus:bg-blue-50/50"
                      placeholder="seu@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="animate-slide-up delay-600">
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
                      placeholder="Mínimo 6 caracteres"
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

                <div className="animate-slide-up delay-700">
                  <label className="block text-sm font-medium text-gray-700 mb-2 transition-all duration-300">
                    Confirmar senha
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500 group-focus-within:scale-110" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 focus:scale-[1.02] bg-white hover:bg-blue-50/30 focus:bg-blue-50/50"
                      placeholder="Confirme sua senha"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="animate-slide-up delay-800">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Criando conta...
                      </div>
                    ) : (
                      'Criar minha conta'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center animate-fade-in delay-700">
              <p className="text-gray-600">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 hover:underline">
                  Fazer login
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

            <div className="mt-6 pt-4 border-t border-gray-100 animate-fade-in delay-700">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Ao criar uma conta, você concorda com nossos{' '}
                <a href="#" className="text-blue-600 hover:underline transition-all duration-300">Termos de Uso</a>
                {' '}e{' '}
                <a href="#" className="text-blue-600 hover:underline transition-all duration-300">Política de Privacidade</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}