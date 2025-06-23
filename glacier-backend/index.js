require("dotenv").config()
const express = require("express")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const mkdirp = require("mkdirp")
const cors = require("cors")
const turf = require('@turf/turf')

const app = express()
const PORT = 5000
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const INSTANCE_ID = "d695dc9b-af46-494d-ac3b-28efc18067db" // ✅ Your Sentinel Hub instance

app.use(express.json())
app.use(cors())

async function getAccessToken() {
    const res = await axios.post(
        "https://services.sentinel-hub.com/oauth/token",
        new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "client_credentials"
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )
    return res.data.access_token
}

async function getBestLandsatImageDate(token, bbox, year) {
    const CATALOG_URL = "https://services-uswest2.sentinel-hub.com/api/v1/catalog/search"

    const res = await axios.post(
        CATALOG_URL,
        {
            bbox,
            datetime: `${year}-08-01T00:00:00Z/${year}-09-30T23:59:59Z`,
            collections: ["landsat-ot-l2"],
            limit: 50,
            query: {
                "eo:cloud_cover": { lte: 10 }
            }
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        }
    )

    const results = res.data.features || []
    if (results.length === 0) return null

    const areaOfInterest = turf.bboxPolygon(bbox)

    const fullyCovering = results.filter(feature => {
        if (!feature.geometry) return false
        const footprint = turf.feature(feature.geometry)
        return turf.booleanContains(footprint, areaOfInterest)
    })

    if (fullyCovering.length === 0) return null

    fullyCovering.sort((a, b) =>
        (a.properties["eo:cloud_cover"] || 100) - (b.properties["eo:cloud_cover"] || 100)
    )

    return fullyCovering[0].properties.datetime
}

function buildEvalscript() {
    return `//VERSION=3
function setup() {
  return {
    input: [{
      bands: ["B04", "B03", "B02", "dataMask"],
      units: "REFLECTANCE"
    }],
    output: { bands: 3 }
  }
}

function evaluatePixel(sample) {
  if (sample.dataMask === 0) {
    return [0, 0, 0]
  }
  // Stretch reflectance (0–0.3) to RGB range
  const scale = val => Math.min(1, sample[val] / 0.3)
  return [scale("B04"), scale("B03"), scale("B02")]
}`
}

app.post("/download-images", async (req, res) => {
    const { south, west, north, east, years, outputDir = "glacier_images" } = req.body
    const folder = path.join(__dirname, outputDir)
    mkdirp.sync(folder)

    try {
        const token = await getAccessToken()
        const bbox = [west, south, east, north]

        for (const year of years) {
            if (year < 2013) {
                console.log(`⏭ Skipping ${year} (Landsat 8 not available)`)
                continue
            }

            console.log(`📅 Searching best Landsat 8 image for ${year}...`)
            const bestDate = await getBestLandsatImageDate(token, bbox, year)
            if (!bestDate) {
                console.log(`❌ No image found for ${year}`)
                continue
            }

            const response = await axios.post(
                `https://services-uswest2.sentinel-hub.com/api/v1/process?instanceId=${INSTANCE_ID}`,
                {
                    input: {
                        bounds: {
                            bbox,
                            properties: {
                                crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
                            }
                        },
                        data: [
                            {
                                type: "landsat-ot-l2",
                                dataFilter: {
                                    timeRange: {
                                        from: bestDate,
                                        to: bestDate
                                    },
                                    maxCloudCoverage: 20
                                }
                            }
                        ]
                    },
                    output: {
                        width: 1024,
                        height: 1024,
                        responses: [
                            {
                                identifier: "default",
                                format: { type: "image/png" }
                            }
                        ]
                    },
                    evalscript: buildEvalscript()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        "Accept": "image/png"
                    },
                    responseType: "arraybuffer"
                }
            )

            const contentType = response.headers["content-type"]
            if (!contentType.includes("image/png")) {
                const errorText = Buffer.from(response.data).toString("utf-8")
                console.error(`🚨 ${year} error:\n`, errorText)
                continue
            }

            const fileName = `landsat_glacier_${year}_${bestDate.slice(0, 10)}.png`
            fs.writeFileSync(path.join(folder, fileName), response.data)
            console.log(`✅ Saved ${fileName}`)
        }

        res.status(200).json({ message: "✅ All Landsat 8 images downloaded." })
    } catch (err) {
        const readable = typeof err.response?.data === "object"
            ? JSON.stringify(err.response.data)
            : err.response?.data?.toString("utf-8") || err.message
        console.error("❌ Error:", readable)
        res.status(500).json({ error: "Download failed", details: readable })
    }
})

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
})
