import Papa from 'papaparse'

export interface GlacierDataEntry {
    year: number
    area: number
}

export const loadCSV = (filePath: string): Promise<GlacierDataEntry[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                const kmPerPixel = 57.5 / 512
                const km2PerPixel = kmPerPixel * kmPerPixel

                const data: GlacierDataEntry[] = results.data
                    .filter((d: any) => typeof d.year === 'number' && typeof d.area === 'number')
                    .map((d: any) => ({
                        year: d.year,
                        area: parseFloat((d.area * km2PerPixel).toFixed(2)),
                    }))

                resolve(data)
            },
            error: (error) => {
                reject(error)
            }
        })
    })
}
