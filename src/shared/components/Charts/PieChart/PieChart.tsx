import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import {
  groupDataByPeriod,
  formatValueForChart,
  getColorScale,
  CHART_COLORS,
} from '../../../../utils/chart.utils'
import { TableRow } from '../../../../utils/data-parser.utils'
import './PieChart.css'

interface PieChartProps {
  data: TableRow[]
  containerWidth?: number
}

const PieChart = ({ data, containerWidth = 600 }: PieChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data.length) return

    d3.select(chartRef.current).selectAll('*').remove()

    // Calculate size to match table width better
    // Make pie chart smaller and leave room for legend
    const maxSize = Math.min(450, containerWidth - 100)
    const width = maxSize + 200 // Extra width for legend
    const height = maxSize
    const radius = Math.min(maxSize, maxSize) / 2 - 70

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'pie-chart-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // Center pie chart in the left portion, leaving space for legend
    const pieCenterX = maxSize / 2
    const pieCenterY = height / 2
    const g = svg.append('g')
      .attr('transform', `translate(${pieCenterX},${pieCenterY})`)

    const chartData = groupDataByPeriod(data)
    const color = getColorScale(chartData.map((d) => d.period))

    const pie = d3.pie<{ period: string; value: number }>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02)

    const arc = d3.arc<d3.PieArcDatum<{ period: string; value: number }>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius)

    const arcs = g.selectAll('.arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc')

    // Add paths with animation
    const paths = arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.period) as string)
      .attr('stroke', CHART_COLORS.white)
      .attr('stroke-width', 2)
      .attr('opacity', 0)

    // Animate paths
    paths.transition()
      .delay((_d, i) => i * 100)
      .duration(600)
      .attr('opacity', 1)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d)
        return function(t) {
          return arc(interpolate(t)) || ''
        }
      })

    // Add labels
    arcs.append('text')
      .attr('transform', (d) => {
        const [x, y] = arc.centroid(d)
        return `translate(${x},${y})`
      })
      .attr('text-anchor', 'middle')
      .attr('class', 'chart-pie-label')
      .text((d) => {
        const percent = ((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100
        return percent > 8 ? `${((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1)}%` : ''
      })
      .attr('opacity', 0)
      .transition()
      .delay(600)
      .duration(300)
      .attr('opacity', 1)

    // Add hover effects
    paths.on('mouseenter', function(_event, d) {
      d3.select(this)
        .attr('opacity', 0.8)
        .attr('transform', 'scale(1.05)')

      // Show tooltip
      const tooltip = g.append('g')
        .attr('class', 'chart-tooltip')
        .attr('opacity', 0)

      const [x, y] = arc.centroid(d)
      tooltip.append('rect')
        .attr('x', x - 60)
        .attr('y', y - 35)
        .attr('width', 120)
        .attr('height', 30)
        .attr('fill', '#1f2937')
        .attr('rx', 4)

      tooltip.append('text')
        .attr('x', x)
        .attr('y', y - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(`${d.data.period}: ${formatValueForChart(d.data.value)}`)

      tooltip.transition()
        .duration(200)
        .attr('opacity', 1)
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('opacity', 1)
        .attr('transform', 'scale(1)')

      g.selectAll('.chart-tooltip').remove()
    })

    // Add title
    svg.append('text')
      .attr('x', maxSize / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('class', 'chart-title')
      .text('Revenue Distribution by Period')

    // Calculate legend position to avoid overlap - place to the right of pie
    const legendX = maxSize + 20
    const legendY = 80
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`)

    const legendItems = legend.selectAll('.legend-item')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (_d, i) => `translate(0, ${i * 24})`)

    legendItems.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', (d) => color(d.period) as string)
      .attr('rx', 3)

    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 11)
      .attr('class', 'chart-legend-text')
      .style('font-size', '11px')
      .text((d) => {
        const text = `${d.period}: ${formatValueForChart(d.value)}`
        // Truncate if too long
        return text.length > 25 ? text.substring(0, 22) + '...' : text
      })

  }, [data, containerWidth])

  return <div ref={chartRef} className="pie-chart-container" />
}

export default PieChart

