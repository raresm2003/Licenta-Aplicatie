import { VisualizationPage } from "@/components/visualization-page"

export default function Visualization({ params }: { params: Promise<{ id: string }> }) {
  return <VisualizationPage params={params} />
}
