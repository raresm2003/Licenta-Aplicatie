"use client"

import { useMemo, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import { calculateLinearTrend } from "@/utils/calculateTrend"

interface GlacierDataPoint {
  year: number
  area: number | null
  trend?: number
}

interface GlacierGraphProps {
  data: GlacierDataPoint[]
}

export function GlacierGraph({ data }: GlacierGraphProps) {
  const completeData: GlacierDataPoint[] = useMemo(() => {
    const years = data.map(d => d.year)
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)

    const yearMap = new Map<number, number | null>(
      data.map(d => [d.year, d.area ?? null])
    )

    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
      const year = minYear + i
      const area = yearMap.has(year) ? yearMap.get(year)! : null
      return { year, area }
    })
  }, [data])

  const mergedData = useMemo(() => {
    return calculateLinearTrend(completeData)
  }, [completeData])

  useEffect(() => {
    const known = completeData.filter(d => d.area != null)
    if (known.length < 2) return

    const sorted = [...known].sort((a, b) => a.year - b.year)
    const lastYear = sorted[sorted.length - 1]
    const tenYearsAgo = sorted.findLast(d => d.year <= lastYear.year - 10)

    if (lastYear && tenYearsAgo) {
      const percentDrop = ((tenYearsAgo.area! - lastYear.area!) / tenYearsAgo.area!) * 100
      console.log(
        `🧊 Glacier shrunk by ${percentDrop.toFixed(2)}% from ${tenYearsAgo.year} (${tenYearsAgo.area} km²) to ${lastYear.year} (${lastYear.area} km²)`
      )
    } else {
      console.log("🔍 Not enough historical data for 10-year comparison.")
    }
  }, [completeData])

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Glacier Area Evolution</CardTitle>
        <p className="text-sm text-gray-600">Area coverage over time (km²)</p>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            area: {
              label: "Area (km²)",
              color: "hsl(var(--chart-1))"
            },
            trend: {
              label: "Trend Line",
              color: "#ef4444"
            }
          }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedData}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} tickLine={{ stroke: "#e5e7eb" }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: "#e5e7eb" }}
                label={{ value: "Area (km²)", angle: -90, position: "insideLeft" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="area"
                stroke="var(--color-area)"
                strokeWidth={3}
                connectNulls={true}
                dot={{ fill: "var(--color-area)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-area)", strokeWidth: 2 }}
                name="Actual Area"
              />
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeWidth={2}
                connectNulls
                dot={{ fill: "#38bdf8", r: 2 }}
                activeDot={{ r: 3, stroke: "#38bdf8", strokeWidth: 1 }}
                name="Trend Line"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
