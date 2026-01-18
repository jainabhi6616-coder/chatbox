import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loadMessagesFromStorage } from '../utils/storage.utils'
import type { Message } from '../interfaces'

interface RevenueDataContextType {
  revenueData: unknown | null
  setRevenueData: (data: unknown) => void
  clearRevenueData: () => void
}

const RevenueDataContext = createContext<RevenueDataContextType | undefined>(undefined)

const findLatestRevenueData = (stored: unknown[]): unknown | null => {
  if (!stored || stored.length === 0) return null

  const botMessageWithData = stored
    .filter((msg): msg is Message & { rawData?: unknown } => 
      typeof msg === 'object' && 
      msg !== null && 
      'sender' in msg && 
      msg.sender === 'bot' && 
      'rawData' in msg && 
      msg.rawData !== undefined
    )
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return timeB - timeA
    })[0]

  return botMessageWithData?.rawData || null
}

export const RevenueDataProvider = ({ children }: { children: ReactNode }) => {
  const [revenueData, setRevenueData] = useState<unknown | null>(() => {
    // Initialize revenue data from localStorage on mount
    const stored = loadMessagesFromStorage()
    return findLatestRevenueData(stored || [])
  })

  // Also restore on mount in case messages were updated
  useEffect(() => {
    const stored = loadMessagesFromStorage()
    const latestData = findLatestRevenueData(stored || [])
    if (latestData) {
      setRevenueData(latestData)
    }
  }, [])

  const clearRevenueData = () => {
    setRevenueData(null)
  }

  return (
    <RevenueDataContext.Provider value={{ revenueData, setRevenueData, clearRevenueData }}>
      {children}
    </RevenueDataContext.Provider>
  )
}

export const useRevenueData = () => {
  const context = useContext(RevenueDataContext)
  if (context === undefined) {
    throw new Error('useRevenueData must be used within a RevenueDataProvider')
  }
  return context
}
