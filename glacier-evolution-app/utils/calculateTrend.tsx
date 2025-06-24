export interface GlacierDataEntry {
    year: number
    area: number
}

export const calculateLinearTrend = (
    data: GlacierDataEntry[]
): (GlacierDataEntry & { trend?: number })[] => {
    const valid = data.filter(
        d =>
            typeof d.year === 'number' &&
            typeof d.area === 'number' &&
            !isNaN(d.year) &&
            !isNaN(d.area)
    )

    const n = valid.length
    if (n < 2) {
        return data.map(d => ({ ...d })) // no trend possible
    }

    const sumX = valid.reduce((sum, d) => sum + d.year, 0)
    const sumY = valid.reduce((sum, d) => sum + d.area, 0)
    const sumXY = valid.reduce((sum, d) => sum + d.year * d.area, 0)
    const sumXX = valid.reduce((sum, d) => sum + d.year * d.year, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    return data.map(d => ({
        ...d,
        trend:
            typeof d.year === 'number' && !isNaN(d.year)
                ? slope * d.year + intercept
                : undefined
    }))
}