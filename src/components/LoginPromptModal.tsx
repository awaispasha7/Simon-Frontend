'use client'

import { X, UserPlus, LogIn, Sparkles } from 'lucide-react'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSignup: () => void
  onLogin: () => void
  trigger?: 'new-content' | 'session-start' | 'content-complete'
}

export function LoginPromptModal({ 
  isOpen, 
  onClose, 
  onSignup, 
  onLogin, 
  trigger = 'session-start' 
}: LoginPromptModalProps) {
  if (!isOpen) return null

  const getTitle = () => {
    switch (trigger) {
      case 'new-content':
        return 'Create Unlimited Content'
      case 'content-complete':
        return 'Ready for Your Next Content?'
      default:
        return 'Unlock Your Creative Potential'
    }
  }

  const getDescription = () => {
    switch (trigger) {
      case 'new-content':
        return 'Sign up to create multiple content pieces and access advanced features like content management, script generation, and analytics.'
      case 'content-complete':
        return 'Great job completing your content! Sign up to create unlimited content and never lose your work.'
      default:
        return 'Sign up to create unlimited content, save your progress, and access advanced content creation features.'
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
            className="w-16 h-16 bg-linear-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
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
                className="w-2 h-2 bg-red-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  marginRight: 'clamp(0.5rem, 2vw, 0.75rem)',
                  flexShrink: '0'
                }}
              ></div>
              Create unlimited content
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
                className="w-2 h-2 bg-red-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#ef4444',
                  borderRadius: '50%',
                  marginRight: 'clamp(0.5rem, 2vw, 0.75rem)',
                  flexShrink: '0'
                }}
              ></div>
              Save and manage your content
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
                className="w-2 h-2 bg-red-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#ef4444',
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
                className="w-2 h-2 bg-red-500 rounded-full mr-3"
                style={{
                  width: 'clamp(0.375rem, 1vw, 0.5rem)',
                  height: 'clamp(0.375rem, 1vw, 0.5rem)',
                  backgroundColor: '#ef4444',
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
            onClick={onSignup}
            className="w-full bg-linear-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            style={{
              width: '100%',
              background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
              color: 'white',
              fontWeight: '600',
              padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)',
              borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              margin: '0',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)'
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <UserPlus className="w-5 h-5" />
            <span>Sign Up</span>
          </button>
          
          <button
            onClick={onLogin}
            className="w-full bg-white dark:bg-slate-700 border-2 border-red-500 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-600 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            style={{
              width: '100%',
              background: 'white',
              border: '2px solid #ef4444',
              color: '#ef4444',
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

        {/* Footer removed - authentication required */}
      </div>
    </div>
  )
}
