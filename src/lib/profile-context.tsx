'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { useAuth } from './auth-context'

interface ProfileData {
  userImage: string
  userName: string
}

interface ProfileContextType {
  profile: ProfileData
  updateUserImage: (imageUrl: string) => void
  updateUserName: (name: string) => void
  isHydrated: boolean
}

const defaultProfile: ProfileData = {
  userImage: '',
  userName: 'You'
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData>(defaultProfile)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load profile from localStorage on mount and sync with auth user
  useEffect(() => {
    const savedProfile = localStorage.getItem('user-profile')
    let initialProfile = defaultProfile
    
    if (savedProfile) {
      try {
        initialProfile = JSON.parse(savedProfile)
      } catch (error) {
        console.error('Error parsing saved profile:', error)
      }
    }

    // If user is authenticated, use their display name or extract from email
    if (user) {
      const userName = user.display_name || user.email?.split('@')[0] || 'You'
      initialProfile = {
        ...initialProfile,
        userName: userName
      }
    }

    setProfile(initialProfile)
    setIsHydrated(true)
  }, [user])

  const updateUserImage = useCallback((imageUrl: string) => {
    setProfile(prev => {
      const updated = { ...prev, userImage: imageUrl }
      localStorage.setItem('user-profile', JSON.stringify(updated))
      return updated
    })
  }, [])

  const updateUserName = useCallback((name: string) => {
    setProfile(prev => {
      const updated = { ...prev, userName: name }
      localStorage.setItem('user-profile', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, updateUserImage, updateUserName, isHydrated }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
