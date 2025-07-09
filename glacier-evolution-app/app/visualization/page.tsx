"use client"

import dynamic from "next/dynamic"
import { AreaSelector } from "@/components/area-selector"

export default function Visualization() {
    return (
        <div className="min-h-screen bg-transparent">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Analysed Zones</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Browse through previously analyzed glacier zones and explore their evolution
                    </p>
                </div>
                <AreaSelector />
            </div>
        </div>
    )
}
