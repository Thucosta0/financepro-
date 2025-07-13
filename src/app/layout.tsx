import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FinancialProvider } from '@/context/financial-context';
import { AuthProvider } from '@/context/auth-context';
import { ConditionalNavigation } from '@/components/conditional-navigation';
import { AIAssistantWrapper } from '@/components/ai-assistant-wrapper';
import { AdminButton } from '@/components/admin-button';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  minimumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#4F46E5',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  title: "FinancePRO - Gestão Financeira Completa",
  description: "Controle suas finanças de forma inteligente com o FinancePRO. Gerencie cartões, transações, orçamentos e muito mais.",
  keywords: "finanças, gestão financeira, controle de gastos, orçamento pessoal, financepro",
  authors: [{ name: "FinancePRO Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: false, // Desabilitar para prevenir comportamento de app nativo
    statusBarStyle: 'default',
    title: 'FinancePRO',
  },
  icons: [
    {
      url: "/favicon.svg",
      type: "image/svg+xml",
    },
    {
      url: "/favicon.ico",
      sizes: "32x32",
      type: "image/x-icon",
    },
    {
      url: "/favicon.png",
      sizes: "32x32",
      type: "image/png",
    },
    {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
      rel: "apple-touch-icon",
    },
    {
      url: "/icons/icon-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      url: "/icons/icon-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Meta tags otimizadas */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* CSS otimizado para prevenir zoom */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html {
              -webkit-text-size-adjust: 100%;
              -moz-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              text-size-adjust: 100%;
              touch-action: manipulation;
              overflow-x: hidden;
              max-width: 100vw;
            }
            
            body {
              touch-action: manipulation;
              -webkit-text-size-adjust: 100%;
              -moz-text-size-adjust: 100%;
              text-size-adjust: 100%;
              overflow-x: hidden;
              max-width: 100vw;
              position: relative;
            }
            
            * {
              -webkit-tap-highlight-color: transparent;
              -webkit-touch-callout: none;
              outline: none;
            }
            
            /* Permite seleção em elementos de entrada */
            input, 
            textarea, 
            [contenteditable="true"], 
            [contenteditable=""],
            .selectable {
              -webkit-user-select: auto;
              -moz-user-select: auto;
              -ms-user-select: auto;
              user-select: auto;
            }
            
            /* Previne zoom no Safari iOS */
            input[type="text"], 
            input[type="email"], 
            input[type="password"], 
            input[type="number"], 
            input[type="tel"], 
            input[type="url"], 
            input[type="search"], 
            input[type="date"],
            input[type="time"],
            input[type="datetime-local"],
            textarea, 
            select {
              font-size: 16px;
            }
            
            /* Desabilita context menu em imagens */
            img, 
            svg, 
            picture {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              user-select: none;
              pointer-events: none;
            }
            
            /* Permite eventos em elementos interativos */
            button, 
            input, 
            textarea, 
            select, 
            a, 
            [role="button"], 
            [tabindex] {
              pointer-events: auto;
            }
          `
        }} />
        
        {/* JavaScript otimizado para prevenir zoom e refresh */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              'use strict';
              
              let lastTouchEnd = 0;
              let isPageVisible = true;
              
              // Monitorar visibilidade da página
              document.addEventListener('visibilitychange', function() {
                isPageVisible = !document.hidden;
              });
              
              // Previne duplo toque
              document.addEventListener('touchend', function(event) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                  event.preventDefault();
                }
                lastTouchEnd = now;
              }, { passive: false });
              
              // Previne gestos de zoom
              document.addEventListener('touchstart', function(event) {
                if (event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });
              
              document.addEventListener('touchmove', function(event) {
                if (event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });
              
              // Previne zoom via teclado
              document.addEventListener('keydown', function(event) {
                if ((event.ctrlKey || event.metaKey) && 
                    (event.key === '+' || event.key === '-' || event.key === '=' || 
                     event.keyCode === 187 || event.keyCode === 189)) {
                  event.preventDefault();
                }
              }, { passive: false });
              
              // Previne zoom via mouse wheel
              document.addEventListener('wheel', function(event) {
                if (event.ctrlKey || event.metaKey) {
                  event.preventDefault();
                }
              }, { passive: false });
              
              // Previne refresh acidental em mobile
              let startY = 0;
              document.addEventListener('touchstart', function(e) {
                startY = e.touches[0].clientY;
              });
              
              document.addEventListener('touchmove', function(e) {
                const currentY = e.touches[0].clientY;
                const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                
                // Previne pull-to-refresh se estivermos no topo da página
                if (scrollTop === 0 && currentY > startY) {
                  e.preventDefault();
                }
              }, { passive: false });
              
            })();
          `
        }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <FinancialProvider>
            <ConditionalNavigation>
              {children}
            </ConditionalNavigation>
            <AIAssistantWrapper />
            <AdminButton />
          </FinancialProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
