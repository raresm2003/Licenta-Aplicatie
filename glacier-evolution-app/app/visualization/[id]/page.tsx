"use client"

import { VisualizationPage } from "@/components/visualization-page"

export default function IndividualVisualization({ params }: { params: Promise<{ id: string }> }) {
  return <VisualizationPage params={params} />
}
