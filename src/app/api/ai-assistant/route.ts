import { NextRequest, NextResponse } from 'next/server'

interface FinancialData {
  receitas: number
  despesas: number
  saldo: number
  categorias: string
}

interface RequestBody {
  message: string
  financialData?: FinancialData
  isForBudgetTip?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { message, financialData, isForBudgetTip } = body

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        response: 'Desculpe, o assistente IA não está configurado. Entre em contato com o suporte.'
      })
    }

    let contextFinanceiro = ''
    if (financialData) {
      const { receitas, despesas, saldo } = financialData
      const percentualGasto = receitas > 0 ? (despesas / receitas) * 100 : 0
      contextFinanceiro = `\n\nDados financeiros do usuário:\n- Receitas: R$ ${receitas.toLocaleString('pt-BR')}\n- Despesas: R$ ${despesas.toLocaleString('pt-BR')}\n- Saldo: R$ ${saldo.toLocaleString('pt-BR')}\n- Percentual de gastos: ${percentualGasto.toFixed(1)}%\n- Categorias: ${financialData.categorias}`
    }

    // Prompt especializado para dicas de orçamento
    if (isForBudgetTip && financialData) {
      const systemPrompt = `Sou o ThFinanceAI, seu consultor financeiro pessoal. Analiso sua situação e forneço dicas práticas e diretas.\n\nResponda APENAS no formato solicitado:\n"Título: [título da dica] | Descrição: [descrição detalhada]"\n\nSeja específico, prático e focado na situação financeira apresentada.`

      const prompt = `${systemPrompt}\n\nAnálise dos dados:${contextFinanceiro}\n\nForneça UMA dica específica para esta situação.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          }
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Silenciar erro de API do Gemini
        return NextResponse.json({ response: `Erro Gemini: ${data.error?.message || JSON.stringify(data)}` })
      }
      
      return NextResponse.json({
        response: data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar uma dica no momento.'
      })
    }

    // Prompt principal para conversas gerais
    const systemPrompt = `Sou o ThFinanceAI, seu consultor financeiro pessoal especializado no mercado brasileiro.\n\nComportamento:\n- Respondo APENAS ao que você pergunta, sem informações extras\n- Sou direto, prático e focado na sua pergunta específica\n- Para saudações (bom dia, boa tarde, boa noite, oi, olá), respondo de forma cordial e me apresento brevemente\n- Me identifico naturalmente como ThFinanceAI quando apropriado\n\nEspecialidades:\n- Finanças pessoais e investimentos brasileiros\n- CDB, Tesouro Direto, Selic, fundos, ações\n- Planejamento financeiro e controle de gastos\n- Análise de situações financeiras específicas\n\nSempre considero sua situação financeira atual quando disponível.`

    const userPrompt = `${message}${contextFinanceiro}`
    const fullPrompt = `${systemPrompt}\n\nPergunta: ${userPrompt}\n\nResposta direta e focada:`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.8,
        }
      }),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      // Silenciar erro de API do Gemini
      return NextResponse.json({ response: `Erro Gemini: ${data.error?.message || JSON.stringify(data)}` })
    }
    
    const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua pergunta no momento. Tente novamente.'
    return NextResponse.json({ response: resposta })

  } catch (error) {
    // Silenciar erro da API do assistente IA
    const fallbackResponse = `Desculpe, estou temporariamente indisponível. 😔 \n\nEnquanto isso, aqui estão algumas dicas rápidas:\n• Use a regra 50-30-20 para seu orçamento\n• Mantenha uma reserva de emergência de 6 meses\n• Quite primeiro as dívidas com juros mais altos\n• Monitore seus gastos semanalmente\n\nTente novamente em alguns instantes!`
    return NextResponse.json({ response: fallbackResponse })
  }
}