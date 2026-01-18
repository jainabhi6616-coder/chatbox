/**
 * Export utilities for exporting data to various formats
 */

import { TableRow } from './data-parser.utils'

/**
 * Export table data to CSV
 */
export const exportToCSV = (rows: TableRow[], filename: string = 'revenue-data.csv') => {
  if (!rows || rows.length === 0) {
    alert('No data to export')
    return
  }

  const headers = ['Forecast', 'Period', 'Metric', 'Value (USD)']
  const csvRows = [
    headers.join(','),
    ...rows.map(row => [
      `"${row.Forecast}"`,
      `"${row.Period}"`,
      `"${row.Metric}"`,
      row.Value.toString()
    ].join(','))
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export table data to JSON
 */
export const exportToJSON = (rows: TableRow[], filename: string = 'revenue-data.json') => {
  if (!rows || rows.length === 0) {
    alert('No data to export')
    return
  }

  const jsonContent = JSON.stringify(rows, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export chart as PNG (for SVG charts)
 */
export const exportChartAsPNG = (svgElement: SVGSVGElement, filename: string = 'chart.png') => {
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()
  
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx?.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    canvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    })
  }

  img.src = url
}

