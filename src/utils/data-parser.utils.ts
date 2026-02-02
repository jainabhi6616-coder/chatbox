/**
 * Parse nested response data into flat table structure.
 * Structure-agnostic: works for any key names by inferring layout from paths to numeric leaves.
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
 * Check if output is text-only (single key "response" with string value — not chartable)
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
 * Recursively collect all leaf numbers with their full path (key1 > key2 > ... > keyN -> value)
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
 * Check if data is chartable (has at least one numeric leaf and is not text-only)
 */
export const isChartableData = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false
  if (isTextOnlyOutput(data)) return false
  const collected: { path: string; value: number }[] = []
  collectLeafNumbers(data as Record<string, unknown>, '', collected)
  return collected.length > 0
}

/** @deprecated Use isChartableData */
export const isRevenueForecastData = (data: unknown): boolean => {
  return isChartableData(data)
}

/**
 * Infer which path segment index is the "category" (e.g. channel, period) for the chart.
 * Chooses the index with the most distinct values so the bar chart has one bar per category.
 */
const inferCategorySegmentIndex = (paths: string[][]): number => {
  if (paths.length === 0) return 0
  const maxLen = Math.max(...paths.map((p) => p.length))
  let bestIndex = 0
  let maxDistinct = 0
  for (let i = 0; i < maxLen; i++) {
    const distinct = new Set(paths.map((p) => p[i]).filter(Boolean))
    if (distinct.size >= maxDistinct) {
      maxDistinct = distinct.size
      bestIndex = i
    }
  }
  return bestIndex
}

/**
 * Parse any nested response into table rows by walking the structure and inferring dimensions.
 * Keys can be any names; the parser uses path structure to set Forecast, Period, Metric, Value.
 */
export const parseResponseData = (output: unknown): ParsedData => {
  if (!output || typeof output !== 'object') {
    return { rows: [], hasData: false }
  }

  const o = output as Record<string, unknown>
  if (Object.keys(o).length === 0) {
    return { rows: [], hasData: false }
  }

  const collected: { path: string; value: number }[] = []
  collectLeafNumbers(o, '', collected)

  if (collected.length === 0) {
    return { rows: [], hasData: false }
  }

  const paths = collected.map(({ path }) => path.split(' > '))
  const categoryIndex = inferCategorySegmentIndex(paths)

  const rows: TableRow[] = collected.map(({ path, value }) => {
    const parts = path.split(' > ')
    const period = parts[categoryIndex] ?? '—'
    const forecast = categoryIndex === 0 ? '—' : (parts[0] ?? '—')
    const metricParts = parts.filter((_, i) => i !== categoryIndex)
    const metric = metricParts.length > 0 ? metricParts.join(' > ') : '—'
    return {
      Forecast: forecast,
      Period: period,
      Metric: metric,
      Value: value,
    }
  })

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
