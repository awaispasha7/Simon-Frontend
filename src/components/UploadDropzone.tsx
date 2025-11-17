'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { Paperclip, CheckCircle, XCircle, Loader2 } from 'lucide-react'
// import { Button } from '@/components/ui/button' // Removed - using custom styling
import { useTheme } from '@/lib/theme-context'
import { useSession } from '@/hooks/useSession'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface UploadedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
}

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
}

interface UploadDropzoneProps {
  sessionId?: string
  onFileAttached?: (file: AttachedFile) => void
}

export function UploadDropzone({ sessionId: propSessionId, onFileAttached }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Prevent hydration mismatch by only rendering client-side state after mount
  useEffect(() => {
    setIsClient(true)
  }, [])
  const { resolvedTheme } = useTheme()
  const { sessionId, isLoading: sessionLoading } = useSession(propSessionId)
  const { user } = useAuth()
  

  // Check screen size for responsive height
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 350)
      setIsLargeScreen(window.innerWidth >= 640) // sm breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    console.log('📤 [UPLOAD] Starting upload with:', {
      sessionId,
      sessionLoading,
      user: user?.user_id,
      propSessionId
    })

    // Wait for session to be ready, but allow uploads if we have a user (authenticated)
    if (sessionLoading) {
      console.log('📤 [UPLOAD] Session still loading, blocking upload')
      setError('Please wait for session to be ready before uploading files.')
      return
    }

    // For authenticated users, we can upload even without a session (it will be created)
    if (!user && !sessionId) {
      console.log('📤 [UPLOAD] No user and no session, blocking upload')
      setError('Please wait for session to be ready before uploading files.')
      return
    }

    console.log('📤 [UPLOAD] Upload allowed, proceeding...')

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      // Add all files to FormData
      Array.from(files).forEach(file => {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Max size is 10MB.`)
        }
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...(sessionId && { 'X-Session-ID': sessionId }),
          ...(user?.user_id && { 'X-User-ID': user.user_id }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      // If onFileAttached callback is provided, call it for each uploaded file
      if (onFileAttached) {
        data.files.forEach((file: UploadedFile) => {
          const attachedFile = {
            name: file.name,
            size: file.size,
            url: file.url,
            type: file.type,
            asset_id: file.asset_id
          }
          onFileAttached(attachedFile)
        })
      } else {
        // Fallback to old behavior if no callback provided
        setUploadedFiles(prev => [...prev, ...data.files])
      }
    } catch (err) {
      console.error('❌ Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [sessionId, sessionLoading, user, onFileAttached])


  const onFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(event.target.files)
  }, [handleFileUpload])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    handleFileUpload(event.dataTransfer.files)
  }, [handleFileUpload])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  return (
  <div className="flex items-center gap-2">
    <input
      ref={fileInputRef}
      type="file"
      multiple
      accept="image/*,.pdf,.doc,.docx,.txt,.mp4,.mov,.avi"
      onChange={onFileChange}
      className="hidden"
      id="file-upload"
      disabled={uploading}
    />
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <button
        className={cn(
          "h-10 w-10 sm:h-[56px] sm:w-[56px] hover:scale-105 active:scale-95 transition-all duration-200 rounded-lg sm:rounded-xl border-2 border-dashed shadow-sm hover:shadow-md flex items-center justify-center backdrop-blur-sm",
          // Use consistent classes to prevent hydration mismatch
          isClient ? (
            (sessionLoading || (!user && !sessionId)) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          ) : "opacity-50 cursor-not-allowed", // Default server state
          isClient ? (
            isDragging 
              ? "border-red-500 bg-red-50/80 dark:bg-red-900/20" 
              : resolvedTheme === 'light'
                ? "border-gray-300 bg-white/50 hover:border-red-400 hover:bg-white/80"
                : "border-slate-500 bg-slate-700/50 hover:border-red-400 hover:bg-slate-600/80"
          ) : "border-gray-300 bg-white/50", // Default server state
          isClient && uploading && "opacity-50 cursor-not-allowed"
        )}
        style={{
          width: isLargeScreen ? '56px' : isSmallScreen ? '32px' : '40px',
          height: isLargeScreen ? '56px' : isSmallScreen ? '32px' : '40px',
        }}
        onClick={() => {
          if (!uploading && !sessionLoading && (user || sessionId)) {
            if (fileInputRef.current) {
              fileInputRef.current.click()
            }
          }
        }}
        disabled={!isClient || Boolean(uploading || sessionLoading || (!user && !sessionId))}
      >
        {uploading ? (
          <Loader2 className={cn(
            "text-red-600 dark:text-red-400 animate-spin",
            isSmallScreen ? "h-3 w-3" : "h-4 w-4 sm:h-5 sm:w-5"
          )} />
        ) : (
          <Paperclip className={cn(
            "transition-colors",
            isSmallScreen ? "h-3 w-3" : "h-4 w-4 sm:h-5 sm:w-5",
            resolvedTheme === 'light'
              ? "text-gray-600 hover:text-red-600"
              : "text-slate-300 hover:text-red-400"
          )} />
        )}
      </button>
    </div>

    {/* Upload status indicators */}
    {error && (
      <div className="flex items-center gap-1 text-red-500 text-xs">
        <XCircle className="h-3 w-3" />
        <span>{error}</span>
      </div>
    )}
    
    {uploadedFiles.length > 0 && !error && (
      <div className="flex items-center gap-1 text-green-600 text-xs">
        <CheckCircle className="h-3 w-3" />
        <span>{uploadedFiles.length} file(s) uploaded</span>
      </div>
    )}
  </div>
)
}
