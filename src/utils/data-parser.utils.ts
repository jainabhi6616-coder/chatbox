/**
 * Parse nested response data into flat table structure
 */

export interface TableRow {
  Forecast: string
  Period: string
  Metric: string
  Value: number
}

export interface ParsedData {
  rows: TableRow[]
  hasData: boolean
}

/**
 * Check if output is text-only (Response 1: no chartable data)
 */
const isTextOnlyOutput = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return true
  const o = data as Record<string, unknown>
  return (
    Object.keys(o).length === 1 &&
    'response' in o &&
    typeof o.response === 'string'
  )
}

/**
 * Check if data is chartable (Response 2/3 or OVERALL/FY25) — show graphs in tabs
 */
export const isChartableData = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false
  if (isTextOnlyOutput(data)) return false

  const o = data as Record<string, unknown>

  // OVERALL > FY25 (legacy)
  if (
    o.OVERALL &&
    typeof o.OVERALL === 'object' &&
    (o.OVERALL as Record<string, unknown>).FY25
  ) {
    return true
  }

  // TOTAL CHANNEL (Response 2: FY26 > PREDICTION2 > periods > VALUE > LSCO > GLOBAL)
  if (o['TOTAL CHANNEL'] && typeof o['TOTAL CHANNEL'] === 'object') {
    const tc = o['TOTAL CHANNEL'] as Record<string, unknown>
    for (const key of Object.keys(tc)) {
      const val = tc[key]
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return true
      }
    }
  }

  // Channel-style: EXTERNAL DTC FP&A, EXTERNAL WHLS FP&A, TOTAL CHANNEL > FY26 > ACTUAL > TOTAL > Revenue > LSCO > GLOBAL
  for (const key of Object.keys(o)) {
    if (key === 'response') continue
    const val = o[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return true
    }
  }

  return false
}

/** @deprecated Use isChartableData */
export const isRevenueForecastData = (data: unknown): boolean => {
  return isChartableData(data)
}

/**
 * Extract the first leaf number from a nested object (for channel-style single value per key)
 */
const extractLeafNumber = (obj: Record<string, unknown>): number | null => {
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'number') return val
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = extractLeafNumber(val as Record<string, unknown>)
      if (nested !== null) return nested
    }
  }
  return null
}

/**
 * Recursively collect leaf numbers with path (for generic fallback)
 */
const collectLeafNumbers = (
  obj: Record<string, unknown>,
  prefix: string,
  out: { path: string; value: number }[]
): void => {
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    const path = prefix ? `${prefix} > ${key}` : key
    if (typeof val === 'number') {
      out.push({ path, value: val })
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      if (Object.keys(inner).length === 1 && typeof Object.values(inner)[0] === 'number') {
        const v = Object.values(inner)[0] as number
        out.push({ path: `${path} > ${Object.keys(inner)[0]}`, value: v })
      } else {
        collectLeafNumbers(inner, path, out)
      }
    }
  }
}

/**
 * Parse the response output into table rows (OVERALL/FY25, TOTAL CHANNEL Response 2 & 3, or generic)
 */
export const parseResponseData = (output: unknown): ParsedData => {
  if (!output || typeof output !== 'object') {
    return { rows: [], hasData: false }
  }

  const rows: TableRow[] = []
  const o = output as Record<string, unknown>

  // OVERALL > FY25 > PREDICTION11/FCST10 > OCTOBER/NOVEMBER/Q4 > LSCO > GLOBAL
  if (o.OVERALL && typeof o.OVERALL === 'object') {
    const overall = o.OVERALL as Record<string, unknown>
    if (overall.FY25 && typeof overall.FY25 === 'object') {
      const fy25 = overall.FY25 as Record<string, Record<string, Record<string, Record<string, number>>>>
      Object.keys(fy25).forEach((forecastType) => {
        const forecastData = fy25[forecastType]
        if (!forecastData || typeof forecastData !== 'object') return
        Object.keys(forecastData).forEach((period) => {
          const periodData = forecastData[period]
          if (!periodData || typeof periodData !== 'object') return
          Object.keys(periodData).forEach((metric) => {
            const metricData = periodData[metric]
            if (!metricData || typeof metricData !== 'object') return
            Object.keys(metricData).forEach((region) => {
              const value = metricData[region]
              if (typeof value === 'number') {
                rows.push({
                  Forecast: forecastType,
                  Period: period,
                  Metric: `${metric} > ${region}`,
                  Value: value,
                })
              }
            })
          })
        })
      })
    }
  }

  // TOTAL CHANNEL > FY26 > PREDICTION2 > SEPTEMBER/OCTOBER/NOVEMBER/Q4 > VALUE > LSCO > GLOBAL (Response 2)
  if (rows.length === 0 && o['TOTAL CHANNEL'] && typeof o['TOTAL CHANNEL'] === 'object') {
    const tc = o['TOTAL CHANNEL'] as Record<string, unknown>
    for (const yearKey of Object.keys(tc)) {
      const yearVal = tc[yearKey]
      if (!yearVal || typeof yearVal !== 'object') continue
      const yearObj = yearVal as Record<string, unknown>
      for (const forecastType of Object.keys(yearObj)) {
        const forecastData = yearObj[forecastType]
        if (!forecastData || typeof forecastData !== 'object') continue
        const forecastObj = forecastData as Record<string, Record<string, unknown>>
        for (const period of Object.keys(forecastObj)) {
          const periodData = forecastObj[period]
          if (!periodData || typeof periodData !== 'object') continue
          const periodObj = periodData as Record<string, Record<string, unknown>>
          for (const metric of Object.keys(periodObj)) {
            const metricData = periodObj[metric]
            if (!metricData || typeof metricData !== 'object') continue
            const metricObj = metricData as Record<string, Record<string, unknown>>
            for (const region of Object.keys(metricObj)) {
              const regionData = metricObj[region]
              if (typeof regionData === 'number') {
                rows.push({
                  Forecast: forecastType,
                  Period: period,
                  Metric: `${metric} > ${region}`,
                  Value: regionData,
                })
              } else if (regionData && typeof regionData === 'object' && !Array.isArray(regionData)) {
                const regionObj = regionData as Record<string, number>
                for (const subKey of Object.keys(regionObj)) {
                  const value = regionObj[subKey]
                  if (typeof value === 'number') {
                    rows.push({
                      Forecast: forecastType,
                      Period: period,
                      Metric: `${metric} > ${region} > ${subKey}`,
                      Value: value,
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // TOTAL CHANNEL > FY26 vs FY25 > ACTUAL > Growth > Q4 > Q4_Revenue_FY26 etc > LSCO > GLOBAL (Response 3)
  if (rows.length === 0 && o['TOTAL CHANNEL'] && typeof o['TOTAL CHANNEL'] === 'object') {
    const tc = o['TOTAL CHANNEL'] as Record<string, unknown>
    for (const compareKey of Object.keys(tc)) {
      const compareVal = tc[compareKey]
      if (!compareVal || typeof compareVal !== 'object') continue
      const compareObj = compareVal as Record<string, unknown>
      for (const actualKey of Object.keys(compareObj)) {
        const actualVal = compareObj[actualKey]
        if (!actualVal || typeof actualVal !== 'object') continue
        const actualObj = actualVal as Record<string, unknown>
        for (const growthKey of Object.keys(actualObj)) {
          const growthVal = actualObj[growthKey]
          if (!growthVal || typeof growthVal !== 'object') continue
          const growthObj = growthVal as Record<string, Record<string, Record<string, Record<string, number>>>>
          for (const period of Object.keys(growthObj)) {
            const periodData = growthObj[period]
            if (!periodData || typeof periodData !== 'object') continue
            for (const metric of Object.keys(periodData)) {
              const metricData = periodData[metric]
              if (!metricData || typeof metricData !== 'object') continue
              for (const region of Object.keys(metricData)) {
                const value = metricData[region]
                if (typeof value === 'number') {
                  rows.push({
                    Forecast: growthKey,
                    Period: period,
                    Metric: `${metric} > ${region}`,
                    Value: value,
                  })
                }
              }
            }
          }
        }
      }
    }
  }

  // Channel-style: EXTERNAL DTC FP&A, EXTERNAL WHLS FP&A, TOTAL CHANNEL > FY26 > ACTUAL > TOTAL > Revenue > LSCO > GLOBAL (one bar per top-level key)
  if (rows.length === 0) {
    for (const key of Object.keys(o)) {
      if (key === 'response') continue
      const val = o[key]
      if (!val || typeof val !== 'object' || Array.isArray(val)) continue
      const num = extractLeafNumber(val as Record<string, unknown>)
      if (num !== null) {
        rows.push({
          Forecast: 'ACTUAL',
          Period: key,
          Metric: 'Revenue',
          Value: num,
        })
      }
    }
  }

  // Generic fallback: flatten and assign first segment as Forecast, second as Period, rest as Metric
  if (rows.length === 0) {
    const collected: { path: string; value: number }[] = []
    collectLeafNumbers(o, '', collected)
    for (const { path, value } of collected) {
      const parts = path.split(' > ')
      const forecast = parts[0] ?? '—'
      const period = parts[1] ?? '—'
      const metric = parts.slice(2).join(' > ') || '—'
      rows.push({ Forecast: forecast, Period: period, Metric: metric, Value: value })
    }
  }

  return {
    rows,
    hasData: rows.length > 0,
  }
}

/**
 * Format number with commas and 2 decimal places
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
