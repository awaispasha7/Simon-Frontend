'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
// Using regular img tags for Supabase images to avoid Next.js optimization timeout
import { X, FileImage, FileText, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
}

interface SimpleAttachmentPreviewProps {
  files: AttachedFile[]
  onRemove: (assetId: string) => void
  variant?: 'composer' | 'chat'
  backgroundColor?: string
  borderRadius?: string
}

export function SimpleAttachmentPreview({ files, onRemove, variant = 'composer', backgroundColor, borderRadius }: SimpleAttachmentPreviewProps) {
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null)
  const [textPreviewContent, setTextPreviewContent] = useState<string | null>(null)
  const [isLoadingTextContent, setIsLoadingTextContent] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (files.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <FileImage className="h-4 w-4" />
    if (type.includes('text') || type.includes('document')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const fetchTextContent = async (url: string) => {
    setIsLoadingTextContent(true)
    try {
      const response = await fetch(url)
      const text = await response.text()
      setTextPreviewContent(text)
    } catch (error) {
      console.error('Failed to fetch text content:', error)
      setTextPreviewContent('Failed to load content')
    } finally {
      setIsLoadingTextContent(false)
    }
  }

  const handleFileClick = (file: AttachedFile) => {
    setPreviewFile(file)
    setTextPreviewContent(null) // Reset text content
    
    // Set loading state for images
    if (file.type.includes('image')) {
      setIsLoadingImage(true)
      setImageLoadError(false)
      console.log('🖼️ Loading image:', file.url)
      
      // Remove aggressive timeout - let browser handle loading naturally
      // Signed URLs might take a moment to load, especially on first access
    }
    
    // If it's a text file, fetch the content
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      fetchTextContent(file.url)
    }
  }

  return (
    <>
      {/* Boxy Attachment Preview Container */}
      <div 
        className={cn(
          "mb-0 p-4 border border-gray-200 dark:border-slate-600 border-b-0 shadow-sm",
          variant === 'composer' 
            ? "rounded-t-lg rounded-b-none bg-gray-50" 
            : "rounded-lg bg-transparent"
        )}
        style={{ 
          backgroundColor: backgroundColor || (variant === 'composer' 
            ? (resolvedTheme === 'dark' ? 'rgb(83, 93, 108)' : undefined)
            : 'transparent'
          ),
          borderRadius: borderRadius
        }}
      >
        <div className="flex flex-wrap">
          {files.map((file) => (
            <div
              key={file.asset_id}
              className="group relative"
              style={{ margin: '0.5rem 0 0.5rem 0.5rem' }}
            >
              <div
                title="Click to preview file"
                className="relative flex items-center space-x-1 px-6 py-2 rounded-lg bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shadow-sm min-w-[200px] min-h-[100px] "
                  style={{ padding: '1rem 2rem' }}
                onClick={() => handleFileClick(file)}
              >
                <div className="shrink-0 text-gray-500 dark:text-gray-300">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                {/* X button inside the card - only show in composer, not in chat */}
                {variant !== 'chat' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(file.asset_id)
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 shadow-lg"
                    title="Remove file"
                  >
                    <X className="h-3 w-3 hover:scale-110 transition-all duration-200 hover:text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ChatGPT-style Simple Preview - Click outside to close */}
      {mounted && previewFile && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999
          }}
          onClick={() => {
            setPreviewFile(null)
            setIsLoadingImage(false)
            setIsLoadingTextContent(false)
            setImageLoadError(false)
          }}
        >
          <div 
            className="min-w-[600px] min-h-[400px] max-w-[95vw] max-h-[95vh] bg-white dark:bg-slate-800 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {previewFile.type.includes('image') ? (
              <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-slate-700">
                {/* Image Header with File Info */}
                <div className="shrink-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-4 flex items-center justify-between border-b border-gray-200 dark:border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-500 dark:text-gray-400">
                      {getFileIcon(previewFile.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {previewFile.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(previewFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewFile(null)
                      setIsLoadingImage(false)
                      setIsLoadingTextContent(false)
                      setImageLoadError(false)
                    }}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    title="Close preview"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Image Content Area - Takes remaining space */}
                <div className="flex-1 flex items-center justify-center p-4 relative">
                  {/* Always render the image so it can load */}
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className={`max-w-full max-h-full object-contain rounded-lg shadow-lg transition-opacity duration-300 ${
                      isLoadingImage ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', previewFile.url)
                      setIsLoadingImage(false)
                      setImageLoadError(false)
                    }}
                    onError={(e) => {
                      console.error('❌ Image load error:', e)
                      console.error('❌ Image URL:', previewFile.url)
                      setIsLoadingImage(false)
                      setImageLoadError(true)
                    }}
                  />
                  
                  {/* Loading overlay */}
                  {isLoadingImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-50/90 dark:bg-slate-700/90">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Loading image...</p>
                    </div>
                  )}
                  
                  {/* Error overlay */}
                  {imageLoadError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-50/90 dark:bg-slate-700/90">
                      <div className="text-red-500 text-4xl">⚠️</div>
                      <p className="text-red-500 dark:text-red-400 text-sm">Failed to load image</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">The image may be corrupted or the URL is invalid</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-500 dark:text-gray-400">
                      {getFileIcon(previewFile.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {previewFile.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(previewFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPreviewFile(null)
                      setIsLoadingImage(false)
                      setIsLoadingTextContent(false)
                      setImageLoadError(false)
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6 min-h-[300px] max-h-[80vh] overflow-auto">
                  {(previewFile.type === 'text/plain' || previewFile.name.endsWith('.txt')) ? (
                    // Text file content with proper theme styling
                    <div className="w-full">
                      {isLoadingTextContent ? (
                        <div className="flex items-center justify-center h-[400px]">
                          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono leading-relaxed">
                          {textPreviewContent || 'No content available'}
                        </pre>
                      )}
                    </div>
                  ) : (
                    // Other files (PDFs, etc.) use iframe
                    <iframe
                      src={previewFile.url}
                      className="w-full h-full min-h-[400px] border-0"
                      title={previewFile.name}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
