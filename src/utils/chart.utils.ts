import * as d3 from 'd3'
import type { TableRow } from './data-parser.utils'

/**
 * Chart configuration interface
 */
export interface ChartConfig {
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
}

/**
 * Period data interface
 */
export interface PeriodData {
  period: string
  value: number
}

/**
 * Get responsive chart dimensions
 * @param barChart - use larger margins and inner padding to avoid clipping and keep bars narrower
 */
export const getChartDimensions = (
  containerWidth: number,
  aspectRatio: number = 1.6,
  barChart: boolean = false
): ChartConfig => {
  const margin = barChart
    ? { top: 50, right: 60, bottom: 70, left: 90 }
    : { top: 40, right: 40, bottom: 60, left: 80 }
  const outerPadding = barChart ? 48 : 80
  const maxWidth = 900
  const minWidth = 500
  const availableWidth = Math.min(maxWidth, Math.max(minWidth, containerWidth - outerPadding))
  const width = availableWidth - margin.left - margin.right
  const height = width / aspectRatio - margin.top - margin.bottom

  return {
    width,
    height,
    margin,
  }
}

/**
 * Group data by period and sum values
 */
export const groupDataByPeriod = (rows: TableRow[]): PeriodData[] => {
  const periodData = d3.rollup(
    rows,
    (v) => d3.sum(v, (d) => d.Value),
    (d) => d.Period
  )

  return Array.from(periodData, ([period, value]) => ({
    period,
    value: value || 0,
  })).sort((a, b) => a.period.localeCompare(b.period))
}

/**
 * Format value for display (in millions)
 */
export const formatValueForChart = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`
  }
  return `$${(value / 1000000).toFixed(2)}M`
}

/**
 * Chart color palette
 */
export const CHART_COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  secondary: '#1976d2',
  secondaryDark: '#1565c0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  white: '#ffffff',
}

/**
 * Get color scale for charts
 */
export const getColorScale = (domain: string[]) => {
  return d3.scaleOrdinal<string>()
    .domain(domain)
    .range([
      CHART_COLORS.primary,
      CHART_COLORS.primaryDark,
      CHART_COLORS.secondary,
      CHART_COLORS.secondaryDark,
      CHART_COLORS.success,
      CHART_COLORS.warning,
    ])
}

/**
 * Create SVG container
 */
export const createSVGContainer = (
  container: d3.Selection<HTMLDivElement, unknown, null, undefined>,
  config: ChartConfig,
  className: string = 'revenue-chart-svg'
) => {
  const svg = container
    .append('svg')
    .attr('width', config.width + config.margin.left + config.margin.right)
    .attr('height', config.height + config.margin.top + config.margin.bottom)
    .attr('class', className)
    .attr('viewBox', `0 0 ${config.width + config.margin.left + config.margin.right} ${config.height + config.margin.top + config.margin.bottom}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')

  const g = svg
    .append('g')
    .attr('transform', `translate(${config.margin.left},${config.margin.top})`)

  return { svg, g }
}

/**
 * Add chart title
 */
export const addChartTitle = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  title: string,
  config: ChartConfig
) => {
  svg.append('text')
    .attr('x', (config.width + config.margin.left + config.margin.right) / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-title')
    .text(title)
}

/**
 * Add axis labels
 */
export const addAxisLabels = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  xLabel: string,
  yLabel: string,
  config: ChartConfig
) => {
  // X axis label
  g.append('text')
    .attr('transform', `translate(${config.width / 2}, ${config.height + 50})`)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-axis-label')
    .text(xLabel)

  // Y axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -70)
    .attr('x', -config.height / 2)
    .attr('text-anchor', 'middle')
    .attr('class', 'chart-axis-label')
    .text(yLabel)
}

