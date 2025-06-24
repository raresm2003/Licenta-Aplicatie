"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mountain, TrendingDown } from "lucide-react"
import Link from "next/link"

interface GlacierZone {
  id: string
  name: string
  location: string
  currentArea?: string
  trend?: number
  description?: string
}

export function AreaSelector() {
  const [glacierAreas, setGlacierAreas] = useState<GlacierZone[]>([])

  useEffect(() => {
    fetch("http://localhost:5000/zones")
      .then(res => res.json())
      .then(data => setGlacierAreas(data))
      .catch(err => console.error("❌ Failed to load glacier zones:", err))
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {glacierAreas.map((glacier) => (
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
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">{glacier.trend.toFixed(1)}%</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">{glacier.location}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Area</p>
              <p className="text-2xl font-bold text-blue-700">
                {glacier.currentArea || "N/A"}
              </p>
            </div>
            <p className="text-sm text-gray-700">{glacier.description || ""}</p>
            <Link href={`/visualization/${glacier.id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">View Evolution</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
