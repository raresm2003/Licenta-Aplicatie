const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const mkdirp = require("mkdirp")

const app = express()
const PORT = 5000
const INSTANCE_ID = "68125879-65d5-4af5-b296-638ec7219ec8"

app.use(express.json())
app.use(cors())

app.post("/download-images", async (req, res) => {
    const { south, west, north, east, years, outputDir = "glacier_images" } = req.body

    const folder = path.join(__dirname, outputDir)
    mkdirp.sync(folder)

    try {
        for (const year of years) {
            const url = `https://services.sentinel-hub.com/ogc/wms/${INSTANCE_ID}?` +
                `REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0` +
                `&LAYERS=TRUE_COLOR` +
                `&BBOX=${south},${west},${north},${east}` +
                `&CRS=EPSG:4326` +
                `&WIDTH=2048&HEIGHT=2048` +
                `&FORMAT=image/png` +
                `&TIME=${year}-06-01/${year}-09-30`

            const response = await axios.get(url, { responseType: "arraybuffer" })
            fs.writeFileSync(path.join(folder, `glacier_${year}.png`), response.data)
            console.log(`Saved glacier_${year}.png`)
        }

        res.status(200).json({ message: "Images downloaded successfully" })
    } catch (error) {
        console.error("Error downloading images:", error.message)
        res.status(500).json({ error: "Download failed", details: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`✅ Glacier image downloader running at http://localhost:${PORT}`)
})
