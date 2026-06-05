import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { PWARegister } from '@/components/pwa-register'
import { SplashHide } from '@/components/splash-hide'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Pocket Medical Calculator — Clinical Calculator Platform',
    template: '%s | Pocket Medical Calculator',
  },
  description:
    'Professional clinical calculators for healthcare providers. eGFR, Child-Pugh, MELD-Na, SOFA, BMI, EDD, Vasopressor Score, TSAT and more.',
  keywords: [
    'medical calculator', 'clinical calculator', 'eGFR', 'SOFA score',
    'Child-Pugh', 'MELD', 'BMI', 'TSAT', 'vasopressor score',
    'hospital tool', 'ICU calculator',
  ],
  authors: [{ name: 'Pocket Medical Calculator' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pocket Medical Calculator',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Pocket Medical Calculator — Clinical Calculator Platform',
    description: 'Professional clinical calculators for healthcare providers',
    siteName: 'Pocket Medical Calculator',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0F2744',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pocket Medical Calculator" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0891b2" />
      </head>
      <body className="antialiased min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
        <PWARegister />
        <SplashHide />
      </body>
    </html>
  )
}
