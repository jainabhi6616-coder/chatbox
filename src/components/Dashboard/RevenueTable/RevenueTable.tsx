import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { parseResponseData, formatNumber } from '../../../utils/data-parser.utils'
import { exportToCSV, exportToJSON } from '../../../utils/export.utils'
import { BarChart, LineChart, PieChart } from '../../../shared/components/Charts'
import './RevenueTable.css'

type ViewType = 'table' | 'bar' | 'line' | 'pie'

interface RevenueTableProps {
  data?: any // The output object from the API response
}

const RevenueTable = ({ data }: RevenueTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [viewType, setViewType] = useState<ViewType>('table')
  const [containerWidth, setContainerWidth] = useState(800)

  // Parse data once
  const parsed = useMemo(() => {
    if (!data) return { rows: [], hasData: false }
    return parseResponseData(data)
  }, [data])

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.clientWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(() => {
    if (!tableRef.current || !parsed.hasData) return

    // Clear previous content
    d3.select(tableRef.current).selectAll('*').remove()

    if (viewType === 'table') {
      renderTable(parsed)
    }
  }, [parsed, viewType])

  const renderTable = (parsed: ReturnType<typeof parseResponseData>) => {
    if (!tableRef.current) return

    // Create wrapper for table
    const wrapper = d3.select(tableRef.current)
      .append('div')
      .attr('class', 'revenue-table-wrapper')

    // Create table
    const table = wrapper
      .append('table')
      .attr('class', 'revenue-table')

    // Create header
    const thead = table.append('thead')
    const headerRow = thead.append('tr')
      .attr('role', 'row')
    
    const columns = ['Forecast', 'Period', 'Metric', 'Value (USD)']
    const headerCells = headerRow.selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      .text((d) => d)
      .attr('class', 'revenue-table-header')
      .attr('scope', 'col')
      .attr('role', 'columnheader')
    
    // Right align the Value column header
    headerCells.filter((d) => d === 'Value (USD)')
      .style('text-align', 'right')

    // Create body
    const tbody = table.append('tbody')
    
    // Sort rows by Forecast, then Period
    const sortedRows = [...parsed.rows].sort((a, b) => {
      if (a.Forecast !== b.Forecast) {
        return a.Forecast.localeCompare(b.Forecast)
      }
      return a.Period.localeCompare(b.Period)
    })

    const rows = tbody.selectAll('tr')
      .data(sortedRows)
      .enter()
      .append('tr')
      .attr('class', 'revenue-table-row')
      .attr('role', 'row')

    // Add cells
    rows.append('td')
      .text((d) => d.Forecast)
      .attr('class', 'revenue-table-cell forecast-cell')

    rows.append('td')
      .text((d) => d.Period)
      .attr('class', 'revenue-table-cell period-cell')

    rows.append('td')
      .text((d) => d.Metric)
      .attr('class', 'revenue-table-cell metric-cell')

    rows.append('td')
      .text((d) => `$${formatNumber(d.Value)}`)
      .attr('class', 'revenue-table-cell value-cell')
      .style('text-align', 'right')
      .style('font-weight', '600')

    // Add hover effect
    rows.on('mouseenter', function() {
      d3.select(this).classed('revenue-table-row-hover', true)
    })
    .on('mouseleave', function() {
      d3.select(this).classed('revenue-table-row-hover', false)
    })
  }

  const handleViewTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewType(e.target.value as ViewType)
  }

  const handleExportCSV = () => {
    if (parsed.hasData) {
      exportToCSV(parsed.rows, 'revenue-data.csv')
    }
  }

  const handleExportJSON = () => {
    if (parsed.hasData) {
      exportToJSON(parsed.rows, 'revenue-data.json')
    }
  }

  if (!parsed.hasData) {
    return (
      <div className="revenue-table-container">
        <div className="revenue-table-empty-state">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="revenue-table-container">
      <div className="revenue-table-controls">
        <div className="revenue-table-header-section">
          <h3 className="revenue-table-title">US Sales Deep Dive</h3>
          <p className="revenue-table-subtitle">Revenue forecast analysis</p>
        </div>
        <div className="revenue-table-actions">
          <div className="revenue-table-view-selector">
            <label htmlFor="view-type-select" className="revenue-table-label">
              View Type:
            </label>
            <select
              id="view-type-select"
              className="revenue-table-dropdown"
              value={viewType}
              onChange={handleViewTypeChange}
              aria-label="Select chart view type"
            >
              <option value="table">Table</option>
              <option value="bar">Bar Graph</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>
          {parsed.hasData && viewType === 'table' && (
            <div className="revenue-table-export-buttons">
              <button
                className="revenue-table-export-btn"
                onClick={handleExportCSV}
                aria-label="Export to CSV"
                title="Export to CSV"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                </svg>
                CSV
              </button>
              <button
                className="revenue-table-export-btn"
                onClick={handleExportJSON}
                aria-label="Export to JSON"
                title="Export to JSON"
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                </svg>
                JSON
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="revenue-table-content-wrapper">
        {viewType === 'table' ? (
          <div ref={tableRef} className="revenue-table-content" />
        ) : (
          <div ref={chartContainerRef} className="revenue-chart-wrapper">
            {viewType === 'bar' && (
              <BarChart data={parsed.rows} containerWidth={containerWidth} />
            )}
            {viewType === 'line' && (
              <LineChart data={parsed.rows} containerWidth={containerWidth} />
            )}
            {viewType === 'pie' && (
              <PieChart data={parsed.rows} containerWidth={containerWidth} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RevenueTable
