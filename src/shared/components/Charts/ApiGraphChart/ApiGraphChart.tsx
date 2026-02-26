import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import {
  getChartDimensions,
  formatValueForChart,
  createSVGContainer,
  addChartTitle,
  addAxisLabels,
  getColorScale,
  CHART_COLORS,
  getBarColorByPeriod,
  getBarHoverColorByPeriod,
} from '../../../../utils/chart.utils'
import type { GraphSpec } from '../../../../types/graph.types'
import './ApiGraphChart.css'

interface ApiGraphChartProps {
  spec: GraphSpec
  containerWidth?: number
}

function formatFromSpec(value: number, unit?: string | null, decimals?: number): string {
  if (unit === '%' || unit === 'percent') {
    return `${Number(value).toFixed(decimals ?? 2)}%`
  }
  return formatValueForChart(value)
}

export default function ApiGraphChart({ spec, containerWidth = 800 }: ApiGraphChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const title = spec.title ?? ''
  const xLabel = spec.x?.label ?? 'Period'
  const yLabel = spec.yLeft?.label ?? 'Value'
  const yUnit = spec.yLeft?.unit ?? 'USD($)'
  const allSeries = spec.series ?? []
  const series = allSeries[0]
  const barSeries = allSeries.filter((s) => s.type === 'bar')
  const categories = spec.x?.categories ?? []
  const dataValues = series && Array.isArray(series.data) && typeof series.data[0] === 'number'
    ? (series.data as number[])
    : []
  const chartData = categories.map((cat, i) => ({ period: cat, value: dataValues[i] ?? 0 }))
  const isClustered = barSeries.length > 1
  const chartDataClustered: { period: string; seriesName: string; value: number }[] = isClustered
    ? categories.flatMap((cat, ci) =>
        barSeries.map((s) => ({
          period: cat,
          seriesName: s.name,
          value: (Array.isArray(s.data) && typeof (s.data as number[])[ci] === 'number')
            ? (s.data as number[])[ci] ?? 0
            : 0,
        }))
      )
    : []

  useEffect(() => {
    if (!chartRef.current) return
    if (spec.chartType === 'pie') {
      const pieData = series?.data
      if (!pieData || !Array.isArray(pieData) || pieData.length === 0) return
      const items = pieData as Array<{ name: string; value: number }>
      const node = chartRef.current
      if (!node) return
      d3.select(node).selectAll('*').remove()
      const maxSize = Math.min(450, (containerWidth || 600) - 100)
      const width = maxSize + 200
      const height = maxSize
      const radius = Math.min(maxSize, maxSize) / 2 - 70
      const svg = d3.select(node)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'api-graph-chart-svg api-graph-pie')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
      const pieCenterX = maxSize / 2
      const pieCenterY = height / 2
      const g = svg.append('g').attr('transform', `translate(${pieCenterX},${pieCenterY})`)
      const color = getColorScale(items.map((d) => d.name))
      const pie = d3.pie<{ name: string; value: number }>().value((d) => d.value).sort(null).padAngle(0.02)
      const arc = d3.arc<d3.PieArcDatum<{ name: string; value: number }>>()
        .innerRadius(radius * 0.4)
        .outerRadius(radius)
      g.selectAll('.arc')
        .data(pie(items))
        .enter()
        .append('path')
        .attr('class', 'api-graph-arc')
        .attr('d', arc)
        .attr('fill', (d) => color(d.data.name))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
      g.selectAll('.arc-label')
        .data(pie(items))
        .enter()
        .append('text')
        .attr('transform', (d) => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('class', 'api-graph-pie-label')
        .text((d) => formatFromSpec(d.data.value, yUnit, series?.format?.decimals))
      const legend = svg.append('g').attr('class', 'api-graph-legend').attr('transform', `translate(${maxSize + 20}, 40)`)
      items.forEach((item, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * 24})`)
        row.append('rect').attr('width', 14).attr('height', 14).attr('fill', color(item.name)).attr('rx', 2)
        row.append('text').attr('x', 20).attr('y', 12).attr('class', 'api-graph-legend-text').text(item.name)
      })
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', 28)
        .attr('text-anchor', 'middle')
        .attr('class', 'chart-title')
        .text(title)
      return
    }

    if (spec.chartType === 'bar' || spec.chartType === 'line') {
      const hasBarData = chartData.length > 0 || chartDataClustered.length > 0
      if (!hasBarData) return
      d3.select(chartRef.current).selectAll('*').remove()
      const config = getChartDimensions(containerWidth, 1.6, true)
      const { svg, g } = createSVGContainer(d3.select(chartRef.current), config, 'api-graph-chart-svg')
      const maxVal = isClustered && chartDataClustered.length > 0
        ? d3.max(chartDataClustered, (d) => d.value) ?? 0
        : d3.max(chartData, (d) => d.value) ?? 0
      const xDomain = isClustered ? [...new Set(chartDataClustered.map((d) => d.period))] : chartData.map((d) => d.period)
      const xScale = d3.scaleBand()
        .domain(xDomain)
        .range([0, config.width])
        .padding(spec.chartType === 'bar' ? (isClustered ? 0.2 : 0.55) : 0.1)
      const x0 = isClustered && barSeries.length > 1
        ? d3.scaleBand()
            .domain(barSeries.map((s) => s.name))
            .range([0, xScale.bandwidth()])
            .padding(0)
        : null
      const yScale = d3.scaleLinear()
        .domain([0, maxVal])
        .nice()
        .range([config.height, 0])
      g.append('g')
        .attr('transform', `translate(0,${config.height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('class', 'chart-axis-text')
        .style('font-size', '11px')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end')
        .attr('dx', '-0.4em')
        .attr('dy', '0.5em')
      g.append('g')
        .call(
          d3.axisLeft(yScale).tickFormat((d) => formatFromSpec(d as number, yUnit, series?.format?.decimals))
        )
        .attr('class', 'chart-axis')
        .selectAll('text')
        .style('font-size', '11px')
      g.append('g')
        .attr('class', 'chart-grid')
        .call(d3.axisLeft(yScale).tickSize(-config.width).tickFormat(() => ''))
        .selectAll('line')
        .attr('stroke', '#e5e7eb')
        .attr('stroke-dasharray', '2,2')

      if (spec.chartType === 'bar') {
        if (isClustered && x0) {
          const seriesNames = barSeries.map((s) => s.name)
          const seriesColor = getColorScale(seriesNames)
          const bars = g.selectAll('.bar')
            .data(chartDataClustered)
            .enter()
            .append('rect')
            .attr('class', 'chart-bar chart-bar-clustered')
            .attr('x', (d) => (xScale(d.period) || 0) + (x0(d.seriesName) || 0))
            .attr('y', config.height)
            .attr('width', x0.bandwidth())
            .attr('height', 0)
            .attr('fill', (d) => seriesColor(d.seriesName))
            .attr('rx', 4)
            .attr('ry', 4)
          bars.transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => config.height - yScale(d.value))
          bars.on('mouseenter', function (_event, d) {
            d3.select(this).attr('opacity', '0.85')
            const label = `${d.period} · ${d.seriesName}: ${formatFromSpec(d.value, yUnit, series?.format?.decimals)}`
            const pad = 14
            const minW = 90
            const maxW = Math.min(360, config.width - pad * 2)
            const approxWidth = Math.min(Math.max(label.length * 6.5, minW), maxW)
            const barCenter = (xScale(d.period) || 0) + (x0(d.seriesName) || 0) + x0.bandwidth() / 2
            let tipX = barCenter - approxWidth / 2
            tipX = Math.max(pad, Math.min(config.width - approxWidth - pad, tipX))
            const tipY = Math.max(24, yScale(d.value) - 38)
            const tooltip = g.append('g').attr('class', 'chart-tooltip').attr('opacity', 0)
            tooltip.append('rect')
              .attr('x', tipX)
              .attr('y', tipY)
              .attr('width', approxWidth)
              .attr('height', 30)
              .attr('fill', '#1f2937')
              .attr('rx', 4)
            tooltip.append('text')
              .attr('x', tipX + approxWidth / 2)
              .attr('y', tipY + 19)
              .attr('text-anchor', 'middle')
              .attr('fill', '#ffffff')
              .attr('font-size', '11px')
              .attr('font-weight', '600')
              .text(label)
            tooltip.transition().duration(200).attr('opacity', 1)
          }).on('mouseleave', function () {
            d3.select(this).attr('opacity', '1')
            g.selectAll('.chart-tooltip').remove()
          })
          if (spec.legend?.show !== false) {
            const legend = g.append('g').attr('class', 'api-graph-legend').attr('transform', `translate(${config.width - 120}, 0)`)
            seriesNames.forEach((name, i) => {
              const row = legend.append('g').attr('transform', `translate(0, ${i * 22})`)
              row.append('rect').attr('width', 14).attr('height', 14).attr('fill', seriesColor(name)).attr('rx', 2)
              row.append('text').attr('x', 20).attr('y', 12).attr('class', 'api-graph-legend-text').text(name)
            })
          }
        } else {
          const bars = g.selectAll('.bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'chart-bar')
            .attr('x', (d) => xScale(d.period) || 0)
            .attr('y', config.height)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', (d) => getBarColorByPeriod(d.period))
            .attr('rx', 4)
            .attr('ry', 4)
          bars.transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => config.height - yScale(d.value))
          if (spec.dataLabels?.show) {
            bars.each(function (d) {
              if (config.height - yScale(d.value) > 20) {
                g.append('text')
                  .attr('x', (xScale(d.period) || 0) + xScale.bandwidth() / 2)
                  .attr('y', yScale(d.value) - 5)
                  .attr('text-anchor', 'middle')
                  .attr('class', 'chart-bar-label')
                  .text(formatFromSpec(d.value, yUnit, series?.format?.decimals))
                  .attr('opacity', 0)
                  .transition()
                  .delay(800)
                  .duration(300)
                  .attr('opacity', 1)
              }
            })
          }
          bars.on('mouseenter', function (_event, d) {
            d3.select(this).attr('fill', getBarHoverColorByPeriod(d.period))
            const label = `${d.period}: ${formatFromSpec(d.value, yUnit, series?.format?.decimals)}`
            const pad = 14
            const minW = 90
            const maxW = Math.min(320, config.width - pad * 2)
            const approxWidth = Math.min(Math.max(label.length * 6.5, minW), maxW)
            const barCenter = (xScale(d.period) || 0) + xScale.bandwidth() / 2
            let tipX = barCenter - approxWidth / 2
            tipX = Math.max(pad, Math.min(config.width - approxWidth - pad, tipX))
            const tipY = Math.max(24, yScale(d.value) - 38)
            const tooltip = g.append('g').attr('class', 'chart-tooltip').attr('opacity', 0)
            tooltip.append('rect')
              .attr('x', tipX)
              .attr('y', tipY)
              .attr('width', approxWidth)
              .attr('height', 30)
              .attr('fill', '#1f2937')
              .attr('rx', 4)
            tooltip.append('text')
              .attr('x', tipX + approxWidth / 2)
              .attr('y', tipY + 19)
              .attr('text-anchor', 'middle')
              .attr('fill', '#ffffff')
              .attr('font-size', '11px')
              .attr('font-weight', '600')
              .text(label)
            tooltip.transition().duration(200).attr('opacity', 1)
          }).on('mouseleave', function (_event, d) {
            d3.select(this).attr('fill', getBarColorByPeriod(d.period))
            g.selectAll('.chart-tooltip').remove()
          })
        }
      } else {
        const line = d3.line<{ period: string; value: number }>()
          .x((d) => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
          .y((d) => yScale(d.value))
          .curve(d3.curveMonotoneX)
        g.append('path')
          .datum(chartData)
          .attr('class', 'api-graph-line')
          .attr('fill', 'none')
          .attr('stroke', CHART_COLORS.primary)
          .attr('stroke-width', 2.5)
          .attr('d', line)
        g.selectAll('.api-graph-dot')
          .data(chartData)
          .enter()
          .append('circle')
          .attr('class', 'api-graph-dot')
          .attr('cx', (d) => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
          .attr('cy', (d) => yScale(d.value))
          .attr('r', 4)
          .attr('fill', CHART_COLORS.primary)
      }

      addChartTitle(svg, title, config)
      addAxisLabels(g, xLabel, `${yLabel} (${yUnit})`, config)
    }
  }, [spec, containerWidth])

  if (!series) return null
  if (spec.chartType === 'pie') {
    const pieData = series.data as Array<{ name: string; value: number }>
    if (!Array.isArray(pieData) || pieData.length === 0) return null
  } else if (chartData.length === 0) return null

  return <div ref={chartRef} className="api-graph-chart-container" />
}
