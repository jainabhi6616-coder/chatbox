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
import './BarChart.css'

interface BarChartProps {
  data: TableRow[]
  containerWidth?: number
}

const BarChart = ({ data, containerWidth = 800 }: BarChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data.length) return

    d3.select(chartRef.current).selectAll('*').remove()

    const config = getChartDimensions(containerWidth, 1.6, true)
    const { svg, g } = createSVGContainer(d3.select(chartRef.current), config, 'bar-chart-svg')

    const chartData = groupDataByPeriod(data)

    // Create scales — higher padding = narrower bars, more space between
    const xScale = d3.scaleBand()
      .domain(chartData.map((d) => d.period))
      .range([0, config.width])
      .padding(0.55)

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) || 0])
      .nice()
      .range([config.height, 0])

    // Add X axis — rotate long labels to avoid clipping
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

    // Add Y axis
    g.append('g')
      .call(
        d3.axisLeft(yScale)
          .tickFormat((d) => formatValueForChart(d as number))
      )
      .attr('class', 'chart-axis')
      .selectAll('text')
      .style('font-size', '11px')

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

    // Add bars
    const bars = g.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'chart-bar')
      .attr('x', (d) => xScale(d.period) || 0)
      .attr('y', config.height)
      .attr('width', xScale.bandwidth())
      .attr('height', 0)
      .attr('fill', CHART_COLORS.primary)
      .attr('rx', 4)
      .attr('ry', 4)

    // Animate bars
    bars.transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.value))
      .attr('height', (d) => config.height - yScale(d.value))

    // Add value labels on bars
    bars.each(function(d) {
      if (config.height - yScale(d.value) > 20) {
        g.append('text')
          .attr('x', (xScale(d.period) || 0) + xScale.bandwidth() / 2)
          .attr('y', yScale(d.value) - 5)
          .attr('text-anchor', 'middle')
          .attr('class', 'chart-bar-label')
          .text(formatValueForChart(d.value))
          .attr('opacity', 0)
          .transition()
          .delay(800)
          .duration(300)
          .attr('opacity', 1)
      }
    })

    // Add hover effects
    bars.on('mouseenter', function(_event, d) {
      d3.select(this)
        .attr('fill', CHART_COLORS.primaryDark)
        .attr('transform', 'scale(1.05)')
        .attr('transform-origin', 'center bottom')

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
        .attr('fill', CHART_COLORS.primary)
        .attr('transform', 'scale(1)')

      g.selectAll('.chart-tooltip').remove()
    })

    addChartTitle(svg, 'Revenue by Period', config)
    addAxisLabels(g, 'Period', 'Value (USD)', config)

  }, [data, containerWidth])

  return <div ref={chartRef} className="bar-chart-container" />
}

export default BarChart

