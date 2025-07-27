import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { CartProvider } from "@/contexts/CartContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VendorMitra - B2B Marketplace for Street Food Vendors",
  description: "Connect street food vendors with verified raw material suppliers across India",
  keywords: "street food, vendors, suppliers, B2B marketplace, raw materials, India",
  authors: [{ name: "VendorMitra Team" }],
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e40af',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VendorMitra" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
