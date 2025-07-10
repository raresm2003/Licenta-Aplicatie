"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mountain, TrendingDown, TrendingUp, Minus, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GlacierZone {
  id: string
  name: string
  trend?: number
  filenames?: Record<string, string>
  areaByYear?: Record<string, number>
}

type SortMode = "neutral" | "best" | "worst" | "oldest"

export function AreaSelector() {
  const [glacierAreas, setGlacierAreas] = useState<GlacierZone[]>([])
  const [selectedZone, setSelectedZone] = useState<GlacierZone | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortMode>("neutral")

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

  const handleDelete = async () => {
    if (!selectedZone) return
    try {
      await fetch(`http://localhost:5000/delete-zone/${selectedZone.id}`, {
        method: "DELETE"
      })
      setGlacierAreas(prev => prev.filter(g => g.id !== selectedZone.id))
      setDialogOpen(false)
    } catch (err) {
      console.error("❌ Failed to delete zone:", err)
    }
  }

  const filteredAndSortedZones = useMemo(() => {
    let filtered = glacierAreas.filter(g =>
      g.name.toLowerCase().includes(search.toLowerCase())
    )

    switch (sort) {
      case "best":
        return [...filtered].sort((a, b) => (b.trend ?? -Infinity) - (a.trend ?? -Infinity))
      case "worst":
        return [...filtered].sort((a, b) => (a.trend ?? Infinity) - (b.trend ?? Infinity))
      case "oldest":
        return [...filtered].sort((a, b) => {
          const aYears = a.areaByYear ? Object.keys(a.areaByYear).map(Number) : []
          const bYears = b.areaByYear ? Object.keys(b.areaByYear).map(Number) : []
          return Math.min(...aYears) - Math.min(...bYears)
        })
      case "neutral":
      default:
        return [...filtered]
          .sort((a, b) => {
            const aYears = a.areaByYear ? Object.keys(a.areaByYear).map(Number) : []
            const bYears = b.areaByYear ? Object.keys(b.areaByYear).map(Number) : []
            return Math.min(...aYears) - Math.min(...bYears)
          })
          .reverse()
    }
  }, [glacierAreas, search, sort])

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Input
          type="text"
          placeholder="Search glacier by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <Select value={sort} onValueChange={(val: SortMode) => setSort(val)}>
          <SelectTrigger className="w-48 text-center justify-center">
            <SelectValue placeholder="Sort" className="text-center" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neutral">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="best">Best → Worst (%)</SelectItem>
            <SelectItem value="worst">Worst → Best (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredAndSortedZones.map((glacier) => {
          const imageUrl = getLatestImage(glacier)
          return (
            <Card
              key={glacier.id}
              className="hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm border-0 shadow-md relative"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mountain className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-xl flex items-center gap-3">
                      <span className="flex items-center gap-1 font-bold">
                        {glacier.name}
                        {glacier.trend !== undefined && (
                          <span className={`flex items-center gap-1 text-base ${getTrendTextColor(glacier.trend)}`}>
                            {getTrendIcon(glacier.trend)}
                            <span>{glacier.trend.toFixed(2)}%</span>
                          </span>
                        )}
                      </span>
                    </CardTitle>
                  </div>
                  <button
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => { setSelectedZone(glacier); setDialogOpen(true) }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex flex-col items-center justify-center text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 text-lg mt-2">
            Are you sure you want to delete <strong>{selectedZone?.name}</strong>?
          </p>
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
