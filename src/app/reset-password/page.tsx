'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Eye, EyeOff, Lock, ArrowLeft, AlertCircle, CheckCircle, Shield } from 'lucide-react'

export default function ResetPasswordPage() {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    // Só executar no lado cliente
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setUrlParams(params)
      
      // Verificar se temos um token válido na URL
      const checkToken = async () => {
        // Verificar diferentes formatos de URL que o Supabase pode enviar
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const tokenHash = params.get('token_hash') || params.get('token')
        const type = params.get('type')
        const code = params.get('code')

        // Método 1: Usar exchangeCodeForSession se temos um code
        if (code) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            
            if (error) {
              // Silenciar erro de troca de código
            } else {
              setIsValidToken(true)
              return
            }
          } catch (error) {
            // Silenciar erro de troca de código
          }
        }

        // Método 2: Tentar com access_token e refresh_token (formato padrão)
        if (accessToken && refreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })

            if (error) {
              // Silenciar erro de configuração de sessão
            } else {
              setIsValidToken(true)
              return
            }
          } catch (error) {
            // Silenciar erro de sessão com token
          }
        }

        // Método 3: Tentar com token_hash (formato de recuperação)
        if (tokenHash && type === 'recovery') {
          try {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            })

            if (error) {
              // Silenciar erro de verificação OTP
            } else {
              setIsValidToken(true)
              return
            }
          } catch (error) {
            // Silenciar erro de verificação OTP
          }
        }

        // Método 4: Verificar se há uma sessão ativa
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            // Silenciar erro de obtenção de sessão
          } else if (session?.user) {
            setIsValidToken(true)
            return
          }
        } catch (error) {
          // Silenciar erro de verificação de sessão
        }

        // Se chegou até aqui, o link não é válido
        setIsValidToken(false)
      }

      checkToken()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setIsLoading(true)

    // Validações
    if (!passwords.newPassword) {
      setFeedback({ type: 'error', message: 'Nova senha é obrigatória!' })
      setIsLoading(false)
      return
    }

    if (passwords.newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres!' })
      setIsLoading(false)
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setFeedback({ type: 'error', message: 'As senhas não coincidem!' })
      setIsLoading(false)
      return
    }

    try {
      // Atualizar a senha do usuário
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      })

      if (error) {
        // Silenciar erro de atualização de senha
        setFeedback({ type: 'error', message: 'Erro ao redefinir senha. Tente novamente.' })
        setIsLoading(false)
        return
      }

      setFeedback({ type: 'success', message: 'Senha redefinida com sucesso!' })
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error) {
      // Silenciar erro de reset de senha
      setFeedback({ type: 'error', message: 'Erro ao redefinir senha. Tente novamente.' })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state enquanto verifica o token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  // Token inválido ou expirado
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
            <p className="text-gray-600 mb-4">
              Este link de recuperação é inválido ou já expirou.
            </p>
            
            {/* Debug info em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && urlParams && (
              <div className="bg-gray-100 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-gray-600 mb-2">Debug info:</p>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(Object.fromEntries(urlParams.entries()), null, 2)}
                </pre>
              </div>
            )}
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-amber-800 mb-2">💡 O que fazer:</h3>
              <ul className="text-xs text-amber-700 space-y-1 text-left">
                <li>• Verifique se você clicou no link mais recente</li>
                <li>• Links de recuperação expiram em 1 hora</li>
                <li>• Solicite um novo link de recuperação</li>
                <li>• Verifique se o link está completo (não cortado)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Link 
                href="/login"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                Solicitar novo link
              </Link>
              
              <Link 
                href="/"
                className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      
      <div className="relative w-full max-w-md">
        {/* Back to login */}
        <Link 
          href="/login"
          className="inline-flex items-center text-white hover:text-blue-200 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao login
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Redefinir senha</h1>
            <p className="text-gray-600">Digite sua nova senha</p>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              feedback.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              )}
              <span className="text-sm">{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Confirme sua nova senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                As senhas devem coincidir e ter pelo menos 6 caracteres.
              </p>
            </div>

            {/* Dicas de Segurança */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Dicas para uma senha segura:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use pelo menos 8 caracteres</li>
                <li>• Combine letras maiúsculas e minúsculas</li>
                <li>• Inclua números e símbolos especiais</li>
                <li>• Evite informações pessoais óbvias</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redefinindo senha...' : 'Redefinir senha'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Após redefinir, você será redirecionado para o login 🔒
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}