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
 * Check if data is revenue forecast type (has OVERALL > FY25 structure)
 */
export const isRevenueForecastData = (data: any): boolean => {
  if (!data || typeof data !== 'object') {
    return false
  }
  
  // Check for the structure: OVERALL > FY25 > PREDICTION11/FCST10
  return (
    data.OVERALL &&
    typeof data.OVERALL === 'object' &&
    data.OVERALL.FY25 &&
    typeof data.OVERALL.FY25 === 'object'
  )
}

/**
 * Recursively flatten nested object structure
 */
const flattenObject = (
  obj: any,
  prefix: string = '',
  result: { [key: string]: number } = {}
): { [key: string]: number } => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix} > ${key}` : key
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Check if it's a number (like GLOBAL: 536963416.6231)
        if (Object.keys(obj[key]).length === 1 && typeof Object.values(obj[key])[0] === 'number') {
          const valueKey = Object.keys(obj[key])[0]
          const value = Object.values(obj[key])[0] as number
          result[`${newKey} > ${valueKey}`] = value
        } else {
          // Recursively flatten nested objects
          flattenObject(obj[key], newKey, result)
        }
      } else if (typeof obj[key] === 'number') {
        result[newKey] = obj[key]
      }
    }
  }
  return result
}

/**
 * Parse the response output into table rows
 */
export const parseResponseData = (output: any): ParsedData => {
  if (!output || typeof output !== 'object') {
    return { rows: [], hasData: false }
  }

  const rows: TableRow[] = []
  
  // Handle the structure: OVERALL > FY25 > PREDICTION11/FCST10 > OCTOBER/NOVEMBER/Q4 > LSCO > GLOBAL
  if (output.OVERALL && output.OVERALL.FY25) {
    const fy25 = output.OVERALL.FY25
    
    // Process PREDICTION11 and FCST10
    Object.keys(fy25).forEach((forecastType) => {
      const forecastData = fy25[forecastType]
      
      // Process periods (OCTOBER, NOVEMBER, Q4)
      Object.keys(forecastData).forEach((period) => {
        const periodData = forecastData[period]
        
        // Process LSCO or other metrics
        Object.keys(periodData).forEach((metric) => {
          const metricData = periodData[metric]
          
          // Process GLOBAL or other regions
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
