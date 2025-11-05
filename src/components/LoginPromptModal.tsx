'use client'

import { X, LogIn, Sparkles } from 'lucide-react'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
  trigger?: 'new-story' | 'session-start' | 'story-complete'
}

export function LoginPromptModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  trigger = 'session-start' 
}: LoginPromptModalProps) {
  if (!isOpen) return null

  const getTitle = () => {
    switch (trigger) {
      case 'new-story':
        return 'Create Unlimited Stories'
      case 'story-complete':
        return 'Ready for Your Next Story?'
      default:
        return 'Unlock Your Creative Potential'
    }
  }

  const getDescription = () => {
    switch (trigger) {
      case 'new-story':
        return 'Login to create multiple stories and access advanced features like story management, character development, and script generation.'
      case 'story-complete':
        return 'Great job completing your story! Login to create unlimited stories and never lose your creative work.'
      default:
        return 'Login to create unlimited stories, save your progress, and access advanced story development features.'
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      style={{ 
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '50',
        padding: 'clamp(0.5rem, 2vw, 1rem)',
        margin: '0',
        boxSizing: 'border-box',
        width: '100vw',
        height: '100vh'
      }}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl relative"
        style={{
          padding: 'clamp(1.5rem, 5vw, 2rem)',
          margin: '0',
          borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: 'clamp(20rem, 80vw, 28rem)',
          width: '100%',
          position: 'relative',
          boxSizing: 'border-box',
          maxHeight: '90vh',
          overflowY: 'auto',
          flexShrink: '0'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            padding: '0.5rem',
            margin: '0',
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div 
          className="text-center mb-6"
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            padding: '0',
            marginTop: '0'
          }}
        >
          <div 
            className="w-16 h-16 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              padding: '0'
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              fontWeight: '700',
              marginBottom: '0.5rem',
              marginTop: '0',
              padding: '0',
              lineHeight: '1.2'
            }}
          >
            {getTitle()}
          </h2>
          <p 
            className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
            style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              lineHeight: '1.6',
              margin: '0',
              padding: '0'
            }}
          >
            {getDescription()}
          </p>
        </div>

        {/* Features list */}
        <div 
          className="mb-6"
          style={{
            marginBottom: '1.5rem',
            padding: '0',
            marginTop: '0'
          }}
        >
          <div 
            className="space-y-3"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(0.5rem, 2vw, 0.75rem)',
              margin: '0',
              padding: '0'
            }}
          >
            <div 
              className="flex items-center text-sm text-gray-700 dark:text-gray-300"
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                margin: '0',
                padding: '0'
              }}
            >
              <div 
                className="w-2 h-2 bg-purple-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#8b5cf6',
                  borderRadius: '50%',
                  marginRight: 'clamp(0.5rem, 2vw, 0.75rem)',
                  flexShrink: '0'
                }}
              ></div>
              Create unlimited stories
            </div>
            <div 
              className="flex items-center text-sm text-gray-700 dark:text-gray-300"
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                margin: '0',
                padding: '0'
              }}
            >
              <div 
                className="w-2 h-2 bg-purple-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#8b5cf6',
                  borderRadius: '50%',
                  marginRight: 'clamp(0.5rem, 2vw, 0.75rem)',
                  flexShrink: '0'
                }}
              ></div>
              Save and manage your stories
            </div>
            <div 
              className="flex items-center text-sm text-gray-700 dark:text-gray-300"
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                margin: '0',
                padding: '0'
              }}
            >
              <div 
                className="w-2 h-2 bg-purple-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#8b5cf6',
                  borderRadius: '50%',
                  marginRight: 'clamp(0.5rem, 2vw, 0.75rem)',
                  flexShrink: '0'
                }}
              ></div>
              Access advanced AI features
            </div>
            <div 
              className="flex items-center text-sm text-gray-700 dark:text-gray-300"
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                margin: '0',
                padding: '0'
              }}
            >
              <div 
                className="w-2 h-2 bg-purple-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#8b5cf6',
                  borderRadius: '50%',
                  marginRight: 'clamp(0.5rem, 2vw, 0.75rem)',
                  flexShrink: '0'
                }}
              ></div>
              Generate scripts and pitches
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div 
          className="space-y-3"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(0.5rem, 2vw, 0.75rem)',
            margin: '0',
            padding: '0'
          }}
        >
          <button
            onClick={onLogin}
            className="w-full bg-white dark:bg-slate-700 border-2 border-purple-500 text-purple-500 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-600 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            style={{
              width: '100%',
              background: 'white',
              border: '2px solid #8b5cf6',
              color: '#8b5cf6',
              fontWeight: '600',
              padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)',
              borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
              transition: 'all 0.2s ease',
              margin: '0',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3e8ff'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Footer */}
        <div 
          className="mt-4 text-center"
          style={{
            marginTop: 'clamp(1rem, 3vw, 1.5rem)',
            textAlign: 'center',
            padding: '0',
            marginBottom: '0'
          }}
        >
          <button
            onClick={onClose}
            className="text-sm text-gray-200 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            style={{
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              color: '#e5e7eb',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              margin: '0',
              padding: '0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#e5e7eb'
            }}
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  )
}
