'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'stories-we-tell-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Load theme from localStorage on mount
    const storedTheme = localStorage.getItem(storageKey) as Theme
    if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
      setTheme(storedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Remove previous theme classes
    root.classList.remove('light', 'dark')

    let resolved: 'light' | 'dark'

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      resolved = systemTheme
    } else {
      resolved = theme
    }

    setResolvedTheme(resolved)
    root.classList.add(resolved)

    // Store theme preference
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        setResolvedTheme(systemTheme)
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(systemTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'system'
      return 'light'
    })
  }

  const value = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme-aware color utilities
export const getThemeColors = (resolvedTheme: 'light' | 'dark') => {
  if (resolvedTheme === 'light') {
    return {
      // Background colors
      background: 'bg-white',
      backgroundSecondary: 'bg-gray-50',
      backgroundTertiary: 'bg-gray-100',
      
      // Text colors
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      textMuted: 'text-gray-400',
      
      // Border colors
      border: 'border-gray-200',
      borderSecondary: 'border-gray-300',
      
      // Input colors
      inputBackground: 'bg-white',
      inputBorder: 'border-gray-300',
      inputFocus: 'border-blue-500',
      inputPlaceholder: 'placeholder-gray-400',
      
      // Button colors
      buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonSecondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      buttonGhost: 'hover:bg-gray-100 text-gray-700',
      
      // Message colors
      messageUser: 'bg-blue-500 text-white',
      messageAssistant: 'bg-gray-100 text-gray-900',
      messageTimestamp: 'text-gray-500',
      
      // Card colors
      cardBackground: 'bg-white',
      cardBorder: 'border-gray-200',
      
      // Sidebar colors
      sidebarBackground: 'bg-gray-50',
      sidebarItem: 'hover:bg-gray-100',
      sidebarItemActive: 'bg-gray-200',
      
      // Glassmorphism
      glassBackground: 'bg-white/80',
      glassBorder: 'border-white/20',
    }
  } else {
    return {
      // Background colors
      background: 'bg-slate-950',
      backgroundSecondary: 'bg-slate-900',
      backgroundTertiary: 'bg-slate-800',
      
      // Text colors
      text: 'text-slate-100',
      textSecondary: 'text-slate-300',
      textTertiary: 'text-slate-400',
      textMuted: 'text-slate-500',
      
      // Border colors
      border: 'border-slate-700',
      borderSecondary: 'border-slate-600',
      
      // Input colors
      inputBackground: 'bg-slate-800',
      inputBorder: 'border-slate-600',
      inputFocus: 'border-sky-400',
      inputPlaceholder: 'placeholder-slate-400',
      
      // Button colors
      buttonPrimary: 'bg-sky-600 hover:bg-sky-700 text-white',
      buttonSecondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
      buttonGhost: 'hover:bg-slate-800 text-slate-300',
      
      // Message colors
      messageUser: 'bg-blue-500 text-white',
      messageAssistant: 'bg-slate-800 text-slate-100',
      messageTimestamp: 'text-slate-300',
      
      // Card colors
      cardBackground: 'bg-slate-800',
      cardBorder: 'border-slate-700',
      
      // Sidebar colors
      sidebarBackground: 'bg-slate-900',
      sidebarItem: 'hover:bg-slate-800',
      sidebarItemActive: 'bg-slate-700',
      
      // Glassmorphism
      glassBackground: 'bg-slate-800/50',
      glassBorder: 'border-slate-600/50',
    }
  }
}
