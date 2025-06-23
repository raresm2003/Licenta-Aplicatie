"use client"

import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useState, useEffect } from "react"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"

type BBox = [[number, number], [number, number]]

function CenterWatcher({ onChange }: { onChange: (bbox: BBox) => void }) {
    const map = useMap()

    useEffect(() => {
        const updateBBox = () => {
            const container = map.getSize() // full map size in pixels
            const boxSize = 256 // same as CSS box size

            const halfBox = boxSize / 2
            const center = map.latLngToContainerPoint(map.getCenter())

            // Get corners of the selection box in pixel coords
            const topLeft = center.subtract([halfBox, halfBox])
            const bottomRight = center.add([halfBox, halfBox])

            // Convert those to lat/lng
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

    const handleSave = async () => {
        const [south, west] = bbox[0]
        const [north, east] = bbox[1]

        try {
            const res = await fetch("http://localhost:5000/download-images", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json" // ✅ FIXED: explicitly required by Sentinel Hub
                },
                body: JSON.stringify({
                    south, west, north, east,
                    years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
                })
            })

            if (!res.ok) throw new Error("Download failed")
            alert("✅ Images successfully saved on the server.")
        } catch (err) {
            console.error("❌ Failed to download:", err)
            alert("❌ Error downloading images.")
        }
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

            <Button className="w-full" onClick={handleSave}>
                Download Images (2016–2023)
            </Button>
        </div>
    )
}

export default GlacierSelector
