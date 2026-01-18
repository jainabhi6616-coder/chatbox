import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import {
  getChartDimensions,
  groupDataByPeriod,
  formatValueForChart,
  createSVGContainer,
  addChartTitle,
  addAxisLabels,
  CHART_COLORS,
} from '../../../../utils/chart.utils'
import { TableRow } from '../../../../utils/data-parser.utils'
import './LineChart.css'

interface LineChartProps {
  data: TableRow[]
  containerWidth?: number
}

const LineChart = ({ data, containerWidth = 800 }: LineChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data.length) return

    d3.select(chartRef.current).selectAll('*').remove()

    const config = getChartDimensions(containerWidth, 1.6)
    const { svg, g } = createSVGContainer(d3.select(chartRef.current), config, 'line-chart-svg')

    const chartData = groupDataByPeriod(data)

    // Create scales
    const xScale = d3.scaleBand()
      .domain(chartData.map((d) => d.period))
      .range([0, config.width])
      .padding(0.1)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) || 0])
      .nice()
      .range([config.height, 0])

    // Create line generator
    const line = d3.line<{ period: string; value: number }>()
      .x((d) => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Add grid lines
    g.append('g')
      .attr('class', 'chart-grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-config.width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '2,2')

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${config.height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('class', 'chart-axis-text')
      .style('font-size', '12px')

    // Add Y axis
    g.append('g')
      .call(
        d3.axisLeft(yScale)
          .tickFormat((d) => formatValueForChart(d as number))
      )
      .attr('class', 'chart-axis')
      .selectAll('text')
      .style('font-size', '11px')

    // Add area under line
    const area = d3.area<{ period: string; value: number }>()
      .x((d) => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
      .y0(config.height)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(chartData)
      .attr('fill', CHART_COLORS.primary)
      .attr('fill-opacity', 0.1)
      .attr('class', 'chart-area')
      .attr('d', area)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .attr('opacity', 1)

    // Add line
    const path = g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.primary)
      .attr('stroke-width', 3)
      .attr('class', 'chart-line')
      .attr('d', line)
      .attr('stroke-dasharray', function() {
        return this.getTotalLength().toString()
      })
      .attr('stroke-dashoffset', function() {
        return this.getTotalLength().toString()
      })

    // Animate line
    path.transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)

    // Add dots
    const dots = g.selectAll('.dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'chart-dot')
      .attr('cx', (d) => (xScale(d.period) || 0) + xScale.bandwidth() / 2)
      .attr('cy', config.height)
      .attr('r', 0)
      .attr('fill', CHART_COLORS.primary)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)

    // Animate dots
    dots.transition()
      .delay((_d, i) => i * 100)
      .duration(400)
      .attr('cy', (d) => yScale(d.value))
      .attr('r', 6)

    // Add hover effects
    dots.on('mouseenter', function(_event, d) {
      d3.select(this)
        .attr('r', 10)
        .attr('fill', CHART_COLORS.primaryDark)

      // Show tooltip
      const tooltip = g.append('g')
        .attr('class', 'chart-tooltip')
        .attr('opacity', 0)

      tooltip.append('rect')
        .attr('x', (xScale(d.period) || 0) + xScale.bandwidth() / 2 - 50)
        .attr('y', yScale(d.value) - 40)
        .attr('width', 100)
        .attr('height', 30)
        .attr('fill', '#1f2937')
        .attr('rx', 4)

      tooltip.append('text')
        .attr('x', (xScale(d.period) || 0) + xScale.bandwidth() / 2)
        .attr('y', yScale(d.value) - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(`${d.period}: ${formatValueForChart(d.value)}`)

      tooltip.transition()
        .duration(200)
        .attr('opacity', 1)
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('r', 6)
        .attr('fill', CHART_COLORS.primary)

      g.selectAll('.chart-tooltip').remove()
    })

    addChartTitle(svg, 'Revenue Trend by Period', config)
    addAxisLabels(g, 'Period', 'Value (USD)', config)

  }, [data, containerWidth])

  return <div ref={chartRef} className="line-chart-container" />
}

export default LineChart

