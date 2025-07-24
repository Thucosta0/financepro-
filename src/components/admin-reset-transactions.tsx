'use client'

import { useState } from 'react'
import { Trash2, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/context/auth-context'

interface ResetResult {
  success: boolean
  message?: string
  error?: string
  transactions_deleted?: number
  backup_created?: boolean
  user_id?: string
}

interface AdminResetTransactionsProps {
  onBack?: () => void
}

export function AdminResetTransactions({ onBack }: AdminResetTransactionsProps) {
  const { user } = useAuth()
  const [targetEmail, setTargetEmail] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [createBackup, setCreateBackup] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ResetResult | null>(null)
  const [userInfo, setUserInfo] = useState<any>(null)

  // Buscar usuário por email
  const searchUser = async () => {
    if (!targetEmail.trim()) {
      alert('Digite um email válido')
      return
    }

    setIsLoading(true)
    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Sessão expirada. Faça login novamente.')
        return
      }

      // Buscar usuário através da API
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email: targetEmail.trim() })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar usuário')
      }

      if (!result.user) {
        alert('Usuário não encontrado')
        setUserInfo(null)
        setTargetUserId('')
        return
      }

      setUserInfo(result.user)
      setTargetUserId(result.user.id)

    } catch (error: any) {
      console.error('Erro ao buscar usuário:', error)
      alert(error.message || 'Erro ao buscar usuário')
      setUserInfo(null)
      setTargetUserId('')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset de transações usando a função SQL
  const resetTransactions = async () => {
    if (!targetUserId) {
      alert('Selecione um usuário primeiro')
      return
    }

    if (!confirm(`⚠️ ATENÇÃO: Esta operação irá deletar TODAS as transações do usuário ${userInfo?.email || targetEmail}.\n\nIsso inclui:\n• Transações normais\n• Transações parceladas\n• Transações recorrentes (se houver)\n\n${createBackup ? 'Um backup será criado.' : 'NENHUM backup será criado!'}\n\nTem certeza que deseja continuar?`)) {
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const { data, error } = await supabase.rpc('admin_reset_user_transactions', {
        target_user_id: targetUserId,
        admin_user_id: user?.id,
        create_backup: createBackup
      })

      if (error) {
        throw error
      }

      setResult(data)
      
      // Atualizar estatísticas do usuário
      if (data.success) {
        setUserInfo((prev: any) => ({
          ...prev,
          stats: {
            total: 0,
            receitas: 0,
            despesas: 0,
            valorReceitas: 0,
            valorDespesas: 0
          }
        }))
      }

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Restaurar transações do backup
  const restoreTransactions = async () => {
    if (!targetUserId) {
      alert('Selecione um usuário primeiro')
      return
    }

    if (!confirm(`Restaurar transações do backup para ${userInfo?.email || targetEmail}?`)) {
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_restore_user_transactions', {
        target_user_id: targetUserId,
        admin_user_id: user?.id
      })

      if (error) {
        throw error
      }

      setResult(data)
      
      // Recarregar estatísticas
      if (data.success) {
        await searchUser()
      }

    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {onBack && (
        <button onClick={onBack} className="text-blue-600 hover:underline">
          ← Voltar ao Dashboard
        </button>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trash2 className="h-6 w-6 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">Reset de Transações de Usuário</h2>
        </div>
        
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Atenção:</strong> Esta função irá deletar TODAS as transações do usuário, incluindo:
            transações normais, parceladas e recorrentes.
          </p>
        </div>

      {/* Busca de usuário */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email do Usuário
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="usuario@exemplo.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchUser}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Informações do usuário */}
      {userInfo && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Usuário Encontrado:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Email:</strong> {userInfo.email}</p>
              <p><strong>Username:</strong> {userInfo.username || 'Não definido'}</p>
              <p><strong>ID:</strong> {userInfo.id}</p>
            </div>
            {userInfo.stats && (
              <div>
                <p><strong>Total de Transações:</strong> {userInfo.stats.total}</p>
                <p><strong>Receitas:</strong> {userInfo.stats.receitas} ({formatCurrency(userInfo.stats.valorReceitas)})</p>
                <p><strong>Despesas:</strong> {userInfo.stats.despesas} ({formatCurrency(userInfo.stats.valorDespesas)})</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Opções de reset */}
      {userInfo && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="createBackup"
              checked={createBackup}
              onChange={(e) => setCreateBackup(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="createBackup" className="text-sm font-medium text-gray-700">
              Criar backup antes de deletar (recomendado)
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetTransactions}
              disabled={isLoading || !userInfo.stats || userInfo.stats.total === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? 'Resetando...' : 'Reset Transações'}
            </button>

            <button
              onClick={restoreTransactions}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Restaurar do Backup
            </button>
          </div>
        </div>
      )}

      {/* Resultado da operação */}
      {result && (
        <div className={`p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <h4 className={`font-semibold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? 'Operação Realizada com Sucesso' : 'Erro na Operação'}
            </h4>
          </div>
          
          {result.message && (
            <p className={result.success ? 'text-green-700' : 'text-red-700'}>
              {result.message}
            </p>
          )}
          
          {result.error && (
            <p className="text-red-700 font-mono text-sm">
              {result.error}
            </p>
          )}
          
          {result.success && result.transactions_deleted && (
            <div className="mt-2 text-sm text-green-700">
              <p>• Transações deletadas: {result.transactions_deleted}</p>
              <p>• Backup criado: {result.backup_created ? 'Sim' : 'Não'}</p>
              <p>• Data/Hora: {new Date().toLocaleString('pt-BR')}</p>
            </div>
          )}
        </div>
      )}

      {/* Aviso importante */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <h4 className="font-semibold text-yellow-800">⚠️ Aviso Importante</h4>
        </div>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Esta operação é <strong>IRREVERSÍVEL</strong> sem backup</li>
          <li>• Sempre crie backup antes de resetar transações</li>
          <li>• Teste em ambiente de desenvolvimento primeiro</li>
          <li>• Verifique se o usuário está correto antes de executar</li>
          <li>• Mantenha logs das operações realizadas</li>
        </ul>
      </div>
      </div>
    </div>
  )
}