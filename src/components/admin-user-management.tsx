'use client'

import { useState, useEffect } from 'react'
import { Users, Search, Filter, Eye, Crown, CheckCircle, Clock, ArrowLeft, Star, Shield } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

interface User {
  id: string
  email: string
  name: string
  username?: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  is_premium?: boolean
  premium_until?: string
}

interface UserManagementProps {
  onBack: () => void
}

export function AdminUserManagement({ onBack }: UserManagementProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchUsers = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data: { session } } = await import('@/lib/supabase-client').then(m => m.supabase.auth.getSession())
      if (!session?.access_token) return

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [user])

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (user: User) => {
    if (user.is_premium) return 'text-purple-600 bg-purple-100'
    if (user.email_confirmed_at) return 'text-green-600 bg-green-100'
    return 'text-yellow-600 bg-yellow-100'
  }

  const getStatusText = (user: User) => {
    if (user.is_premium) return 'Premium'
    if (user.email_confirmed_at) return 'Ativo'
    return 'Pendente'
  }

  const handleUserAction = async (userId: string, action: 'grant_premium' | 'revoke_premium' | 'details') => {
    setActionLoading(userId)
    
    try {
      if (action === 'details') {
        const user = users.find(u => u.id === userId)
        setSelectedUser(user || null)
        return
      }

      const { data: { session } } = await import('@/lib/supabase-client').then(m => m.supabase.auth.getSession())
      
      console.log('🔑 Sessão atual:', session?.user?.email, 'Token existe:', !!session?.access_token)
      
      if (!session?.access_token) {
        console.error('Nenhum token de acesso encontrado')
        alert('❌ Erro: Token de acesso não encontrado. Faça login novamente.')
        return
      }

      console.log(`🔄 Executando ação: ${action} para usuário: ${userId}`)

      const response = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          action
        })
      })
      
      const responseData = await response.json()
      console.log('📊 Resposta da API:', responseData)
      
      if (response.ok) {
        // Sucesso - mostrar mensagem e recarregar lista
        const actionText = action === 'grant_premium' ? 'concedido' : 'removido'
        alert(`✅ Premium ${actionText} com sucesso!`)
        await fetchUsers() // Recarregar lista
      } else {
        // Erro - mostrar detalhes
        console.error('❌ Erro na API:', responseData)
        alert(`❌ Erro: ${responseData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao ${action} usuário:`, error)
      alert(`❌ Erro de conexão: ${error}`)
    } finally {
      setActionLoading(null)
    }
  }

  if (selectedUser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">Detalhes do Usuário</h3>
        </div>

        <div className="bg-white p-6 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900">{selectedUser.name}</h4>
              <p className="text-gray-600">{selectedUser.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedUser)}`}>
              {getStatusText(selectedUser)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">ID do Usuário</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">{selectedUser.id}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <p className="text-sm text-gray-900">{selectedUser.username || 'Não definido'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Data de Criação</label>
              <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Última Atualização</label>
              <p className="text-sm text-gray-900">{formatDate(selectedUser.updated_at)}</p>
            </div>

            {selectedUser.last_sign_in_at && (
              <div>
                <label className="text-sm font-medium text-gray-700">Último Login</label>
                <p className="text-sm text-gray-900">{formatDate(selectedUser.last_sign_in_at)}</p>
              </div>
            )}

            {selectedUser.email_confirmed_at && (
              <div>
                <label className="text-sm font-medium text-gray-700">Email Confirmado</label>
                <p className="text-sm text-gray-900">{formatDate(selectedUser.email_confirmed_at)}</p>
              </div>
            )}

            {selectedUser.is_premium && selectedUser.premium_until && (
              <div>
                <label className="text-sm font-medium text-gray-700">Premium Até</label>
                <p className="text-sm text-purple-600 font-medium">{formatDate(selectedUser.premium_until)}</p>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            {selectedUser.email?.toLowerCase() !== 'arthurcos33@gmail.com' ? (
              !selectedUser.is_premium ? (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'grant_premium')}
                  disabled={actionLoading === selectedUser.id}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Crown className="h-4 w-4" />
                  <span>Conceder Premium</span>
                </button>
              ) : (
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'revoke_premium')}
                  disabled={actionLoading === selectedUser.id}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Remover Premium</span>
                </button>
              )
            ) : (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                <Shield className="h-4 w-4" />
                <span>Administrador - Ações não permitidas</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Gerenciar Usuários
          </h3>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Atualizar'}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email, nome ou username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando usuários...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.username && (
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user)}`}>
                        {getStatusText(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_premium ? (
                        <Crown className="h-5 w-5 text-purple-600 mx-auto" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUserAction(user.id, 'details')}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Ações de premium - Desabilitar para admin */}
                        {user.email?.toLowerCase() !== 'arthurcos33@gmail.com' ? (
                          !user.is_premium ? (
                            <button
                              onClick={() => handleUserAction(user.id, 'grant_premium')}
                              disabled={actionLoading === user.id}
                              className="p-1 text-purple-600 hover:bg-purple-100 rounded disabled:opacity-50"
                              title="Conceder premium"
                            >
                              <Crown className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user.id, 'revoke_premium')}
                              disabled={actionLoading === user.id}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                              title="Remover premium"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded" title="Administrador - ações não permitidas">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 