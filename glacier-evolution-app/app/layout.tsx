import type { Metadata } from "next"
import "./globals.css"
import { Header } from "@/components/header"
import Image from "next/image"
import bgImage from "@/public/background.png" // or wherever you placed your image

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
        {/* Background image */}
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

        {/* Content */}
        <Header />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
