require("dotenv").config()
const express = require("express")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const mkdirp = require("mkdirp")
const cors = require("cors")
const turf = require('@turf/turf')
const { exec } = require("child_process")

const app = express()
const PORT = 5000
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const INSTANCE_ID = "d695dc9b-af46-494d-ac3b-28efc18067db"

app.use(express.json())
app.use(cors())

app.use("/images/glaciers", express.static(path.join(__dirname, "glacier_analyses")));

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
                "eo:cloud_cover": { lte: 15 }
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
    input: [{ bands: ["B04", "B03", "B02", "dataMask"], units: "REFLECTANCE" }],
    output: { bands: 3 }
  }
}
function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0]
  const scale = val => Math.min(1, sample[val] / 0.3)
  return [scale("B04"), scale("B03"), scale("B02")]
}`
}

app.post("/start-download", async (req, res) => {
    const { south, west, north, east, years, zoneName } = req.body

    if (!south || !west || !north || !east || !zoneName || !Array.isArray(years)) {
        console.warn("⚠️ Missing parameters in request:", req.body)
        return res.status(400).json({ error: "Missing required parameters" })
    }

    const baseFolder = path.join(__dirname, "glacier_analyses", zoneName)
    const originalFolder = path.join(baseFolder, "original")
    mkdirp.sync(originalFolder)

    console.log(`📁 Created folder for zone "${zoneName}"`)

    try {
        const token = await getAccessToken()
        const bbox = [west, south, east, north]

        let successfulImages = 0
        const downloadedImages = []

        for (const year of years) {
            if (year < 2013) {
                console.log(`⏭ Skipping ${year} (Landsat 8 not available)`)
                continue
            }

            console.log(`🔍 Searching best image for year ${year}...`)
            const bestDate = await getBestLandsatImageDate(token, bbox, year)
            if (!bestDate) {
                console.warn(`⚠️ No image found for year ${year}`)
                continue
            }

            console.log(`📆 Best date for ${year}: ${bestDate}`)

            const response = await axios.post(
                `https://services-uswest2.sentinel-hub.com/api/v1/process?instanceId=${INSTANCE_ID}`,
                {
                    input: {
                        bounds: {
                            bbox,
                            properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" }
                        },
                        data: [
                            {
                                type: "landsat-ot-l2",
                                dataFilter: {
                                    timeRange: { from: bestDate, to: bestDate },
                                    maxCloudCoverage: 20
                                }
                            }
                        ]
                    },
                    output: {
                        width: 1024,
                        height: 1024,
                        responses: [
                            { identifier: "default", format: { type: "image/png" } }
                        ]
                    },
                    evalscript: buildEvalscript()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "image/png"
                    },
                    responseType: "arraybuffer"
                }
            )

            if (!response.headers["content-type"].includes("image/png")) {
                const errText = Buffer.from(response.data).toString("utf-8")
                console.error(`❌ Unexpected response for ${year}:`, errText)
                continue
            }

            const fileName = `landsat_glacier_${year}_${bestDate.slice(0, 10)}.png`
            const imagePath = path.join(originalFolder, fileName)
            fs.writeFileSync(imagePath, response.data)
            console.log(`✅ Saved image: ${fileName}`)

            successfulImages++
            downloadedImages.push(fileName)
        }

        if (successfulImages < 8) {
            console.warn(`⚠️ Only ${successfulImages} valid images. Deleting folder.`)
            fs.rmSync(baseFolder, { recursive: true, force: true })
            return res.status(400).json({ error: "Not enough images found!" })
        }

        const config = {
            name: zoneName,
            bbox: [west, south, east, north],
            years,
            createdAt: new Date().toISOString(),
            images: downloadedImages
        }
        fs.writeFileSync(path.join(baseFolder, "config.json"), JSON.stringify(config, null, 2))
        console.log(`📄 Saved config.json with ${successfulImages} images`)

        res.status(200).json({ message: "Download complete", zonePath: baseFolder })
    } catch (err) {
        const readable = err.response?.data?.toString("utf-8") || err.message
        console.error("❌ Download failed:", readable)

        if (fs.existsSync(baseFolder)) {
            fs.rmSync(baseFolder, { recursive: true, force: true })
            console.log("🧹 Cleaned up incomplete folder")
        }

        res.status(500).json({ error: "Download failed", details: readable })
    }
})



app.post("/run-analysis", (req, res) => {
    const { zonePath } = req.body
    if (!zonePath) {
        console.warn("⚠️ Missing zonePath in /run-analysis request")
        return res.status(400).json({ error: "Missing zone path" })
    }

    console.log(`🚀 Starting analysis for zone: ${zonePath}`)

    const child = exec(`"C:/Users/micle/AppData/Local/Programs/Python/Python312/python.exe" ml/infer.py "${zonePath}"`)

    child.stdout.on("data", data => process.stdout.write(data))
    child.stderr.on("data", data => process.stderr.write(data))

    child.on("exit", code => {
        if (code === 0) {
            console.log("✅ Python analysis completed successfully.")
            res.status(200).json({ message: "✅ Analysis complete." })
        } else {
            console.error(`❌ Python script failed with exit code ${code}`)
            res.status(500).json({ error: `Python script failed with code ${code}` })
        }
    })
})



app.get("/zones", (req, res) => {
    const zonesDir = path.join(__dirname, "glacier_analyses")

    if (!fs.existsSync(zonesDir)) {
        return res.status(200).json([])
    }

    const zoneFolders = fs.readdirSync(zonesDir).filter(name => {
        const fullPath = path.join(zonesDir, name)
        return fs.statSync(fullPath).isDirectory()
    })

    const zones = zoneFolders.map(folder => {
        const configPath = path.join(zonesDir, folder, "config.json")
        if (!fs.existsSync(configPath)) return null

        try {
            const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
            return {
                id: folder,
                ...config // includes name, bbox, years, areaByYear, trend, etc.
            }
        } catch (e) {
            console.warn(`Skipping zone ${folder} due to error:`, e.message)
            return null
        }
    }).filter(Boolean)

    res.json(zones)
})

app.delete("/delete-zone/:id", (req, res) => {
    const zoneId = req.params.id
    const zonePath = path.join(__dirname, "glacier_analyses", zoneId)

    if (!fs.existsSync(zonePath)) {
        return res.status(404).json({ error: "Zone not found" })
    }

    fs.rm(zonePath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error(`❌ Failed to delete zone ${zoneId}:`, err.message)
            return res.status(500).json({ error: "Failed to delete zone" })
        }

        console.log(`🗑️ Deleted zone: ${zoneId}`)
        res.status(200).json({ message: "Zone deleted" })
    })
})

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
})
