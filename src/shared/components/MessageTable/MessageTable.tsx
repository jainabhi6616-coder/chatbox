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

    const parsed = parseResponseData(data)
    if (!parsed.hasData || !parsed.headers.length) return

    const container = d3.select(tableRef.current)
      .append('div')
      .attr('class', 'message-table-wrapper')

    const table = container.append('table').attr('class', 'message-table')
    const thead = table.append('thead')
    const headerRow = thead.append('tr')

    headerRow.selectAll('th')
      .data(parsed.headers)
      .enter()
      .append('th')
      .text((d) => d)
      .attr('class', 'message-table-header')

    const tbody = table.append('tbody')
    const valueCol = 'Value (USD)'

    const rows = tbody.selectAll('tr')
      .data(parsed.rows)
      .enter()
      .append('tr')
      .attr('class', 'message-table-row')

    parsed.headers.forEach((header) => {
      rows.append('td')
        .text((d) => {
          const v = d[header]
          if (header === valueCol && typeof v === 'number') return `$${formatNumber(v)}`
          return String(v ?? '—')
        })
        .attr('class', 'message-table-cell')
        .style('text-align', header === valueCol ? 'right' : 'left')
        .style('font-weight', header === valueCol ? '600' : '')
    })

  }, [data])

  return <div ref={tableRef} className="message-table-container" />
}

export default MessageTable

