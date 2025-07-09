export interface GlacierDataEntry {
    year: number
    area: number
}

export const calculateLinearTrend = (
    rawData: { year: number; area: number | null }[]
): ({ year: number; area: number | null; trend?: number })[] => {
    const valid = rawData.filter(
        d =>
            typeof d.year === "number" &&
            typeof d.area === "number" &&
            d.area !== null &&
            !isNaN(d.year) &&
            !isNaN(d.area)
    ) as GlacierDataEntry[] // assertion: all have number area

    const n = valid.length
    if (n < 2) {
        return rawData.map(d => ({ ...d })) // no regression
    }

    const sumX = valid.reduce((sum, d) => sum + d.year, 0)
    const sumY = valid.reduce((sum, d) => sum + d.area, 0)
    const sumXY = valid.reduce((sum, d) => sum + d.year * d.area, 0)
    const sumXX = valid.reduce((sum, d) => sum + d.year * d.year, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return rawData.map(d => ({
        ...d,
        trend: typeof d.year === "number" && !isNaN(d.year)
            ? slope * d.year + intercept
            : undefined
    }))
}
