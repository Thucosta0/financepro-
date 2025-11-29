import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FinancialProvider } from '@/context/financial-context';
import { AuthProvider } from '@/context/auth-context';
import { ConditionalNavigation } from '@/components/conditional-navigation';
import { AIAssistantWrapper } from '@/components/ai-assistant-wrapper';
import { AdminButton } from '@/components/admin-button';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  minimumScale: 1.0,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#4F46E5',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  title: "FinancePRO - Gestão Financeira Completa",
  description: "Controle suas finanças de forma inteligente com o FinancePRO. Gerencie cartões, transações, orçamentos e muito mais.",
  keywords: "finanças, gestão financeira, controle de gastos, orçamento pessoal, financepro",
  authors: [{ name: "FinancePRO Team" }],

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Meta tags otimizadas */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FinancePRO" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="FinancePRO" />
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        

        
        {/* CSS básico otimizado */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html {
              -webkit-text-size-adjust: 100%;
              text-size-adjust: 100%;
              overflow-x: hidden;
            }
            
            body {
              -webkit-tap-highlight-color: transparent;
              -webkit-overflow-scrolling: touch;
              overscroll-behavior-y: none;
            }
            
            button {
              -webkit-tap-highlight-color: transparent;
              touch-action: manipulation;
            }
            
            input, select, textarea {
              font-size: 16px;
              -webkit-appearance: none;
            }
            
            input, 
            textarea, 
            [contenteditable] {
              -webkit-user-select: auto;
              user-select: auto;
            }
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
