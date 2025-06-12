"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface YearSliderProps {
  selectedYear: number
  onYearChange: (year: number) => void
  minYear: number
  maxYear: number
}

export function YearSlider({ selectedYear, onYearChange, minYear, maxYear }: YearSliderProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
      <CardContent className="space-y-4">
        {/* Slider at the top */}
        <div className="px-4 pt-4">
          <Slider
            value={[selectedYear]}
            onValueChange={(value) => onYearChange(value[0])}
            min={minYear}
            max={maxYear}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{minYear}</span>
            <span>{maxYear}</span>
          </div>
        </div>

        {/* Title and year text below */}
        <CardHeader className="pt-0">
          <CardTitle className="text-xl text-gray-900 text-center">Time Selection</CardTitle>
          <p className="text-sm text-gray-600 text-center">Select a year to view satellite imagery</p>
        </CardHeader>

        <div className="text-center">
          <div className="text-3xl font-bold text-blue-700">{selectedYear}</div>
          <div className="text-sm text-gray-600">Selected Year</div>
        </div>
      </CardContent>
    </Card>
  )
}
