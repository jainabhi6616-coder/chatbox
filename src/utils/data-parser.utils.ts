/**
 * Parse nested response data into flat table structure.
 * Supports API structures:
 *   Channel → Year → Scenario → Period → Metric → Profit Center → Cluster → value
 *   Channel → Year → Scenario → Classification → Period → Metric → Profit Center → Cluster → value
 */

/** Legacy row shape for charts (Period + Value); derived from structured rows when needed */
export interface TableRow {
  Forecast: string
  Period: string
  Metric: string
  Value: number
}

/** Structured row: dynamic keys per API (Channel, Year, Scenario, Period, etc.) plus "Value (USD)" */
export type StructuredRow = Record<string, string | number>

export interface ParsedData {
  rows: StructuredRow[]
  headers: string[]
  hasData: boolean
}

/** Standard column names for Format 1 (no Classification) */
const HEADERS_7 = ['Channel', 'Year', 'Scenario', 'Period', 'Metric', 'Profit Center', 'Cluster', 'Value (USD)'] as const

/** Standard column names for Format 2 (with Classification) */
const HEADERS_8 = ['Channel', 'Year', 'Scenario', 'Classification', 'Period', 'Metric', 'Profit Center', 'Cluster', 'Value (USD)'] as const

const VALUE_COL = 'Value (USD)'
const PERIOD_COL = 'Period'

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
 * Recursively collect all leaf numbers with full path as string array.
 * Leaf = numeric value; path = all keys from root to the key whose value is the number.
 */
const collectPaths = (
  obj: Record<string, unknown>,
  path: string[],
  out: { path: string[]; value: number }[]
): void => {
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    const newPath = [...path, key]
    if (typeof val === 'number') {
      out.push({ path: newPath, value: val })
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>
      const entries = Object.entries(inner)
      if (entries.length === 1 && typeof entries[0][1] === 'number') {
        out.push({ path: [...newPath, entries[0][0]], value: entries[0][1] })
      } else {
        collectPaths(inner, newPath, out)
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
  const collected: { path: string[]; value: number }[] = []
  collectPaths(data as Record<string, unknown>, [], collected)
  return collected.length > 0
}

/** @deprecated Use isChartableData */
export const isRevenueForecastData = (data: unknown): boolean => {
  return isChartableData(data)
}

/**
 * Parse output that follows Channel → Year → Scenario → [Classification?] → Period → Metric → Profit Center → Cluster → value.
 * Returns rows with dynamic headers (7 or 8 dimension columns + Value (USD)).
 */
export const parseResponseData = (output: unknown): ParsedData => {
  if (!output || typeof output !== 'object') {
    return { rows: [], headers: [], hasData: false }
  }

  const o = output as Record<string, unknown>
  if (Object.keys(o).length === 0) {
    return { rows: [], headers: [], hasData: false }
  }

  const collected: { path: string[]; value: number }[] = []
  collectPaths(o, [], collected)

  if (collected.length === 0) {
    return { rows: [], headers: [], hasData: false }
  }

  const pathLengths = collected.map((c) => c.path.length)
  const hasClassification = pathLengths.some((len) => len === 8)
  const headers = hasClassification ? [...HEADERS_8] : [...HEADERS_7]
  const len = hasClassification ? 8 : 7

  const rows: StructuredRow[] = collected
    .filter((c) => c.path.length === len)
    .map(({ path, value }) => {
      const row: StructuredRow = {}
      headers.forEach((h, i) => {
        if (h === VALUE_COL) row[h] = value
        else row[h] = path[i] ?? '—'
      })
      return row
    })

  return {
    rows,
    headers,
    hasData: rows.length > 0,
  }
}

/**
 * Get chart-friendly rows (Period + Value) from parsed structured data.
 * Uses "Period" column and "Value (USD)" for grouping/summing.
 */
export const getChartRows = (parsed: ParsedData): TableRow[] => {
  if (!parsed.hasData) return []
  const periodIdx = parsed.headers.indexOf(PERIOD_COL)
  const valueIdx = parsed.headers.indexOf(VALUE_COL)
  if (periodIdx === -1 || valueIdx === -1) return []
  return parsed.rows.map((r) => ({
    Forecast: (r['Channel'] ?? '') as string,
    Period: (r[PERIOD_COL] ?? '—') as string,
    Metric: (r['Metric'] ?? '') as string,
    Value: Number(r[VALUE_COL]) || 0,
  }))
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

/**
 * Format value for table display: use % if Metric contains "Percentage", otherwise $.
 */
export const formatValueCell = (value: number, metric?: string | number | null): string => {
  const metricStr = metric != null ? String(metric) : ''
  if (metricStr.toLowerCase().includes('percentage')) {
    return `${formatNumber(value)}%`
  }
  return `$${formatNumber(value)}`
}
