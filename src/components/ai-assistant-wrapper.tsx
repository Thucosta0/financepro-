'use client'

import { AIAssistant } from './ai-assistant'
import { useFinancial } from '@/context/financial-context'
import { useAuth } from '@/context/auth-context'
import { usePathname } from 'next/navigation'

export function AIAssistantWrapper() {
  const { user } = useAuth()
  const { getFinancialSummary } = useFinancial()
  const pathname = usePathname()
  
  // Páginas onde o AI Assistant NÃO deve aparecer
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
  
  // Só mostra o AI Assistant se o usuário estiver logado E não estiver em páginas excluídas
  if (!user || excludedPages.includes(pathname)) {
    return null
  }
  
  // Obtém dados financeiros atualizados em tempo real
  const financialData = getFinancialSummary()
  
  return <AIAssistant financialData={financialData} />
} 