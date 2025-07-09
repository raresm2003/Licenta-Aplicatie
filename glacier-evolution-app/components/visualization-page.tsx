"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, TrendingDown, TrendingUp, Minus } from "lucide-react"
import Link from "next/link"
import { GlacierGraph } from "./glacier-graph"
import { ImageViewer } from "./image-viewer"

interface GlacierDataEntry {
  year: number
  area: number
}

export function VisualizationPage({ params }: { params: Promise<{ id: string }> }) {
  const [glacierId, setGlacierId] = useState<string>("")
  const [glacierData, setGlacierData] = useState<GlacierDataEntry[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(2023)
  const [isLoading, setIsLoading] = useState(true)
  const [meta, setMeta] = useState<{ name: string, trend: number | null }>({ name: "", trend: null })

  useEffect(() => {
    params.then(async ({ id }) => {
      setGlacierId(id)
      try {
        const res = await fetch(`http://localhost:5000/zones`)
        const zones = await res.json()
        const found = zones.find((z: any) => z.id === id)
        if (!found || !found.areaByYear) return

        const areaMap = found.areaByYear as Record<string, number>

        const entries: GlacierDataEntry[] = Object.entries(areaMap)
          .map(([year, area]) => ({
            year: +year,
            area
          }))
          .sort((a, b) => a.year - b.year)

        setGlacierData(entries)
        setSelectedYear(entries[entries.length - 1].year)
        setMeta({
          name: found.name || found.id,
          trend: typeof found.trend === "number" ? found.trend : null
        })
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to load zone data:", err)
        setIsLoading(false)
      }
    })
  }, [params])

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendTextColor = (trend: number) => {
    if (trend > 0) return "text-green-600"
    if (trend < 0) return "text-red-600"
    return "text-gray-500"
  }

  if (!glacierData.length || isLoading) {
    return <div className="p-8 text-gray-600 text-lg">Loading...</div>
  }

  const years = glacierData.map(entry => entry.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/visualization" className="hover:text-blue-600 transition">
            <ArrowLeft className="w-8 h-8" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{meta.name}</h1>
            {meta.trend !== null && (
              <div className={`flex items-center gap-2 text-base ${getTrendTextColor(meta.trend)}`}>
                {getTrendIcon(meta.trend)}
                <span>{meta.trend.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <GlacierGraph data={glacierData} />
        </div>

        <ImageViewer
          selectedYear={selectedYear}
          glacierName={meta.name}
          onYearChange={setSelectedYear}
          minYear={minYear}
          maxYear={maxYear}
        />
      </div>
    </div>
  )
}
