// Configuração de debug para desenvolvimento
export const DEBUG_MODE = process.env.NODE_ENV === 'development'

// Logger condicional que só funciona em desenvolvimento
export const debugLog = {
  info: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log('🔍', ...args)
    }
  },
  
  success: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log('✅', ...args)
    }
  },
  
  warning: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.warn('⚠️', ...args)
    }
  },
  
  error: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.error('❌', ...args)
    }
  },
  
  group: (label: string, ...args: any[]) => {
    if (DEBUG_MODE) {
      console.log('📦', label, ...args)
    }
  }
}

// Performance monitor para desenvolvimento
export const perfMonitor = {
  start: (label: string) => {
    if (DEBUG_MODE) {
      console.time(`⏱️ ${label}`)
    }
  },
  
  end: (label: string) => {
    if (DEBUG_MODE) {
      console.timeEnd(`⏱️ ${label}`)
    }
  }
}