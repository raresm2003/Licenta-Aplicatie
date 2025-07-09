"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"

interface ImageViewerProps {
  selectedYear: number
  glacierName: string
  onYearChange: (year: number) => void
  minYear: number
  maxYear: number
}

export function ImageViewer({ selectedYear, glacierName, onYearChange, minYear, maxYear }: ImageViewerProps) {
  const glacierDir = glacierName.replace(/\s+/g, "")
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  useEffect(() => {
    fetch("http://localhost:5000/zones")
      .then(res => res.json())
      .then((zones) => {
        const zone = zones.find((z: any) => (z.name || z.id).replace(/\s+/g, "") === glacierDir)
        const years = zone?.filenames ? Object.keys(zone.filenames).map(Number) : []
        years.sort((a, b) => a - b)
        setAvailableYears(years)

        if (!years.includes(selectedYear)) {
          const fallbackYear = years[years.length - 1] ?? minYear
          onYearChange(fallbackYear)
        }

        const fname = zone?.filenames?.[selectedYear.toString()] ?? `${selectedYear}.png`
        setOriginalFilename(fname)
      })
      .catch(err => {
        console.error("Failed to load zones:", err)
        setAvailableYears([])
        setOriginalFilename(null)
      })
  }, [glacierDir, selectedYear, onYearChange, minYear])

  if (!originalFilename || !availableYears.includes(selectedYear)) return null

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">
          Satellite Imagery - <span className="text-blue-600">{selectedYear}</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Original satellite image, glacier overlay and segmentation mask for{" "}
          <span className="font-semibold text-blue-600">{glacierName}</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
          {/* Original Satellite Image */}
          <div className="max-w-md w-full space-y-3">
            <h3 className="font-semibold text-gray-800 text-center">Original Satellite Image</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mx-auto">
              <Image
                src={`http://localhost:5000/images/glaciers/${glacierDir}/original/${originalFilename}`}
                alt={`${glacierName} satellite image ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Original: {selectedYear}
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Raw satellite imagery showing the glacier and surroundings
            </p>
          </div>

          {/* Overlay Image */}
          <div className="max-w-md w-full space-y-3">
            <h3 className="font-semibold text-gray-800 text-center">Boundary Overlay</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mx-auto">
              <Image
                src={`http://localhost:5000/images/glaciers/${glacierDir}/overlays/${selectedYear}_overlay.png`}
                alt={`${glacierName} boundary overlay ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Overlay: {selectedYear}
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Highlighted glacier boundary from model inference
            </p>
          </div>

          {/* Mask Image */}
          <div className="max-w-md w-full space-y-3">
            <h3 className="font-semibold text-gray-800 text-center">Segmentation Mask</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mx-auto">
              <Image
                src={`http://localhost:5000/images/glaciers/${glacierDir}/masks/${selectedYear}_mask.png`}
                alt={`${glacierName} mask ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Mask: {selectedYear}
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Binary segmentation mask of glacier area
            </p>
          </div>
        </div>

        {/* Slider for valid years */}
        {availableYears.length > 0 && (
          <div className="mt-6 px-4">
            <Slider
              value={[selectedYear]}
              onValueChange={(value) => {
                const rounded = Math.round(value[0])
                if (availableYears.includes(rounded)) {
                  onYearChange(rounded)
                }
              }}
              min={availableYears[0]}
              max={availableYears[availableYears.length - 1]}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{availableYears[0]}</span>
              <span>{availableYears[availableYears.length - 1]}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
