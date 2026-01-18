import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { parseResponseData, formatNumber } from '../../../utils/data-parser.utils'
import './MessageTable.css'

interface MessageTableProps {
  data: any
}

const MessageTable = ({ data }: MessageTableProps) => {
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tableRef.current || !data) return

    // Clear previous content
    d3.select(tableRef.current).selectAll('*').remove()

    // Parse the data
    const parsed = parseResponseData(data)
    
    if (!parsed.hasData) {
      return
    }

    // Create table container
    const container = d3.select(tableRef.current)
      .append('div')
      .attr('class', 'message-table-wrapper')

    // Create table
    const table = container.append('table')
      .attr('class', 'message-table')

    // Create header
    const thead = table.append('thead')
    const headerRow = thead.append('tr')
    
    const columns = ['Forecast', 'Period', 'Metric', 'Value (USD)']
    headerRow.selectAll('th')
      .data(columns)
      .enter()
      .append('th')
      .text((d) => d)
      .attr('class', 'message-table-header')

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
      .attr('class', 'message-table-row')

    // Add cells
    rows.append('td')
      .text((d) => d.Forecast)
      .attr('class', 'message-table-cell forecast-cell')

    rows.append('td')
      .text((d) => d.Period)
      .attr('class', 'message-table-cell period-cell')

    rows.append('td')
      .text((d) => d.Metric)
      .attr('class', 'message-table-cell metric-cell')

    rows.append('td')
      .text((d) => `$${formatNumber(d.Value)}`)
      .attr('class', 'message-table-cell value-cell')
      .style('text-align', 'right')
      .style('font-weight', '600')

  }, [data])

  return <div ref={tableRef} className="message-table-container" />
}

export default MessageTable

