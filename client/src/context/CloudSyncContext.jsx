import { createContext, useContext } from 'react'
import { useEmotionCloud } from '../hooks/useEmotionCloud'

const CloudSyncContext = createContext()

export function CloudSyncProvider({ children }) {
  const cloudState = useEmotionCloud()

  return (
    <CloudSyncContext.Provider value={cloudState}>
      {children}
    </CloudSyncContext.Provider>
  )
}

export function useCloudSync() {
  const context = useContext(CloudSyncContext)
  if (!context) {
    throw new Error('useCloudSync must be used within CloudSyncProvider')
  }
  return context
}
