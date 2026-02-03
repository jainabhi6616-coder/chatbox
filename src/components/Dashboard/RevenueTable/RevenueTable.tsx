import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { parseResponseData, formatNumber } from '../../../utils/data-parser.utils'
import { APP_CONFIG } from '../../../config/app.config'
import { BarChart, LineChart, PieChart } from '../../../shared/components/Charts'
import './RevenueTable.css'

type ViewType = 'table' | 'bar' | 'line' | 'pie'

interface RevenueTableProps {
  data?: unknown
  /** Tab/section title (e.g. from suggested_questions question) */
  title?: string
}

const RevenueTable = ({ data, title }: RevenueTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [viewType, setViewType] = useState<ViewType>('table')
  const [containerWidth, setContainerWidth] = useState(800)
  const [downloadLoading, setDownloadLoading] = useState(false)

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
    if (viewType !== 'table') return
    if (!tableRef.current || !parsed.hasData) return

    d3.select(tableRef.current).selectAll('*').remove()
    renderTable(parsed)
  }, [parsed, viewType])

  // When switching away from table, ensure table container is cleared (ref may still be set briefly)
  useEffect(() => {
    if (viewType !== 'table' && tableRef.current) {
      d3.select(tableRef.current).selectAll('*').remove()
    }
  }, [viewType])

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

  const handleDownload = useCallback(async () => {
    if (data == null) return
    setDownloadLoading(true)
    try {
      const res = await fetch(APP_CONFIG.DOWNLOAD_EXCEL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output: data }),
      })
      if (!res.ok) throw new Error(`Download failed: ${res.status}`)
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      const filename = match?.[1]?.replace(/['"]/g, '') || 'download.xlsx'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloadLoading(false)
    }
  }, [data])

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
          <h3 className="revenue-table-title">{title ?? 'US Sales Deep Dive'}</h3>
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
          {parsed.hasData && (
            <div className="revenue-table-download-wrap">
              <button
                className="revenue-table-download-btn"
                onClick={handleDownload}
                disabled={downloadLoading}
                aria-label="Download Excel"
                title="Download Excel"
                type="button"
              >
                {downloadLoading ? (
                  <span className="revenue-table-download-spinner" aria-hidden />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                Download
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={`revenue-table-content-wrapper ${viewType !== 'table' ? 'revenue-table-content-wrapper--chart' : ''}`}
      >
        {viewType === 'table' ? (
          <div ref={tableRef} className="revenue-table-content" />
        ) : (
          <div ref={chartContainerRef} className="revenue-chart-wrapper">
            <div key={viewType} className="revenue-chart-slot">
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
          </div>
        )}
      </div>
    </div>
  )
}

export default RevenueTable
