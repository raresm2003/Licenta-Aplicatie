"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mountain, TrendingDown, TrendingUp, Minus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface GlacierZone {
  id: string
  name: string
  trend?: number
  filenames?: Record<string, string>
  areaByYear?: Record<string, number>
}

export function AreaSelector() {
  const [glacierAreas, setGlacierAreas] = useState<GlacierZone[]>([])

  useEffect(() => {
    fetch("http://localhost:5000/zones")
      .then(res => res.json())
      .then(data => setGlacierAreas(data))
      .catch(err => console.error("❌ Failed to load glacier zones:", err))
  }, [])

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

  const getLatestImage = (glacier: GlacierZone): string | null => {
    if (!glacier.areaByYear || !glacier.filenames) return null
    const years = Object.keys(glacier.areaByYear).map(Number)
    const latestYear = Math.max(...years)
    const fname = glacier.filenames[latestYear.toString()]
    if (!fname) return null
    const dir = glacier.name.replace(/\s+/g, "")
    return `http://localhost:5000/images/glaciers/${dir}/original/${fname}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {glacierAreas.map((glacier) => {
        const imageUrl = getLatestImage(glacier)
        return (
          <Card
            key={glacier.id}
            className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mountain className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl">{glacier.name}</CardTitle>
                </div>
                {glacier.trend !== undefined && (
                  <div className={`flex items-center gap-1 ${getTrendTextColor(glacier.trend)}`}>
                    {getTrendIcon(glacier.trend)}
                    <span className="text-sm font-medium">
                      {glacier.trend.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            {imageUrl && (
              <div className="relative aspect-square bg-gray-100 rounded-md overflow-hidden mx-4 mb-4">
                <Image
                  src={imageUrl}
                  alt={`Latest image of ${glacier.name}`}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <CardContent className="space-y-4">
              <Link href={`/visualization/${glacier.id}`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">View Evolution</Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
