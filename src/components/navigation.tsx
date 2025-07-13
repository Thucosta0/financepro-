'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CreditCard, Receipt, Target, Menu, X, Layers, BarChart3, Wallet, LogOut, User, DollarSign, Home, PieChart, Folder, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase-client'
import { PremiumStatusBadge } from './premium-status-badge'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Transações', href: '/transacoes', icon: Receipt },
  { name: 'Categorias', href: '/categorias', icon: Folder },
  { name: 'Cartões', href: '/cartoes', icon: CreditCard },
  { name: 'Orçamento', href: '/orcamento', icon: PieChart },
  { name: 'Planos', href: '/planos', icon: Crown },
]

interface UserProfile {
  name: string
  username?: string
  email: string
  avatar_url?: string
}

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, username, email, avatar_url')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const displayName = userProfile?.name || user?.user_metadata?.name || 'Usuário'
  const displayEmail = userProfile?.email || user?.email || 'email@exemplo.com'
  const displayUsername = userProfile?.username

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FinancePRO
          </h1>
          <Link href="/perfil" className="p-2 rounded-lg hover:bg-gray-100 touch-manipulation">
            <User className="h-5 w-5 text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:shadow-lg lg:z-40">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="text-2xl font-bold text-white">FinancePRO</h1>
        </div>

        {/* User Profile Link */}
        <Link href="/perfil" className="p-4 border-b bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                {displayUsername ? (
                  <>
                    <p className="text-sm text-purple-600 truncate font-medium">
                      @{displayUsername}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {displayEmail}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-700 truncate font-medium">
                    {displayEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-blue-600 font-medium">Clique para editar perfil</p>
            <PremiumStatusBadge />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="mt-4 px-4 space-y-2 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sair da conta
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            FinancePRO v1.0
          </p>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`
        lg:hidden fixed inset-0 z-40 transition-opacity duration-300
        ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu panel */}
        <div className={`
          fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-xl font-bold text-white">FinancePRO</h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 touch-manipulation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Link */}
          <Link 
            href="/perfil" 
            onClick={() => setMobileMenuOpen(false)}
            className="p-4 border-b bg-gray-50 hover:bg-gray-100 transition-colors block"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                {userProfile?.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="space-y-1">
                  {displayUsername ? (
                    <>
                      <p className="text-base text-purple-600 truncate font-medium">
                        @{displayUsername}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {displayEmail}
                      </p>
                    </>
                  ) : (
                    <p className="text-base text-gray-700 truncate font-medium">
                      {displayEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2 font-medium">Clique para editar perfil</p>
          </Link>

          {/* Navigation */}
          <nav className="mt-6 px-4 space-y-2 flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-4 text-base font-medium rounded-lg transition-colors touch-manipulation
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <item.icon className={`mr-4 h-6 w-6 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-4 text-base font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors touch-manipulation"
            >
              <LogOut className="mr-4 h-6 w-6 text-gray-400" />
              Sair da conta
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              FinancePRO v1.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 