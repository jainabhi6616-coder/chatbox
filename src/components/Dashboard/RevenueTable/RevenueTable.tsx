import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { parseResponseData, formatNumber, getChartRows } from '../../../utils/data-parser.utils'
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
    if (!data) return { rows: [], headers: [], hasData: false }
    return parseResponseData(data)
  }, [data])

  const chartRows = useMemo(() => getChartRows(parsed), [parsed])

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
    // Clear table content when switching away from table view
    if (viewType !== 'table') {
      if (tableRef.current) {
        d3.select(tableRef.current).selectAll('*').remove()
      }
      return
    }

    // Render table only when viewType is 'table'
    if (!tableRef.current || !parsed.hasData) return

    d3.select(tableRef.current).selectAll('*').remove()
    renderTable(parsed)
  }, [parsed, viewType])

  const renderTable = (parsed: ReturnType<typeof parseResponseData>) => {
    if (!tableRef.current || !parsed.headers.length) return

    const wrapper = d3.select(tableRef.current)
      .append('div')
      .attr('class', 'revenue-table-wrapper')

    const table = wrapper
      .append('table')
      .attr('class', 'revenue-table')

    const thead = table.append('thead')
    const headerRow = thead.append('tr').attr('role', 'row')

    const headerCells = headerRow.selectAll('th')
      .data(parsed.headers)
      .enter()
      .append('th')
      .text((d) => d)
      .attr('class', 'revenue-table-header')
      .attr('scope', 'col')
      .attr('role', 'columnheader')

    headerCells.filter((d) => d === 'Value (USD)').style('text-align', 'right')

    const tbody = table.append('tbody')
    const valueCol = 'Value (USD)'

    const sortedRows = [...parsed.rows].sort((a, b) => {
      for (const h of parsed.headers) {
        if (h === valueCol) continue
        const va = String(a[h] ?? '')
        const vb = String(b[h] ?? '')
        if (va !== vb) return va.localeCompare(vb)
      }
      return 0
    })

    const rows = tbody.selectAll('tr')
      .data(sortedRows)
      .enter()
      .append('tr')
      .attr('class', 'revenue-table-row')
      .attr('role', 'row')

    parsed.headers.forEach((header) => {
      rows.append('td')
        .text((d) => {
          const v = d[header]
          if (header === valueCol && typeof v === 'number') return `$${formatNumber(v)}`
          return String(v ?? '—')
        })
        .attr('class', `revenue-table-cell revenue-table-cell--${header.toLowerCase().replace(/\s+/g, '-')}`)
        .style('text-align', header === valueCol ? 'right' : 'left')
        .style('font-weight', header === valueCol ? '600' : '')
    })

    rows.on('mouseenter', function () {
      d3.select(this).classed('revenue-table-row-hover', true)
    }).on('mouseleave', function () {
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
          <div key="table-view" ref={tableRef} className="revenue-table-content" />
        ) : (
          <div key="chart-view" ref={chartContainerRef} className="revenue-chart-wrapper">
            <div key={viewType} className="revenue-chart-slot">
              {viewType === 'bar' && (
                <BarChart data={chartRows} containerWidth={containerWidth} />
              )}
              {viewType === 'line' && (
                <LineChart data={chartRows} containerWidth={containerWidth} />
              )}
              {viewType === 'pie' && (
                <PieChart data={chartRows} containerWidth={containerWidth} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RevenueTable
