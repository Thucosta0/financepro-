'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Navigation } from './navigation'

export function ConditionalNavigation({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Páginas que não devem mostrar a navegação
  const noNavPages = ['/', '/login', '/cadastro', '/reset-password', '/confirm-email', '/bem-vindo']
  const shouldShowNav = user && !noNavPages.includes(pathname)

  if (!shouldShowNav) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <main className="px-4 py-6 lg:px-6 lg:py-8 max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}