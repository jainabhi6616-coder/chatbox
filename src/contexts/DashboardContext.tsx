import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { executeSuggestion } from '../services/api/chatbot.service'
import { useAccount } from './AccountContext'
import type { SuggestedQuestion } from '../services/graphql/types'

export interface DashboardTab {
  id: string
  /** Tab heading from API "tab information" key */
  label: string
  /** Content sent to execute_suggestion API (from API "question" key) */
  contentForApi: string
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
    label: sq.tabInformation ?? sq.text,
    contentForApi: sq.text,
  }
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [tabs, setTabs] = useState<DashboardTab[]>([])
  const [tabData, setTabData] = useState<(unknown | null)[]>([])
  const [loadingTabs, setLoadingTabs] = useState(false)
  const { account } = useAccount()

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
          executeSuggestion(tab.contentForApi, account).catch(() => null)
        )
      )
      setTabData(results)
    } finally {
      setLoadingTabs(false)
    }
  }, [account])

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
