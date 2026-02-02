import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { executeSuggestion } from '../services/api/chatbot.service'
import type { SuggestedQuestion } from '../services/graphql/types'

export interface DashboardTab {
  id: string
  label: string
  tabInformation: string
}

interface DashboardContextType {
  tabs: DashboardTab[]
  tabData: (unknown | null)[]
  loadingTabs: boolean
  setTabsAndFetchData: (suggestedQuestions: SuggestedQuestion[]) => void
  clearDashboard: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

const MAX_TABS = 3

function toDashboardTab(sq: SuggestedQuestion, index: number): DashboardTab {
  return {
    id: sq.id || `tab-${index + 1}`,
    label: sq.text,
    tabInformation: sq.tabInformation ?? sq.text,
  }
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [tabs, setTabs] = useState<DashboardTab[]>([])
  const [tabData, setTabData] = useState<(unknown | null)[]>([])
  const [loadingTabs, setLoadingTabs] = useState(false)

  const setTabsAndFetchData = useCallback(async (suggestedQuestions: SuggestedQuestion[]) => {
    const list = (suggestedQuestions || []).slice(0, MAX_TABS)
    if (list.length === 0) {
      setTabs([])
      setTabData([])
      return
    }

    const newTabs = list.map((sq, i) => toDashboardTab(sq, i))
    setTabs(newTabs)
    setTabData(list.map(() => null))
    setLoadingTabs(true)

    try {
      const results = await Promise.all(
        newTabs.map((tab) =>
          executeSuggestion(tab.tabInformation).catch(() => null)
        )
      )
      setTabData(results)
    } finally {
      setLoadingTabs(false)
    }
  }, [])

  const clearDashboard = useCallback(() => {
    setTabs([])
    setTabData([])
  }, [])

  return (
    <DashboardContext.Provider
      value={{
        tabs,
        tabData,
        loadingTabs,
        setTabsAndFetchData,
        clearDashboard,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
