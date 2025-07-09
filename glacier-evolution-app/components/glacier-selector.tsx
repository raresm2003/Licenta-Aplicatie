"use client"

import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useState, useEffect } from "react"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type BBox = [[number, number], [number, number]]

function CenterWatcher({ onChange }: { onChange: (bbox: BBox) => void }) {
    const map = useMap()

    useEffect(() => {
        const updateBBox = () => {
            const container = map.getSize()
            const boxSize = 256
            const halfBox = boxSize / 2
            const center = map.latLngToContainerPoint(map.getCenter())

            const topLeft = center.subtract([halfBox, halfBox])
            const bottomRight = center.add([halfBox, halfBox])

            const sw = map.containerPointToLatLng(bottomRight)
            const ne = map.containerPointToLatLng(topLeft)

            const bbox: BBox = [
                [sw.lat, sw.lng],
                [ne.lat, ne.lng]
            ]
            onChange(bbox)
        }

        updateBBox()
        map.on("moveend zoomend", updateBBox)
        return () => {
            map.off("moveend", updateBBox)
            map.off("zoomend", updateBBox)
        }
    }, [map, onChange])

    return null
}

export function GlacierSelector() {
    const router = useRouter()

    const [bbox, setBbox] = useState<BBox>([[27.95, 86.85], [28.05, 86.95]])
    const [open, setOpen] = useState(false)
    const [zoneName, setZoneName] = useState("")
    const [existingNames, setExistingNames] = useState<string[]>([])
    const [nameTaken, setNameTaken] = useState(false)

    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [statusMessage, setStatusMessage] = useState("")

    useEffect(() => {
        fetch("http://localhost:5000/zones")
            .then(res => res.json())
            .then(data => setExistingNames(data.map((z: any) => z.name.toLowerCase())))
            .catch(err => console.error("❌ Failed to fetch existing zone names:", err))
    }, [])

    useEffect(() => {
        setNameTaken(existingNames.includes(zoneName.toLowerCase()))
    }, [zoneName, existingNames])

    const handleStartAnalysis = async () => {
        const [south, west] = bbox[0]
        const [north, east] = bbox[1]

        setLoading(true)
        setDone(false)
        setStatusMessage("📥 Downloading images...")

        try {
            const downloadRes = await fetch("http://localhost:5000/start-download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    south, west, north, east,
                    years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
                    zoneName
                })
            })

            const downloadJson = await downloadRes.json()
            if (!downloadRes.ok) {
                setStatusMessage(`❌ ${downloadJson.error || "Download failed."}`)
                return
            }

            const { zonePath } = downloadJson
            setStatusMessage("🧠 Analyzing images...")

            const analysisRes = await fetch("http://localhost:5000/run-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ zonePath })
            })

            const analysisJson = await analysisRes.json()
            if (!analysisRes.ok) {
                setStatusMessage(`❌ ${analysisJson.error || "Analysis failed."}`)
                return
            }

            setStatusMessage("✅ Analysis complete")
            setDone(true)
        } catch (err) {
            console.error(err)
            setStatusMessage("❌ Unexpected error during analysis")
        } finally {
            setLoading(false)
        }
    }

    const resetAndClose = () => {
        if (done && zoneName.trim()) {
            router.push(`/visualization/${zoneName.trim()}`)
            return
        }

        setOpen(false)
        setZoneName("")
        setLoading(false)
        setDone(false)
        setStatusMessage("")
        setNameTaken(false)
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg relative">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Select Glacier Area</h2>
            <p className="text-sm text-gray-600 mb-4">Pan or zoom the map to position the selection box.</p>

            <div className="h-[500px] rounded-md overflow-hidden mb-4 relative">
                <MapContainer
                    center={[35.0, 90.0]}
                    zoom={4}
                    style={{ height: "100%", width: "100%" }}
                    attributionControl={false}
                    zoomSnap={0.1}
                    zoomDelta={0.1}
                    wheelPxPerZoomLevel={60}
                >
                    <TileLayer
                        attribution=""
                        url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    />
                    <CenterWatcher onChange={setBbox} />
                </MapContainer>

                <div className="pointer-events-none absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-blue-600 bg-transparent rounded-md shadow-md z-[999]" />
            </div>

            <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                    setOpen(true)
                    setStatusMessage("")
                    setDone(false)
                }}
            >
                Analyse Area
            </Button>

            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    if (!loading) setOpen(isOpen)
                }}
            >
                <DialogContent className="flex flex-col items-center text-center max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-800">Give a name to this zone</DialogTitle>
                    </DialogHeader>

                    {!loading && !done && !statusMessage.startsWith("❌") && (
                        <>
                            <Input
                                value={zoneName}
                                onChange={(e) => setZoneName(e.target.value)}
                                placeholder="e.g. everest_south"
                                className="my-4 text-base h-10"
                            />
                            {nameTaken && (
                                <p className="text-sm text-red-600 -mt-3 mb-2">A zone with this name already exists.</p>
                            )}
                        </>
                    )}

                    {statusMessage && (
                        <div className="flex flex-col items-center my-4">
                            {loading && !statusMessage.startsWith("❌") && !statusMessage.startsWith("✅") && (
                                <Loader2 className="animate-spin w-6 h-6 text-blue-600 mb-2" />
                            )}
                            <p className={`text-base font-medium ${statusMessage.startsWith("❌")
                                ? "text-red-600"
                                : statusMessage.startsWith("✅")
                                    ? "text-green-600"
                                    : "text-gray-700"
                                }`}>{statusMessage}</p>
                        </div>
                    )}

                    <div className="flex justify-center w-full mt-2">
                        {!loading && !done && !statusMessage.startsWith("❌") && (
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={handleStartAnalysis}
                                disabled={!zoneName.trim() || nameTaken}
                            >
                                Start Analysis
                            </Button>
                        )}

                        {!loading && done && (
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={resetAndClose}
                            >
                                Done
                            </Button>
                        )}

                        {!loading && statusMessage.startsWith("❌") && (
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={resetAndClose}
                            >
                                Select New Area
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default GlacierSelector
