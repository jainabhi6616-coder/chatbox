import { memo } from 'react'
import './LoadingIndicator.css'

interface LoadingIndicatorProps {
  message?: string
}

const LoadingIndicator = memo(({ message = 'AI is thinking' }: LoadingIndicatorProps) => {
  return (
    <div className="loading-indicator">
      <div className="loading-indicator-content">
        <div className="loading-indicator-avatar">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="loading-indicator-text">
          <span className="loading-indicator-message">{message}</span>
          <div className="loading-indicator-dots">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        </div>
      </div>
    </div>
  )
})

LoadingIndicator.displayName = 'LoadingIndicator'

export default LoadingIndicator

