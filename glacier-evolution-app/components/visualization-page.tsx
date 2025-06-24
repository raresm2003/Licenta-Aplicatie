"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { GlacierGraph } from "./glacier-graph"
import { YearSlider } from "./year-slider"
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
  const [meta, setMeta] = useState<{ name: string, location: string }>({ name: "", location: "" })

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
            area // already in km²
          }))
          .sort((a, b) => a.year - b.year)

        setGlacierData(entries)
        setSelectedYear(entries[entries.length - 1].year)
        setMeta({
          name: found.name || found.id,
          location: `Lat: ${found.bbox[1].toFixed(2)}–${found.bbox[3].toFixed(2)}, Lon: ${found.bbox[0].toFixed(2)}–${found.bbox[2].toFixed(2)}`
        })
        setIsLoading(false)
      } catch (err) {
        console.error("Failed to load zone data:", err)
        setIsLoading(false)
      }
    })
  }, [params])

  if (!glacierData.length || isLoading) {
    return <div className="p-8 text-gray-600 text-lg">Loading...</div>
  }

  const years = glacierData.map(entry => entry.year)
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Overview
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{meta.name}</h1>
            <p className="text-gray-600">{meta.location}</p>
          </div>
        </div>

        <div className="mb-8">
          <GlacierGraph data={glacierData} />
        </div>

        <div className="mb-6">
          <ImageViewer selectedYear={selectedYear} glacierName={meta.name} />
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
