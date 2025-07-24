'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { supabase } from '@/lib/supabase-client'
import { User, Mail, AtSign, Save, Camera, ArrowLeft, AlertCircle, CheckCircle, Lock, Eye, EyeOff, Shield } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { UsernameInput } from '@/components/ui/username-input'
import { useFinancial } from '@/context/financial-context'

interface UserProfile {
  id: string
  name: string
  username?: string
  email: string
  avatar_url?: string
  created_at: string
}

export default function PerfilPage() {
  const { user } = useAuth()
  const { transactions, categories, cards } = useFinancial()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // Silenciar erro de carregamento de perfil
        setFeedback({ type: 'error', message: 'Erro ao carregar perfil' })
        return
      }

      if (data) {
        setProfile(data)
        setFormData({
          name: data.name || '',
          username: (data.username || '').replace(/@/g, ''),
          email: data.email || ''
        })
      }
    } catch (error) {
      // Silenciar erro de carregamento de perfil
      setFeedback({ type: 'error', message: 'Erro ao carregar perfil' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    setIsSaving(true)

    if (!user) return

    // Validações
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Nome é obrigatório!' })
      setIsSaving(false)
      return
    }

    if (formData.username && formData.username.length < 3) {
      setFeedback({ type: 'error', message: 'Nome de usuário deve ter pelo menos 3 caracteres!' })
      setIsSaving(false)
      return
    }

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setFeedback({ type: 'error', message: 'Nome de usuário deve conter apenas letras, números e underscore!' })
      setIsSaving(false)
      return
    }

    try {
      // Verificar se username já existe (apenas se foi alterado)
      if (formData.username && formData.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', formData.username)
          .neq('id', user.id)
          .single()

        if (existingUser) {
          setFeedback({ type: 'error', message: 'Nome de usuário já está em uso' })
          setIsSaving(false)
          return
        }
      }

      // Atualizar perfil
      console.log('💾 [PERFIL] Salvando dados:', {
        name: formData.name,
        username: formData.username || null,
        user_id: user.id
      })
      
      // Verificar se o username já existe antes de salvar
      if (formData.username) {
        const { data: checkUser } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', formData.username)
          .maybeSingle()
        
        console.log('💾 [PERFIL] Verification check:', checkUser)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          username: formData.username || null
        })
        .eq('id', user.id)

      console.log('💾 [PERFIL] Resultado da atualização:', { error })

      if (error) {
        // Silenciar erro de atualização de perfil
        setFeedback({ type: 'error', message: 'Erro ao salvar perfil' })
        return
      }

      console.log('✅ [PERFIL] Perfil atualizado com sucesso!')
      
      // Verificar se foi realmente salvo
      const { data: savedProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('id, username, name, email')
        .eq('id', user.id)
        .single()
      
      console.log('💾 [PERFIL] Dados após salvar:', savedProfile)
      console.log('💾 [PERFIL] Erro na verificação:', verifyError)
      
      // Verificar se conseguimos buscar o username que acabamos de salvar
      if (formData.username) {
        const { data: searchResult, error: searchError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('username', formData.username)
          .maybeSingle()
        
        console.log('💾 [PERFIL] Busca pelo username recém-salvo:', searchResult)
        console.log('💾 [PERFIL] Erro na busca:', searchError)
      }
      
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' })
      
      // Recarregar dados
      await loadProfile()
    } catch (error) {
      // Silenciar erro de atualização de perfil
      setFeedback({ type: 'error', message: 'Erro ao salvar perfil' })
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordFeedback(null)
    setIsChangingPassword(true)

    // Validações
    if (!passwordData.newPassword) {
      setPasswordFeedback({ type: 'error', message: 'Nova senha é obrigatória!' })
      setIsChangingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres!' })
      setIsChangingPassword(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'As senhas não coincidem!' })
      setIsChangingPassword(false)
      return
    }

    try {
      // Atualizar senha diretamente (Supabase verifica a senha atual automaticamente)
      const { error: updateError, data } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        // Diferentes tipos de erro
        if (updateError.message.includes('session')) {
          setPasswordFeedback({ type: 'error', message: 'Sessão expirada. Faça login novamente.' })
        } else if (updateError.message.includes('password')) {
          setPasswordFeedback({ type: 'error', message: 'Erro ao atualizar senha. Verifique sua senha atual.' })
        } else {
          setPasswordFeedback({ type: 'error', message: 'Erro ao atualizar senha. Tente novamente.' })
        }
        setIsChangingPassword(false)
        return
      }

      setPasswordFeedback({ type: 'success', message: 'Senha alterada com sucesso!' })
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      })

    } catch (error) {
      // Silenciar erro de mudança de senha
      setPasswordFeedback({ type: 'error', message: 'Erro ao alterar senha. Tente novamente.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Por favor, selecione apenas arquivos de imagem' })
      return
    }

    // Verificar tamanho do arquivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'A imagem deve ter no máximo 5MB' })
      return
    }

    setIsUploadingAvatar(true)
    setFeedback(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Remover avatar antigo se existir
      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split('/avatars/')[1]
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([oldPath])
          }
        } catch (error) {
          console.log('Não foi possível remover avatar antigo:', error)
        }
      }

      // Upload da imagem para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        // Silenciar erro de upload de avatar
        setFeedback({ type: 'error', message: 'Erro ao fazer upload da imagem' })
        return
      }

      // Obter URL pública da imagem
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Atualizar avatar_url no banco de dados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        // Silenciar erro de atualização de URL do avatar
        setFeedback({ type: 'error', message: 'Erro ao salvar foto de perfil' })
        return
      }

      // Recarregar perfil para mostrar a nova imagem
      await loadProfile()
      setFeedback({ type: 'success', message: 'Foto de perfil atualizada com sucesso!' })

    } catch (error) {
      // Silenciar erro de upload de avatar
      setFeedback({ type: 'error', message: 'Erro ao fazer upload da imagem' })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando perfil...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4 lg:p-6">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao dashboard
            </Link>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            {/* Avatar Section */}
            <div className="p-6 border-b">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {formData.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  
                  <button
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-lg border hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Alterar foto de perfil"
                  >
                    {isUploadingAvatar ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    ) : (
                      <Camera className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{profile?.name}</h2>
                  {profile?.username && (
                    <p className="text-gray-600">@{profile.username}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Membro desde {profile?.created_at ? formatDate(profile.created_at) : '---'}
                  </p>
                  {isUploadingAvatar && (
                    <p className="text-xs text-blue-600 mt-1">
                      Fazendo upload da imagem...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Seu nome completo"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="mb-6">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome de usuário
                  </label>
                  <UsernameInput
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/@/g, '') })}
                    placeholder="seu_username"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Permite login alternativo. Apenas letras, números e underscore.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled={true}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    O email não pode ser alterado por questões de segurança.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security Card */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
                  <p className="text-sm text-gray-600">Altere sua senha para manter sua conta segura. Você pode precisar fazer login novamente após a alteração.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Password Feedback */}
              {passwordFeedback && (
                <div className={`mb-6 p-4 rounded-lg flex items-center ${
                  passwordFeedback.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordFeedback.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                  )}
                  <span className="text-sm">{passwordFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Mínimo 6 caracteres"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isChangingPassword}
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
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Confirme sua nova senha"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isChangingPassword}
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
                    <li>• Sua sessão permanecerá ativa após a alteração</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isChangingPassword ? 'Alterando senha...' : 'Alterar senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Statistics Card */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas da conta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
                <div className="text-sm text-gray-600">Transações</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Categorias</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{cards.length}</div>
                <div className="text-sm text-gray-600">Cartões</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}