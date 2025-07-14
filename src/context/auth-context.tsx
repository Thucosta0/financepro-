'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, getCurrentUser, signIn, signUp, signOut } from '@/lib/supabase-client'
import { debugLog } from '@/lib/debug'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message?: string }>
  register: (name: string, username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastAuthCheckRef = useRef(0)

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      // Não logar erro se for apenas sessão ausente (situação normal)
      if (error && typeof error === 'object' && 'message' in error && error.message !== 'Auth session missing!') {
        console.error('Error checking auth state:', error)
      }
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Verifica o usuário inicial apenas uma vez
    checkAuthState()

    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Prevenir updates desnecessários de token refresh
        if (event === 'TOKEN_REFRESHED') {
          return
        }

        // Throttling: só processar se passou mais de 2 segundos desde a última vez
        const now = Date.now()
        if (now - lastAuthCheckRef.current < 2000) {
          return
        }
        lastAuthCheckRef.current = now

        // Verificar se a página está visível
        if (typeof document !== 'undefined' && document.hidden) {
          return
        }

        // Processar mudanças significativas
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Dependências vazias para evitar loop

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true)
      
      // Detectar se é email ou username
      const isEmail = emailOrUsername.includes('@')
      
      if (isEmail) {
        // Se for email, tentar login direto
        const result = await signIn(emailOrUsername, password)
        
        if (result.error) {
          let message = 'Erro ao fazer login'
          
          if (result.error.message.includes('Invalid login credentials')) {
            message = 'Email ou senha incorretos'
          } else if (result.error.message.includes('Email not confirmed')) {
            message = 'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada.'
          } else if (result.error.message.includes('not confirmed')) {
            message = 'Você precisa confirmar seu email antes de fazer login. Verifique sua caixa de entrada.'
          }
          
          return { success: false, message }
        }
        
        if (result.user) {
          setUser(result.user)
          return { success: true }
        }
      } else {
        // Se for username, buscar email primeiro
        
        try {
          debugLog.info('Buscando username:', emailOrUsername.trim())
          
          // Buscar username via API route
          const response = await fetch('/api/auth/find-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: emailOrUsername.trim() })
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            debugLog.error('Erro ao buscar username:', result.error)
            return { success: false, message: result.error || 'Nome de usuário não encontrado' }
          }
          
          if (!result.email) {
            return { success: false, message: 'Nome de usuário não encontrado' }
          }
          
          debugLog.success('Email encontrado para username:', result.email)
          
          // Tentar login com o email encontrado
          const loginResult = await signIn(result.email, password)
          
          if (loginResult.error) {
            return { success: false, message: 'Senha incorreta' }
          }
          
          if (loginResult.user) {
            setUser(loginResult.user)
            return { success: true }
          }
        } catch (usernameError) {
          console.error('❌ [AUTH] Erro na busca do username:', usernameError)
          return { success: false, message: 'Erro ao buscar nome de usuário' }
        }
      }
      
      return { success: false, message: 'Erro inesperado ao fazer login' }
    } catch (error) {
      console.error('❌ [AUTH] Erro no login:', error)
      return { success: false, message: 'Erro de conexão' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true)
      
      // Verificar se username já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()
      
      if (existingUser) {
        return { success: false, message: 'Nome de usuário já está em uso' }
      }
      
      const { user, error } = await signUp(email, password, name, username)
      
      if (error) {
        let message = 'Erro ao criar conta'
        
        if (error.message.includes('User already registered')) {
          message = 'Este email já está cadastrado'
        } else if (error.message.includes('Password should be at least')) {
          message = 'A senha deve ter pelo menos 6 caracteres'
        } else if (error.message.includes('Invalid email')) {
          message = 'Email inválido'
        } else if (error.message.includes('Invalid API key')) {
          message = 'Erro de configuração do sistema. Verifique as variáveis de ambiente.'
        }
        
        return { success: false, message }
      }
      
      if (user) {
        // O usuário será definido pelo onAuthStateChange
        return { success: true, message: 'Conta criada com sucesso!' }
      }
      
      return { success: false, message: 'Erro inesperado ao criar conta' }
    } catch (error) {
      console.error('Register error:', error)
      return { success: false, message: 'Erro de conexão' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}