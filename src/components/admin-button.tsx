'use client'

import { useState, useEffect } from 'react'
import { Shield, Settings, Users, Database, BarChart3, X, RefreshCw, Trash2 } from 'lucide-react'
import { useAdmin } from '@/hooks/use-admin'
import { useAuth } from '@/context/auth-context'
import { AdminUserManagement } from './admin-user-management'
import { AdminResetTransactions } from './admin-reset-transactions'
import { usePathname } from 'next/navigation'

interface AdminStats {
  users: {
    total: number
    recent: number
    growth: number
  }
  transactions: {
    total: number
    recent: number
    totalRevenue: number
    totalExpenses: number
    balance: number
  }
  categories: {
    total: number
    income: number
    expense: number
  }
  cards: {
    total: number
    credit: number
    debit: number
    cash: number
  }
  system: {
    status: string
    lastUpdate: string
    version: string
  }
}

export function AdminButton() {
  const { isAdmin, isLoading } = useAdmin()
  const { user } = useAuth()
  const pathname = usePathname()
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'database' | 'analytics' | 'settings' | 'reset-transactions'>('dashboard')
  
  // Páginas onde o Admin Button NÃO deve aparecer
  const excludedPages = [
    '/',
    '/login',
    '/cadastro',
    '/reset-password',
    '/confirm-email',
    '/bem-vindo',
    '/sobre',
    '/planos',
    '/logos'
  ]

  const fetchStats = async () => {
    if (!user) return
    
    setLoadingStats(true)
    try {
      const { data: { session } } = await import('@/lib/supabase-client').then(m => m.supabase.auth.getSession())
      if (!session?.access_token) return

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      // Erro silencioso ao carregar estatísticas
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (showAdminPanel && isAdmin && user) {
      fetchStats()
    }
  }, [showAdminPanel, isAdmin, user])

  if (isLoading || !isAdmin || excludedPages.includes(pathname)) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const closePanel = () => {
    setShowAdminPanel(false)
    setCurrentView('dashboard')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <AdminUserManagement onBack={() => setCurrentView('dashboard')} />
      case 'reset-transactions':
        return <AdminResetTransactions onBack={() => setCurrentView('dashboard')} />
      case 'database':
        return (
          <div className="space-y-4">
            <button onClick={() => setCurrentView('dashboard')} className="text-blue-600 hover:underline">
              ← Voltar ao Dashboard
            </button>
            <div className="text-center py-8">
              <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Database Admin</h3>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="space-y-4">
            <button onClick={() => setCurrentView('dashboard')} className="text-blue-600 hover:underline">
              ← Voltar ao Dashboard
            </button>
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Avançados</h3>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </div>
          </div>
        )
      case 'settings':
        return (
          <div className="space-y-4">
            <button onClick={() => setCurrentView('dashboard')} className="text-blue-600 hover:underline">
              ← Voltar ao Dashboard
            </button>
            <div className="text-center py-8">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações do Sistema</h3>
              <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
            </div>
          </div>
        )
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Header com atualização */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Dashboard Administrativo</h4>
        <button
          onClick={fetchStats}
          disabled={loadingStats}
          className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
          <span className="text-sm">Atualizar</span>
        </button>
      </div>

      {loadingStats && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando estatísticas...</p>
        </div>
      )}

      {/* Estatísticas rápidas */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 font-medium">USUÁRIOS</p>
                    <p className="text-lg font-bold text-blue-800">{stats.users.total}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">Novos (7d)</p>
                  <p className="text-sm font-bold text-blue-700">+{stats.users.recent}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-xs text-green-600 font-medium">TRANSAÇÕES</p>
                    <p className="text-lg font-bold text-green-800">{stats.transactions.total}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Recentes</p>
                  <p className="text-sm font-bold text-green-700">+{stats.transactions.recent}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-xs text-purple-600 font-medium">SISTEMA</p>
                    <p className="text-lg font-bold text-purple-800 capitalize">{stats.system.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-600">Versão</p>
                  <p className="text-sm font-bold text-purple-700">{stats.system.version}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas financeiras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
              <h5 className="text-sm font-medium text-emerald-800 mb-2">💰 Receitas Totais</h5>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(stats.transactions.totalRevenue)}</p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
              <h5 className="text-sm font-medium text-red-800 mb-2">💸 Despesas Totais</h5>
              <p className="text-xl font-bold text-red-700">{formatCurrency(stats.transactions.totalExpenses)}</p>
            </div>
          </div>

          {/* Resumo do sistema */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <h5 className="text-sm font-medium text-gray-800 mb-3">📊 Resumo do Sistema</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-600">Categorias</p>
                <p className="text-lg font-bold text-gray-800">{stats.categories.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Cartões</p>
                <p className="text-lg font-bold text-gray-800">{stats.cards.total}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Rec./Desp.</p>
                <p className="text-lg font-bold text-gray-800">{stats.categories.income}/{stats.categories.expense}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Cartões Créd.</p>
                <p className="text-lg font-bold text-gray-800">{stats.cards.credit}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ações administrativas */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Ações Administrativas
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={() => setCurrentView('users')}
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
          >
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Gerenciar Usuários</p>
              <p className="text-xs text-gray-600">Visualizar e gerenciar usuários</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('database')}
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
          >
            <Database className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Database Admin</p>
              <p className="text-xs text-gray-600">Acesso ao banco de dados</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('analytics')}
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
          >
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-xs text-gray-600">Relatórios e estatísticas</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('settings')}
            className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-left"
          >
            <Settings className="h-6 w-6 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Configurações</p>
              <p className="text-xs text-gray-600">Configurações do sistema</p>
            </div>
          </button>

          <button 
            onClick={() => setCurrentView('reset-transactions')}
            className="flex items-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors text-left"
          >
            <Trash2 className="h-6 w-6 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Reset Transações</p>
              <p className="text-xs text-gray-600">Limpar dados de usuários</p>
            </div>
          </button>
        </div>
      </div>

      {/* Informações do admin */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
        <h4 className="text-lg font-semibold text-purple-900 mb-2">
          👑 Informações do Administrador
        </h4>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium text-purple-800">Email:</span> arthurcos33@gmail.com</p>
          <p><span className="font-medium text-purple-800">Username:</span> thucosta</p>
          <p><span className="font-medium text-purple-800">Privilégios:</span> Administrador Master</p>
          <p><span className="font-medium text-purple-800">Acesso:</span> Todas as funcionalidades</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="text-purple-600 mt-0.5">👑</div>
          <div>
            <h5 className="text-sm font-medium text-purple-800">Sistema de Premium</h5>
            <p className="text-xs text-purple-700 mt-1">
              Conceda acesso premium gratuito aos usuários, liberando todas as funcionalidades 
              sem necessidade de pagamento dos R$ 17,00.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Botão flutuante de admin */}
      <button
        onClick={() => setShowAdminPanel(true)}
        className="fixed bottom-20 right-4 lg:bottom-24 lg:right-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 lg:p-4 rounded-full shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 z-40 hover:scale-110 touch-manipulation border-2 border-purple-400"
        title="Painel de Administrador - thucosta"
      >
        <Shield className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>

      {/* Modal do painel de admin */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full h-full lg:w-[95vw] lg:max-w-7xl lg:h-[95vh] lg:rounded-lg shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white lg:rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base lg:text-lg">Painel de Administrador</h3>
                  <p className="text-xs text-purple-100">
                    Bem-vindo, thucosta!👑
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-purple-100 hover:text-white p-2 touch-manipulation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do painel */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 lg:bg-white lg:rounded-b-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  FinancePRO - Admin Panel v1.0
                </p>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}