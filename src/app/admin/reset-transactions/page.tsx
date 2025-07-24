'use client'

import { useAuth } from '@/context/auth-context'
import { AdminResetTransactions } from '@/components/admin-reset-transactions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminResetTransactionsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    // Verificar se o usuário é admin (você pode ajustar esta lógica conforme sua implementação)
    // Por exemplo, verificar se o email está em uma lista de admins ou se há um campo role
    const adminEmails = [
      'admin@financepro.com',
      'suporte@financepro.com'
      // Adicione outros emails de admin aqui
    ]

    if (!isLoading && user && !adminEmails.includes(user.email || '')) {
      router.push('/dashboard')
      return
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Voltar ao Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-600">Área Administrativa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administração - Reset de Transações
          </h1>
          <p className="text-gray-600">
            Ferramenta para resetar todas as transações de um usuário específico.
            Use com extrema cautela.
          </p>
        </div>

        <AdminResetTransactions />

        {/* Informações adicionais */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Como Usar</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Digite o email do usuário</li>
              <li>Clique em "Buscar" para encontrar o usuário</li>
              <li>Verifique as informações e estatísticas</li>
              <li>Marque a opção de backup (recomendado)</li>
              <li>Clique em "Reset Transações"</li>
              <li>Confirme a operação</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🔄 Restauração</h3>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>Backups são criados automaticamente</li>
              <li>Use "Restaurar do Backup" para desfazer</li>
              <li>Backups ficam disponíveis por 30 dias</li>
              <li>Operação de restauração também é logada</li>
            </ul>
          </div>
        </div>

        {/* Logs e auditoria */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">📊 Auditoria e Logs</h3>
          <p className="text-sm text-gray-600 mb-3">
            Todas as operações de reset são registradas na tabela <code className="bg-gray-200 px-1 rounded">admin_logs</code> 
            para auditoria e controle.
          </p>
          <div className="text-xs text-gray-500">
            <p><strong>Informações registradas:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>ID do administrador que executou a operação</li>
              <li>ID do usuário afetado</li>
              <li>Tipo de operação (reset, restore)</li>
              <li>Quantidade de transações afetadas</li>
              <li>Data e hora da operação</li>
              <li>Status da operação (sucesso/erro)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}