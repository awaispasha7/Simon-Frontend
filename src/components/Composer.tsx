'use client'

import { useState, useRef, useEffect } from 'react'
// import { Textarea } from '@/components/ui/textarea' // Removed - using custom styling
import { Send, Loader2, Mic, Globe } from 'lucide-react'
import { UploadDropzone } from './UploadDropzone'
import { AudioRecorder } from './AudioRecorder'
import { SimpleAttachmentPreview } from './SimpleAttachmentPreview'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
  extracted_text?: string // Optional: extracted text from documents (from upload endpoint)
}

interface ComposerProps {
  onSend: (message: string, attachedFiles?: AttachedFile[], enableWebSearch?: boolean) => void
  disabled?: boolean
  sessionId?: string
  projectId?: string
  editContent?: string
  isEditing?: boolean
  onEditComplete?: () => void
  editAttachedFiles?: AttachedFile[]
}

export function Composer({ onSend, disabled = false, sessionId, projectId, editContent, isEditing, onEditComplete, editAttachedFiles }: ComposerProps) {
  const [text, setText] = useState('')
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [enableWebSearch, setEnableWebSearch] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)

  // Check screen size for responsive placeholder and height
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 320)
      setIsLargeScreen(window.innerWidth >= 640) // sm breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Auto-focus textarea when component becomes enabled
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  // Handle edit content and attached files
  useEffect(() => {
    if (isEditing && editContent) {
      setText(editContent)
      // Set attached files if provided
      if (editAttachedFiles && editAttachedFiles.length > 0) {
        setAttachedFiles(editAttachedFiles)
      }
      // Focus the textarea after setting content
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isEditing, editContent, editAttachedFiles])

  // Auto-focus textarea when files are attached
  useEffect(() => {
    if (attachedFiles.length > 0 && textareaRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [attachedFiles.length])

  const handleSend = () => {
    // Allow sending if there's text OR attached files
    if ((!text.trim() && attachedFiles.length === 0) || disabled) return
    // Send with text (even if empty), attached files, and web search state
    onSend(text.trim() || '', attachedFiles.length > 0 ? attachedFiles : undefined, enableWebSearch)
    setText('')
    setAttachedFiles([])
    // Clear edit state when message is sent
    if (isEditing && onEditComplete) {
      onEditComplete()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAudioData = (audioBlob: Blob, transcript: string) => {
    console.log('🎤 [COMPOSER] handleAudioData called with transcript:', transcript.substring(0, 50) + '...')
    console.log('🎤 [COMPOSER] Current sessionId:', sessionId, 'projectId:', projectId)
    console.log('🎤 [COMPOSER] Attached files:', attachedFiles.length)
    setShowAudioRecorder(false)
    // Auto-send the transcribed text with any attached files
    // Send even if transcript is empty if there are files attached
    if (transcript.trim() || attachedFiles.length > 0) {
      console.log('🎤 [COMPOSER] Calling onSend with transcript and attached files - ensuring session context is maintained')
      // Add a small delay to ensure session state is stable
      setTimeout(() => {
        // Send transcript (or empty string) with attached files and web search state
        onSend(transcript.trim() || '', attachedFiles.length > 0 ? attachedFiles : undefined, enableWebSearch)
        setText('') // Clear the text area after sending
        setAttachedFiles([]) // Clear attached files after sending
      }, 100)
    }
  }

  // Handle file attachments
  const handleFileAttached = (file: AttachedFile) => {
    setAttachedFiles(prev => [...prev, file])
  }

  const handleRemoveFile = (assetId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.asset_id !== assetId))
  }

  // Auto-resize textarea - DISABLED to maintain fixed height
  // useEffect(() => {
  //   if (textareaRef.current) {
  //     textareaRef.current.style.height = 'auto'
  //     textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  //   }
  // }, [text])

  return (
    <div className="p-4 sm:p-5 md:p-6">
      {/* Attachment Preview - Above the composer */}
      {attachedFiles.length > 0 && (
        <div className="mb-3">
          <SimpleAttachmentPreview files={attachedFiles} onRemove={handleRemoveFile} />
        </div>
      )}
      
      <div className={`relative flex items-center rounded-none p-2 sm:p-3 md:p-4 border-t ${colors.border} ${colors.inputBackground} overflow-visible`}>
        <UploadDropzone sessionId={sessionId} projectId={projectId} onFileAttached={handleFileAttached} />
          <div className="relative">
            {!showAudioRecorder ? (
              // Initial state - just the mic button
              <button
                type="button"
                onClick={() => {
                  setShowAudioRecorder(true)
                }}
                disabled={disabled}
                className={cn(
                  "h-10 w-10 sm:h-[56px] sm:w-[56px] hover:scale-105 active:scale-95 transition-all duration-200 rounded-lg border flex items-center justify-center shrink-0",
                  resolvedTheme === 'light' 
                    ? "border-gray-200 bg-gray-50 hover:border-gray-300" 
                    : `${colors.buttonPrimary} border-zinc-800 hover:border-zinc-700`,
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  backgroundColor: resolvedTheme === 'light' ? '#f9fafb' : '#18181b', // gray-50 or zinc-900
                  borderColor: resolvedTheme === 'light' ? '#e5e7eb' : '#27272a', // gray-200 or zinc-800
                  width: isLargeScreen ? '56px' : '40px',
                  height: isLargeScreen ? '56px' : '40px',
                  minWidth: isLargeScreen ? '56px' : '40px',
                  minHeight: isLargeScreen ? '56px' : '40px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (resolvedTheme === 'dark') {
                    e.currentTarget.style.borderColor = '#3f3f46' // zinc-700
                    e.currentTarget.style.backgroundColor = '#27272a' // zinc-800
                  } else {
                    e.currentTarget.style.borderColor = '#d1d5db' // gray-300
                    e.currentTarget.style.backgroundColor = '#f3f4f6' // gray-100
                  }
                }}
                onMouseLeave={(e) => {
                  if (resolvedTheme === 'dark') {
                    e.currentTarget.style.borderColor = '#27272a' // zinc-800
                    e.currentTarget.style.backgroundColor = '#18181b' // zinc-900
                  } else {
                    e.currentTarget.style.borderColor = '#e5e7eb' // gray-200
                    e.currentTarget.style.backgroundColor = '#f9fafb' // gray-50
                  }
                }}
              >
                <Mic 
                  className="h-4 w-4 sm:h-5 sm:w-5 transition-colors"
                  style={{
                    color: resolvedTheme === 'light' ? '#4b5563' : '#a1a1aa', // gray-600 or zinc-400
                    strokeWidth: 2
                  }}
                />
              </button>
            ) : (
              // Recording state - show the full AudioRecorder inline
              <AudioRecorder
                onAudioData={handleAudioData}
                onClose={() => setShowAudioRecorder(false)}
                sessionId={sessionId}
                projectId={projectId}
              />
            )}
          </div>
          <div className="w-1"></div>
          {/* Globe icon toggle for web search */}
          <button
            type="button"
            onClick={() => setEnableWebSearch(!enableWebSearch)}
            disabled={disabled}
            className={cn(
              "h-10 w-10 sm:h-[56px] sm:w-[56px] hover:scale-105 active:scale-95 transition-all duration-200 rounded-lg border flex items-center justify-center shrink-0",
              enableWebSearch
                ? resolvedTheme === 'light'
                  ? "border-blue-300 bg-blue-50 hover:border-blue-400"
                  : "border-blue-600 bg-blue-900/30 hover:border-blue-500"
                : resolvedTheme === 'light'
                  ? "border-gray-200 bg-gray-50 hover:border-gray-300"
                  : `${colors.buttonPrimary} border-zinc-800 hover:border-zinc-700`,
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              backgroundColor: enableWebSearch
                ? resolvedTheme === 'light' ? '#eff6ff' : '#1e3a8a'
                : resolvedTheme === 'light' ? '#f9fafb' : '#18181b',
              borderColor: enableWebSearch
                ? resolvedTheme === 'light' ? '#93c5fd' : '#2563eb'
                : resolvedTheme === 'light' ? '#e5e7eb' : '#27272a',
              width: isLargeScreen ? '56px' : '40px',
              height: isLargeScreen ? '56px' : '40px',
              minWidth: isLargeScreen ? '56px' : '40px',
              minHeight: isLargeScreen ? '56px' : '40px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!enableWebSearch) {
                if (resolvedTheme === 'dark') {
                  e.currentTarget.style.borderColor = '#3f3f46'
                  e.currentTarget.style.backgroundColor = '#27272a'
                } else {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!enableWebSearch) {
                if (resolvedTheme === 'dark') {
                  e.currentTarget.style.borderColor = '#27272a'
                  e.currentTarget.style.backgroundColor = '#18181b'
                } else {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }
              }
            }}
            title={enableWebSearch ? "Disable web search" : "Enable web search"}
          >
            <Globe
              className="h-4 w-4 sm:h-5 sm:w-5 transition-colors"
              style={{
                color: enableWebSearch
                  ? resolvedTheme === 'light' ? '#2563eb' : '#60a5fa'
                  : resolvedTheme === 'light' ? '#4b5563' : '#a1a1aa',
                strokeWidth: 2
              }}
            />
          </button>
          <div className="w-1"></div>
            <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={() => textareaRef.current?.focus()}
            placeholder={isSmallScreen ? "Type your message…" : "Type your message…"}
            className={cn(
              `composer-textarea flex-1 min-w-0 resize-none border ${colors.inputBorder} ${colors.inputBackground} rounded-lg transition-all duration-200 text-sm sm:text-base ${colors.text} px-4 py-3`,
              resolvedTheme === 'light' 
                ? 'placeholder-gray-500' 
                : 'placeholder-zinc-600',
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              caretColor: resolvedTheme === 'dark' ? '#71717a' : '#6b7280',
              cursor: 'text',
              outline: 'none',
              textAlign: 'left',
              lineHeight: '1.6',
              height: isLargeScreen ? '56px' : '48px',
              minHeight: isLargeScreen ? '56px' : '48px',
              maxHeight: isLargeScreen ? '56px' : '48px',
              paddingTop: isLargeScreen ? '16px' : '14px',
              paddingBottom: isLargeScreen ? '16px' : '14px',
              boxSizing: 'border-box',
              overflow: 'hidden',
              resize: 'none',
              backgroundColor: resolvedTheme === 'dark' ? '#09090b' : undefined,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.01em'
            }}
            disabled={disabled}
          />
          
          {/* Cancel button - only show when editing */}
          {isEditing && (
            <button
              type="button"
              onClick={onEditComplete}
              className={cn(
                "rounded-full transition-all duration-300 shadow-xl flex items-center justify-center shrink-0 mr-2",
                "bg-gray-500 hover:bg-gray-600 hover:scale-110 active:scale-95 hover:shadow-2xl cursor-pointer shadow-gray-500/50"
              )}
              style={{ 
                width: isLargeScreen ? '56px' : '40px',
                height: isLargeScreen ? '56px' : '40px',
                borderRadius: '30%',
                boxShadow: '0 4px 14px 0 rgba(107, 114, 128, 0.3)',
                border: 'none',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                boxSizing: 'border-box',
              }}
              title="Cancel edit"
            >
              <svg 
                className="h-4 w-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            type="button"
            onClick={handleSend}
            disabled={(!text.trim() && attachedFiles.length === 0) || disabled}
              className={cn(
                "rounded-full transition-all duration-300 shadow-xl flex items-center justify-center shrink-0 relative",
                (!text.trim() && attachedFiles.length === 0) || disabled
                  ? resolvedTheme === 'light' 
                    ? "bg-white cursor-not-allowed shadow-sky-200/50"
                    : "bg-[rgb(83,93,108)] cursor-not-allowed shadow-slate-500/50"
                  : "bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 hover:scale-110 active:scale-95 hover:shadow-2xl cursor-pointer shadow-blue-500/50"
              )}
              style={{ 
                width: isLargeScreen ? '56px' : '40px',
                height: isLargeScreen ? '56px' : '40px',
                border: 'none',
                borderRadius: '30%',
                boxShadow: (!text.trim() && attachedFiles.length === 0) || disabled 
                  ? resolvedTheme === 'light'
                    ? '0 2px 8px 0 rgba(0, 0, 0, 0.1)'
                    : '0 2px 8px 0 rgba(0, 0, 0, 0.3)'
                  : '0 4px 14px 0 rgba(59, 130, 246, 0.3)'
              }}
          >
            {disabled ? (
              <Loader2 className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 animate-spin drop-shadow-xl",
                resolvedTheme === 'light' ? "text-sky-500" : "text-slate-400"
              )} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: '0',
                padding: '0'
              }} />
            ) : !text.trim() ? (
              <Send className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 drop-shadow-xl",
                resolvedTheme === 'light' ? "text-sky-500" : "text-slate-400"
              )} />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-xl" />
            )}
          </button>
        </div>
    </div>
  )
}
