"use client"

import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useState, useEffect } from "react"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

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
    const [bbox, setBbox] = useState<BBox>([[27.95, 86.85], [28.05, 86.95]])
    const [open, setOpen] = useState(false)
    const [zoneName, setZoneName] = useState("")
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleStartAnalysis = async () => {
        const [south, west] = bbox[0]
        const [north, east] = bbox[1]

        setLoading(true)

        try {
            const res = await fetch("http://localhost:5000/analyze-zone", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    south, west, north, east,
                    years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
                    zoneName
                })
            })

            if (!res.ok) throw new Error("Analysis failed")
            setDone(true)
        } catch (err) {
            console.error("❌ Error:", err)
            alert("❌ Failed to analyze area.")
            setDone(false)
        } finally {
            setLoading(false)
        }
    }

    const resetAndClose = () => {
        setOpen(false)
        setZoneName("")
        setLoading(false)
        setDone(false)
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg relative">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Select Glacier Area</h2>
            <p className="text-sm text-gray-600 mb-4">Pan or zoom the map to position the selection box.</p>

            <div className="h-[500px] rounded-md overflow-hidden mb-4 relative">
                <MapContainer center={[28.0, 86.9]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution="&copy; Google"
                        url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    />
                    <CenterWatcher onChange={setBbox} />
                </MapContainer>

                <div className="pointer-events-none absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-blue-600 bg-transparent rounded-md shadow-md z-[999]" />
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setOpen(true)}>
                Analyse Area
            </Button>

            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    if (!loading) setOpen(isOpen)
                }}
            >
                <DialogContent className="flex flex-col items-center text-center">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Give a name to this zone</DialogTitle>
                    </DialogHeader>

                    {!loading && !done && (
                        <Input
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            placeholder="e.g. everest_2024_south"
                            className="my-4"
                        />
                    )}

                    {loading && (
                        <div className="flex flex-col items-center my-4">
                            <Loader2 className="animate-spin w-6 h-6 text-blue-600 mb-2" />
                            <p className="text-sm text-gray-600">Analyzing... Please wait.</p>
                        </div>
                    )}

                    {done && (
                        <p className="text-green-600 font-medium mt-2 mb-4">✅ Download complete!</p>
                    )}

                    <div className="flex justify-center w-full mt-4">
                        {!loading && !done && (
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={handleStartAnalysis}
                                disabled={!zoneName.trim()}
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
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default GlacierSelector
