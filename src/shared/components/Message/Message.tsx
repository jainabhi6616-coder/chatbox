import { memo, useMemo, useState, useCallback } from 'react'
import { Message as MessageType } from '../../../interfaces'
import { formatMessageTime } from '../../../utils'
import { parseResponseData, isChartableData, formatNumber } from '../../../utils/data-parser.utils'
import { useToast } from '../../../contexts/ToastContext'
import { APP_CONFIG } from '../../../config/app.config'
import './Message.css'

interface MessageProps {
  message: MessageType
  onRetry?: () => void
  showRetry?: boolean
}

const Message = memo(({ message, onRetry, showRetry = false }: MessageProps) => {
  const [copied, setCopied] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const { showToast } = useToast()
  const isUserMessage = message.sender === 'user'
  const formattedTime = useMemo(
    () => formatMessageTime(message.timestamp),
    [message.timestamp]
  )

  const hasChartableData = message.rawData != null && isChartableData(message.rawData)
  const tableData = useMemo(() => {
    if (!message.rawData) return parseResponseData(null)
    return parseResponseData(message.rawData)
  }, [message.rawData])

  const messageText = typeof message.text === 'string' ? message.text : String(message.text || '')

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
      showToast('Message copied to clipboard', 'success', 2000)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
      showToast('Failed to copy message', 'error', 2000)
    }
  }, [messageText, showToast])

  const handleDownload = useCallback(async () => {
    if (message.rawData == null) return
    setDownloadLoading(true)
    try {
      const res = await fetch(APP_CONFIG.DOWNLOAD_EXCEL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output: message.rawData }),
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
      showToast('Download started', 'success', 2000)
    } catch (err) {
      console.error('Download error:', err)
      showToast('Download failed', 'error', 2000)
    } finally {
      setDownloadLoading(false)
    }
  }, [message.rawData, showToast])

  const isError = showRetry && message.sender === 'bot' && messageText.toLowerCase().includes('error')

  const valueCol = 'Value (USD)'
  const sortedRows = useMemo(() => {
    if (!tableData.hasData || !tableData.headers.length) return []
    return [...tableData.rows].sort((a, b) => {
      for (const h of tableData.headers) {
        if (h === valueCol) continue
        const va = String(a[h] ?? '')
        const vb = String(b[h] ?? '')
        if (va !== vb) return va.localeCompare(vb)
      }
      return 0
    })
  }, [tableData])

  return (
    <div
      className={`message ${isUserMessage ? 'user-message' : 'bot-message'} ${isError ? 'message-error' : ''}`}
    >
      <div className="message-content">
        {hasChartableData && tableData.hasData ? (
          <div className="message-table-wrap">
            <p className="message-table-label">{messageText}</p>
            <div className="message-table-scroll">
              <table className="message-data-table" role="table">
                <thead>
                  <tr>
                    {tableData.headers.map((h) => (
                      <th key={h} scope="col" className={h === valueCol ? 'message-table-th-value' : ''}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, i) => (
                    <tr key={`${i}-${String(row[tableData.headers[0]])}`}>
                      {tableData.headers.map((h) => (
                        <td
                          key={h}
                          className={h === valueCol ? 'message-table-value' : ''}
                        >
                          {h === valueCol && typeof row[h] === 'number'
                            ? `$${formatNumber(row[h] as number)}`
                            : String(row[h] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p>{messageText}</p>
        )}
        <div className="message-footer">
          <span className="message-time">{formattedTime}</span>
          <div className="message-actions">
            {showRetry && isError && onRetry && (
              <button
                className="message-retry-button"
                onClick={onRetry}
                aria-label="Retry request"
                title="Retry request"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                </svg>
                Retry
              </button>
            )}
            {hasChartableData && tableData.hasData ? (
              <button
                className="message-download-button"
                onClick={handleDownload}
                disabled={downloadLoading}
                aria-label={downloadLoading ? 'Downloading…' : 'Download as Excel'}
                title={downloadLoading ? 'Downloading…' : 'Download as Excel'}
                type="button"
              >
                {downloadLoading ? (
                  <span className="message-download-spinner" aria-hidden />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
                  </svg>
                )}
              </button>
            ) : (
              <button
                className="message-copy-button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied!' : 'Copy message'}
                title={copied ? 'Copied!' : 'Copy message'}
                type="button"
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="currentColor"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

Message.displayName = 'Message'

export default Message
