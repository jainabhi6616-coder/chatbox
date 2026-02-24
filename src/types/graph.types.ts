/**
 * Types for API graph payload (response.graph.graph_payload)
 */

export interface GraphAxisConfig {
  type?: string
  label?: string
  unit?: string
  min?: number | null
  max?: number | null
  show?: boolean
}

export interface GraphXConfig {
  type?: string
  categories?: string[]
  label?: string
}

export interface GraphSeriesItem {
  name: string
  type: string
  yAxis?: string
  data: number[] | Array<{ name: string; value: number }>
  format?: {
    decimals?: number
    prefix?: string
    suffix?: string
  }
}

export interface GraphAnnotation {
  type?: string
  text?: string
  position?: string
}

export interface GraphSpec {
  chartType: 'bar' | 'line' | 'pie'
  title?: string
  subtitle?: string
  x?: GraphXConfig
  yLeft?: GraphAxisConfig
  yRight?: GraphAxisConfig
  series?: GraphSeriesItem[]
  dataLabels?: { show?: boolean; position?: string }
  legend?: { show?: boolean; position?: string }
  notes?: string
  annotations?: GraphAnnotation[]
}

export interface GraphPayload {
  graphs: GraphSpec[]
}

export interface ApiGraphResponse {
  graph_payload: GraphPayload
  warnings?: string[]
  time_taken?: number
}
