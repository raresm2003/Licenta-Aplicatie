"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface ImageViewerProps {
  selectedYear: number
  glacierName: string // e.g. "Glacier H1" or "Glacier H2"
}

export function ImageViewer({ selectedYear, glacierName }: ImageViewerProps) {
  // Convert "Glacier H1" -> "GlacierH1" -> directory: "GlacierH1"
  const glacierDir = glacierName.replace(/\s+/g, "")

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Satellite Imagery - {selectedYear}</CardTitle>
        <p className="text-sm text-gray-600">Original satellite image and glacier boundary overlay for {glacierName}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Satellite Image */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Original Satellite Image</h3>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={`/images/glaciers/${glacierDir}/original/H_${selectedYear}.png`}
                alt={`${glacierName} satellite image ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/20 to-white/20" />
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
                src={`/images/glaciers/${glacierDir}/overlay/H_${selectedYear}_overlay.png`}
                alt={`${glacierName} boundary overlay ${selectedYear}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/30 to-blue-300/30" />
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
