'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Plus } from 'lucide-react'
import { projectApi } from '@/lib/api'
import { useTheme, getThemeColors } from '@/lib/theme-context'

interface ProjectCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (projectId: string, projectName: string) => void | Promise<void>
  isRequired?: boolean // If true, user cannot close without creating a project
}

export function ProjectCreationModal({
  isOpen,
  onClose,
  onProjectCreated,
  isRequired = false
}: ProjectCreationModalProps) {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setProjectName('')
      setDescription('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim()) {
      setError('Project name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await projectApi.createProject(projectName.trim(), description.trim() || undefined)
      
      console.log('✅ Project created:', result)
      
      // Call callback with project info - await it since it's async
      try {
        console.log('📞 [MODAL] Calling onProjectCreated callback...')
        await onProjectCreated(result.project_id, result.name)
        console.log('✅ [MODAL] onProjectCreated callback completed')
      } catch (error) {
        console.error('❌ [MODAL] Error in onProjectCreated callback:', error)
        // Still reset form even if callback fails
      }
      
      // Reset form
      setProjectName('')
      setDescription('')
      
      // Close modal (only if not required)
      if (!isRequired) {
        onClose()
      }
    } catch (err) {
      console.error('❌ Failed to create project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    // Always allow closing - user can navigate freely
    // Modal will reappear if they try to send a message without a project
    onClose()
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
        zIndex: '9999',
        padding: 'clamp(0.5rem, 2vw, 1rem)',
        margin: '0',
        boxSizing: 'border-box',
        width: '100vw',
        height: '100vh'
      }}
      onClick={handleClose}
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
          flexShrink: '0',
          backgroundColor: resolvedTheme === 'dark' ? 'rgb(30, 41, 59)' : 'rgb(255, 255, 255)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - only show if not required */}
        {!isRequired && (
          <button
            onClick={handleClose}
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
              transition: 'background-color 0.2s ease',
              color: resolvedTheme === 'dark' ? 'rgb(203, 213, 225)' : 'rgb(55, 65, 81)'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

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
            className="w-16 h-16 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              padding: '0'
            }}
          >
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h2 
            className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
            style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.5rem)',
              fontWeight: '700',
              marginBottom: '0.5rem',
              marginTop: '0',
              padding: '0',
              lineHeight: '1.2',
              color: resolvedTheme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)'
            }}
          >
            {isRequired ? 'Create Your First Story' : 'Create New Story'}
          </h2>
          <p 
            className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
            style={{
              fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
              lineHeight: '1.5',
              color: resolvedTheme === 'dark' ? 'rgb(203, 213, 225)' : 'rgb(75, 85, 99)',
              padding: '0'
            }}
          >
            {isRequired 
              ? 'Every story needs a project. Give your story a name to get started!'
              : 'Create a new project to organize your story sessions. You can have multiple conversations within each project.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label 
              htmlFor="project-name"
              className="block text-sm font-medium mb-2"
              style={{
                color: resolvedTheme === 'dark' ? 'rgb(203, 213, 225)' : 'rgb(55, 65, 81)',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Story Name <span style={{ color: 'rgb(239, 68, 68)' }}>*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value)
                setError(null)
              }}
              placeholder="e.g., Romantic Novel, Horror Story..."
              required
              disabled={isCreating}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderWidth: '1px',
                borderRadius: '0.5rem',
                borderColor: error 
                  ? 'rgb(239, 68, 68)' 
                  : resolvedTheme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(209, 213, 219)',
                backgroundColor: resolvedTheme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)',
                color: resolvedTheme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                opacity: isCreating ? 0.6 : 1,
                cursor: isCreating ? 'not-allowed' : 'text'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgb(59, 130, 246)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error 
                  ? 'rgb(239, 68, 68)' 
                  : resolvedTheme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(209, 213, 219)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label 
              htmlFor="project-description"
              className="block text-sm font-medium mb-2"
              style={{
                color: resolvedTheme === 'dark' ? 'rgb(203, 213, 225)' : 'rgb(55, 65, 81)',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Description (Optional)
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your story..."
              rows={3}
              disabled={isCreating}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderWidth: '1px',
                borderRadius: '0.5rem',
                borderColor: resolvedTheme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(209, 213, 219)',
                backgroundColor: resolvedTheme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(255, 255, 255)',
                color: resolvedTheme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(17, 24, 39)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'all 0.2s ease',
                opacity: isCreating ? 0.6 : 1,
                cursor: isCreating ? 'not-allowed' : 'text',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgb(59, 130, 246)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = resolvedTheme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(209, 213, 219)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: resolvedTheme === 'dark' ? 'rgba(127, 29, 29, 0.2)' : 'rgb(254, 242, 242)',
                borderWidth: '1px',
                borderColor: resolvedTheme === 'dark' ? 'rgb(127, 29, 29)' : 'rgb(254, 226, 226)',
                borderRadius: '0.5rem',
                color: resolvedTheme === 'dark' ? 'rgb(252, 165, 165)' : 'rgb(185, 28, 28)'
              }}
            >
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {!isRequired && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1 px-4 py-3 border rounded-lg font-medium transition-colors"
                style={{
                  padding: '0.75rem 1rem',
                  borderWidth: '1px',
                  borderRadius: '0.5rem',
                  borderColor: resolvedTheme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(209, 213, 219)',
                  backgroundColor: 'transparent',
                  color: resolvedTheme === 'dark' ? 'rgb(203, 213, 225)' : 'rgb(55, 65, 81)',
                  fontWeight: '500',
                  fontSize: '0.9375rem',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  opacity: isCreating ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCreating) {
                    e.currentTarget.style.backgroundColor = resolvedTheme === 'dark' ? 'rgb(51, 65, 85)' : 'rgb(249, 250, 251)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isCreating || !projectName.trim()}
              className="flex-1 px-4 py-3 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: 'rgb(255, 255, 255)',
                borderRadius: '0.5rem',
                fontWeight: '500',
                fontSize: '0.9375rem',
                cursor: (isCreating || !projectName.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isCreating || !projectName.trim()) ? 0.5 : 1,
                transition: 'all 0.2s ease',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isCreating && projectName.trim()) {
                  e.currentTarget.style.opacity = '0.9'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = (isCreating || !projectName.trim()) ? '0.5' : '1'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isCreating ? 'Creating...' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

