import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/header"
import Image from "next/image"
import bgImage from "@/public/background.png"

export const metadata: Metadata = {
  title: "GlacierView",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen overflow-x-hidden">
        <div className="fixed inset-0 -z-10">
          <Image
            src={bgImage}
            alt="Background"
            fill
            className="object-cover opacity-100"
            priority
          />
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" />
        </div>

        <div className="fixed top-0 left-0 right-0 z-20 bg-white/70 backdrop-blur-sm shadow-sm">
          <Header />
        </div>

        <main className="container mx-auto px-4 py-6 pt-24">
          {children}
        </main>
      </body>
    </html>
  )
}

