"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useEffect, useState } from "react"

interface ImageViewerProps {
  selectedYear: number
  glacierName: string
}

export function ImageViewer({ selectedYear, glacierName }: ImageViewerProps) {
  const glacierDir = glacierName.replace(/\s+/g, "")
  const [originalFilename, setOriginalFilename] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:5000/zones")
      .then(res => res.json())
      .then((zones) => {
        const zone = zones.find((z: any) => (z.name || z.id).replace(/\s+/g, "") === glacierDir)
        const fname = zone?.filenames?.[selectedYear.toString()] ?? `${selectedYear}.png`
        setOriginalFilename(fname)
      })
      .catch(err => {
        console.error("Failed to load zones:", err)
        setOriginalFilename(`${selectedYear}.png`)
      })
  }, [glacierDir, selectedYear])

  if (!originalFilename) return null

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Satellite Imagery - {selectedYear}</CardTitle>
        <p className="text-sm text-gray-600">
          Original satellite image and glacier boundary overlay for {glacierName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Satellite Image */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Original Satellite Image</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={`http://localhost:5000/images/glaciers/${glacierDir}/original/${originalFilename}`}
                alt={`${glacierName} satellite image ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {selectedYear}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              High-resolution satellite imagery showing the glacier and surrounding terrain
            </p>
          </div>

          {/* Overlay Image */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Glacier Boundary Overlay</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={`http://localhost:5000/images/glaciers/${glacierDir}/overlays/${selectedYear}_overlay.png`}
                alt={`${glacierName} boundary overlay ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Boundary: {selectedYear}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Processed image highlighting glacier boundaries and ice coverage areas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
