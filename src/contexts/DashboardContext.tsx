import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import { executeSuggestion, type ExecuteSuggestionTabData } from '../services/api/chatbot.service'
import { useAccount } from './AccountContext'
import type { SuggestedQuestion } from '../services/graphql/types'

export interface DashboardTab {
  id: string
  /** Tab heading from API "tab information" key */
  label: string
  /** Content sent to execute_suggestion API (from API "question" key) */
  contentForApi: string
  /** Key used for dummy response lookup when API fails */
  tabInformation?: string
}

interface DashboardContextType {
  tabs: DashboardTab[]
  tabData: (ExecuteSuggestionTabData | null)[]
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
    tabInformation: sq.tabInformation ?? undefined,
  }
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [tabs, setTabs] = useState<DashboardTab[]>([])
  const [tabData, setTabData] = useState<(ExecuteSuggestionTabData | null)[]>([])
  const [loadingTabs, setLoadingTabs] = useState(false)
  const { account } = useAccount()
  const fetchRunRef = useRef(0)

  const setTabsAndFetchData = useCallback((suggestedQuestions: SuggestedQuestion[]) => {
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

    const runId = ++fetchRunRef.current

    // Fire all tab requests in parallel; each tab updates as soon as its response arrives
    // (first tab to complete clears global loading; others fill in in background)
    newTabs.forEach((tab, i) => {
      executeSuggestion(tab.contentForApi, account, tab.tabInformation)
        .catch((): ExecuteSuggestionTabData | null => null)
        .then((result) => {
          if (runId !== fetchRunRef.current) return
          setTabData((prev) => {
            const next = [...prev]
            if (i >= 0 && i < next.length) next[i] = result
            return next
          })
          setLoadingTabs(false)
        })
    })
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
