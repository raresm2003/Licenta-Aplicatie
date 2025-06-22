"use client"

import dynamic from "next/dynamic"

import { AreaSelector } from "@/components/area-selector"

const GlacierSelector = dynamic(() => import("@/components/glacier-selector"), {
  ssr: false
})

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Glacier Evolution Monitor</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the evolution of glacier areas over time through satellite imagery and data visualization
          </p>
        </div>
        <GlacierSelector />
      </div>
    </div>
  )
}
