import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { parseResponseData, formatValueCell, getChartRows } from '../../../utils/data-parser.utils'
import { APP_CONFIG } from '../../../config/app.config'
import { BarChart, LineChart, PieChart, ApiGraphChart } from '../../../shared/components/Charts'
import type { GraphPayload } from '../../../types/graph.types'
import './RevenueTable.css'

type ViewType = 'table' | 'bar' | 'line' | 'pie'

interface RevenueTableProps {
  data?: unknown
  /** Tab/section title (e.g. from suggested_questions question) */
  title?: string
  /** When present, charts are rendered from API graph spec instead of parsed output */
  graphPayload?: GraphPayload | null
}

const RevenueTable = ({ data, title, graphPayload }: RevenueTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [viewType, setViewType] = useState<ViewType>('table')
  const [viewMode, setViewMode] = useState<string>('table')
  const [containerWidth, setContainerWidth] = useState(800)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const graphs = graphPayload?.graphs ?? []
  const hasApiGraphs = graphs.length > 0
  const isTableView = hasApiGraphs ? viewMode === 'table' : viewType === 'table'
  const selectedGraphIndex = viewMode.startsWith('graph-') ? parseInt(viewMode.replace('graph-', ''), 10) : 0

  // When we have API graphs (dashboard tabs), default to first chart; otherwise table
  useEffect(() => {
    setViewMode(hasApiGraphs ? 'graph-0' : 'table')
  }, [graphPayload, hasApiGraphs])

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
    if (!isTableView) {
      if (tableRef.current) {
        d3.select(tableRef.current).selectAll('*').remove()
      }
      return
    }
    if (!tableRef.current || !parsed.hasData) return
    d3.select(tableRef.current).selectAll('*').remove()
    renderTable(parsed)
  }, [parsed, isTableView])

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

    const rows = tbody.selectAll('tr')
      .data(parsed.rows)
      .enter()
      .append('tr')
      .attr('class', 'revenue-table-row')
      .attr('role', 'row')

    parsed.headers.forEach((header) => {
      rows.append('td')
        .text((d) => {
          const v = d[header]
          if (header === valueCol && typeof v === 'number') {
            return formatValueCell(v, d['Metric'])
          }
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
    const v = e.target.value
    if (hasApiGraphs) setViewMode(v)
    else setViewType(v as ViewType)
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

  if (!parsed.hasData && !hasApiGraphs) {
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
              View:
            </label>
            <select
              id="view-type-select"
              className="revenue-table-dropdown"
              value={hasApiGraphs ? viewMode : viewType}
              onChange={handleViewTypeChange}
              aria-label="Select view type"
            >
              <option value="table">Table</option>
              {hasApiGraphs
                ? graphs.map((g, i) => (
                    <option key={i} value={`graph-${i}`}>
                      {g.title ?? `${g.chartType} ${i + 1}`}
                    </option>
                  ))
                : (
                  <>
                    <option value="bar">Bar Graph</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                  </>
                  )}
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
        className={`revenue-table-content-wrapper ${!isTableView ? 'revenue-table-content-wrapper--chart' : ''}`}
      >
        {isTableView ? (
          <div key="table-view" ref={tableRef} className="revenue-table-content" />
        ) : hasApiGraphs && graphs[selectedGraphIndex] ? (
          <div key="api-graph" ref={chartContainerRef} className="revenue-chart-wrapper">
            <ApiGraphChart spec={graphs[selectedGraphIndex]} containerWidth={containerWidth} />
          </div>
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
