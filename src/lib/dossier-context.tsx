'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DossierContextType {
  refreshTrigger: number
  triggerRefresh: () => void
}

const DossierContext = createContext<DossierContextType | undefined>(undefined)

export function DossierProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <DossierContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </DossierContext.Provider>
  )
}

export function useDossierRefresh() {
  const context = useContext(DossierContext)
  if (context === undefined) {
    throw new Error('useDossierRefresh must be used within a DossierProvider')
  }
  return context
}
