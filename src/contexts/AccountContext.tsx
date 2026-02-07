import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export const ACCOUNT_OPTIONS = [
  'COST OF GOODS SOLD TOTAL',
  'EBIT',
  'ORGANIC NET REVENUES',
  'SG&A',
] as const

export type AccountOption = (typeof ACCOUNT_OPTIONS)[number]

interface AccountContextType {
  account: string
  setAccount: (account: string) => void
  accountOptions: readonly string[]
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

const DEFAULT_ACCOUNT: string = ACCOUNT_OPTIONS[0]

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccountState] = useState<string>(DEFAULT_ACCOUNT)

  const setAccount = useCallback((value: string) => {
    setAccountState(value)
  }, [])

  return (
    <AccountContext.Provider
      value={{
        account,
        setAccount,
        accountOptions: ACCOUNT_OPTIONS,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export const useAccount = () => {
  const context = useContext(AccountContext)
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider')
  }
  return context
}
