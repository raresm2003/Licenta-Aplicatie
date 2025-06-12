import { GlacierDataEntry } from './loadCSV'

export const calculateLinearTrend = (
    data: GlacierDataEntry[]
): (GlacierDataEntry & { trend: number })[] => {
    const cleanData = data.filter(d =>
        typeof d.year === 'number' &&
        typeof d.area === 'number' &&
        !isNaN(d.year) &&
        !isNaN(d.area)
    )

    const n = cleanData.length
    if (n === 0) return []

    const sumX = cleanData.reduce((sum, d) => sum + d.year, 0)
    const sumY = cleanData.reduce((sum, d) => sum + d.area, 0)
    const sumXY = cleanData.reduce((sum, d) => sum + d.year * d.area, 0)
    const sumXX = cleanData.reduce((sum, d) => sum + d.year * d.year, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return cleanData.map(d => ({
        ...d,
        trend: slope * d.year + intercept
    }))
}