"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { GlacierGraph } from "./glacier-graph"
import { YearSlider } from "./year-slider"
import { ImageViewer } from "./image-viewer"
import { loadCSV, GlacierDataEntry } from '@/utils/loadCSV'

const glacierMeta = {
  "glacier-a": {
    name: "Glacier H1",
    location: "Himalayas",
    csv: "/data/glacier_area_data_H1.csv"
  },
  "glacier-b": {
    name: "Glacier H2",
    location: "Himalayas",
    csv: "/data/glacier_area_data_H2.csv"
  }
}

export function VisualizationPage({ params }: { params: Promise<{ id: string }> }) {
  const [glacierId, setGlacierId] = useState<string>("")
  const [glacierData, setGlacierData] = useState<GlacierDataEntry[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2023)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    params.then(async ({ id }) => {
      setGlacierId(id)
      const glacier = glacierMeta[id as keyof typeof glacierMeta]
      if (!glacier) return

      try {
        const data = await loadCSV(glacier.csv)
        setGlacierData(data)
        if (data.length > 0) {
          setSelectedYear(data[data.length - 1].year) // Set to most recent year
        }
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to load CSV:", err)
        setIsLoading(false)
      }
    })
  }, [params])

  const glacier = glacierMeta[glacierId as keyof typeof glacierMeta]

  if (!glacier || isLoading) {
    return <div className="p-8 text-gray-600 text-lg">Loading...</div>
  }

  const years = glacierData.map(entry => entry.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{glacier.name}</h1>
            <p className="text-gray-600">{glacier.location}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="mb-8">
          <GlacierGraph data={glacierData} />
        </div>

        {/* Images + Slider underneath */}
        <div className="mb-6">
          <ImageViewer selectedYear={selectedYear} glacierName={glacier.name} />
        </div>

        <div className="mt-[-1rem] mb-4 -translate-y-4">
          <YearSlider
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            minYear={minYear}
            maxYear={maxYear}
          />
        </div>
      </div>
    </div>
  )
}
