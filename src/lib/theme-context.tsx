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
      // Background colors - Clean, modern light theme
      background: 'bg-gray-50',
      backgroundSecondary: 'bg-white',
      backgroundTertiary: 'bg-gray-100',
      
      // Text colors - High contrast
      text: 'text-gray-900',
      textSecondary: 'text-gray-700',
      textTertiary: 'text-gray-600',
      textMuted: 'text-gray-500',
      
      // Border colors - Subtle borders
      border: 'border-gray-200',
      borderSecondary: 'border-gray-300',
      
      // Input colors - Clean white with subtle borders
      inputBackground: 'bg-white',
      inputBorder: 'border-gray-300',
      inputFocus: 'border-blue-500',
      inputPlaceholder: 'placeholder-gray-500',
      
      // Button colors - Modern, vibrant
      buttonPrimary: 'bg-gray-900 hover:bg-gray-800 text-white border border-gray-800',
      buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
      buttonGhost: 'hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-300',
      
      // Message colors - Clean distinction
      messageUser: 'bg-gray-900 text-white border border-gray-800',
      messageAssistant: 'bg-white text-gray-900 border border-gray-200',
      messageTimestamp: 'text-gray-500',
      
      // Card colors
      cardBackground: 'bg-white',
      cardBorder: 'border-gray-200',
      
      // Sidebar colors - Light sidebar
      sidebarBackground: 'bg-gray-50',
      sidebarItem: 'hover:bg-gray-100 border-l-2 border-transparent hover:border-gray-300',
      sidebarItemActive: 'bg-gray-100 border-l-2 border-gray-900',
      
      // Glassmorphism
      glassBackground: 'bg-white/95 backdrop-blur-xl',
      glassBorder: 'border-gray-200/50',
    }
  } else {
    return {
      // Background colors - Ultra dark black theme
      background: 'bg-black',
      backgroundSecondary: 'bg-zinc-950',
      backgroundTertiary: 'bg-zinc-900',
      
      // Text colors - High contrast whites
      text: 'text-white',
      textSecondary: 'text-zinc-400',
      textTertiary: 'text-zinc-500',
      textMuted: 'text-zinc-600',
      
      // Border colors - Subtle dark borders
      border: 'border-zinc-900',
      borderSecondary: 'border-zinc-800',
      
      // Input colors - Dark charcoal
      inputBackground: 'bg-zinc-950',
      inputBorder: 'border-zinc-800',
      inputFocus: 'border-zinc-600',
      inputPlaceholder: 'placeholder-zinc-600',
      
      // Button colors - Dark with subtle glow
      buttonPrimary: 'bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800',
      buttonSecondary: 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800',
      buttonGhost: 'hover:bg-zinc-900 text-zinc-400 border border-transparent hover:border-zinc-800',
      
      // Message colors - Darker with contrast
      messageUser: 'bg-zinc-900 text-white border border-zinc-800',
      messageAssistant: 'bg-black text-zinc-200 border border-zinc-900',
      messageTimestamp: 'text-zinc-500',
      
      // Card colors
      cardBackground: 'bg-zinc-950',
      cardBorder: 'border-zinc-900',
      
      // Sidebar colors - Pure black
      sidebarBackground: 'bg-black',
      sidebarItem: 'hover:bg-zinc-950 border-l-2 border-transparent hover:border-zinc-800',
      sidebarItemActive: 'bg-zinc-950 border-l-2 border-zinc-700',
      
      // Glassmorphism
      glassBackground: 'bg-zinc-950/90 backdrop-blur-xl',
      glassBorder: 'border-zinc-900/50',
    }
  }
}
