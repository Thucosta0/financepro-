'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Code, Zap, Users, Target, CheckCircle, Lock, Brain, Smartphone, CreditCard, TrendingUp } from 'lucide-react'

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header com breadcrumb */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-300"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Voltar ao Início
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">₿</span>
              </div>
              <span className="text-xl font-bold text-gray-900">FinancePRO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">
            Sobre o <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FinancePRO</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-fade-in delay-200">
            Desenvolvido para resolver um problema real: a falta de uma ferramenta que realmente atendesse às necessidades de gestão financeira pessoal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-400">
            <Link 
              href="/cadastro"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              Experimentar Agora
            </Link>
            <Link 
              href="/login"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </section>

      {/* História do Projeto */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">A História por Trás do Projeto</h2>
            <p className="text-lg text-gray-600">Como nasceu a solução que transformou minha vida financeira</p>
          </div>
          
          <div className="prose prose-lg mx-auto text-gray-700 leading-relaxed">
            <p className="text-xl mb-6">
              <strong>Estava em busca de um app que realmente me ajudasse a organizar minhas finanças — mas nenhum me atendia 100%.</strong>
            </p>
            
            <p className="mb-6">
              Após meses estudando, desenvolvendo e testando, nasceu o <strong>FinancePRO</strong> — um sistema completo que agora compartilho com vocês para testarem, darem feedback e, quem sabe, tornarem parte da evolução dele.
            </p>
            
            <p className="mb-6">
              Este projeto representa mais do que um aplicativo: é um <strong>estudo de caso completo</strong> sobre como desenvolver software seguro, inteligente e escalável em 2025.
            </p>
          </div>
        </div>
      </section>

      {/* Segurança em Primeiro Lugar */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🛡️ Segurança em Primeiro Lugar</h2>
            <p className="text-lg text-gray-600">A proteção de dados e a privacidade dos usuários sempre foram nossa prioridade</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Row Level Security (RLS)",
                description: "Implementado em todas as tabelas do banco de dados"
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Políticas Granulares",
                description: "Cada usuário vê apenas seus próprios dados"
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Autenticação Robusta",
                description: "Supabase Auth com email + username"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Sessões Seguras",
                description: "Refresh tokens automáticos para máxima segurança"
              },
              {
                icon: <Lock className="h-6 w-6" />,
                title: "Rotas Protegidas",
                description: "Validação em frontend e backend"
              },
              {
                icon: <CheckCircle className="h-6 w-6" />,
                title: "Validação Multicamada",
                description: "Dados validados em múltiplas camadas"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🔒 Diferenciais de Segurança</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Arquitetura Zero Trust</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Criptografia end-to-end</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Auditoria completa de operações</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Backup automático</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Sistema de recuperação</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">100% conforme LGPD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stack Tecnológica */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-6">
              <Code className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">⚙️ Stack Tecnológica Moderna</h2>
            <p className="text-lg text-gray-600">Tecnologias de ponta para máxima performance e confiabilidade</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                category: "Frontend",
                technologies: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS"]
              },
              {
                category: "Backend", 
                technologies: ["Supabase", "PostgreSQL", "Supabase Auth", "Storage"]
              },
              {
                category: "Inteligência",
                technologies: ["OpenAI API", "ThFinanceAI", "Context API", "Hooks customizados"]
              },
              {
                category: "Performance",
                technologies: ["Interface responsiva", "Carregamento otimizado", "PWA", "UX nativa"]
              }
            ].map((stack, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{stack.category}</h3>
                <div className="space-y-2">
                  {stack.technologies.map((tech, techIndex) => (
                    <div key={techIndex} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700 text-sm">{tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades Principais */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">💡 Funcionalidades Principais</h2>
            <p className="text-lg text-gray-600">Controle completo e inteligente da sua vida financeira</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Dashboard em Tempo Real",
                description: "Gráficos e estatísticas atualizados instantaneamente",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: <CreditCard className="h-8 w-8" />,
                title: "Gestão de Cartões",
                description: "Controle completo de cartões e contas bancárias",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: <Brain className="h-8 w-8" />,
                title: "Categorização Automática",
                description: "IA categoriza suas transações automaticamente",
                color: "from-green-500 to-green-600"
              },

              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Relatórios Detalhados",
                description: "Insights financeiros e análises profundas",
                color: "from-red-500 to-red-600"
              },
              {
                icon: <Brain className="h-8 w-8" />,
                title: "ThFinanceAI",
                description: "Consultoria financeira personalizada 24/7",
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Próximos Passos */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🧭 Próximos Passos</h2>
            <p className="text-lg text-gray-600">O futuro do FinancePRO está sendo construído</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Autenticação Biométrica",
                description: "Login ainda mais seguro com impressão digital e reconhecimento facial"
              },
              {
                title: "Open Banking",
                description: "Integração com todos os seus bancos para sincronização automática"
              },
              {
                title: "Apps Nativos",
                description: "Versões nativas para iOS e Android com performance otimizada"
              },
              {
                title: "Gestão de Investimentos",
                description: "Acompanhamento completo de ações, fundos e criptomoedas"
              }
            ].map((step, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para experimentar o FinancePRO?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Junte-se a quem já descobriu como ter controle total das finanças
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/cadastro"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
            >
              Começar Gratuitamente
            </Link>
            <Link 
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:bg-opacity-10 transition-all duration-300"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">₿</span>
            </div>
            <span className="text-xl font-bold">FinancePRO</span>
          </div>
          <p className="text-gray-400">
            © 2025 FinancePRO. Desenvolvido com ❤️ para transformar sua vida financeira.
          </p>
        </div>
      </footer>
    </div>
  )
} 