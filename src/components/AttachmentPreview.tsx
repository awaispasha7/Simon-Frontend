import { useState } from 'react'
import Image from 'next/image'
import { X, Eye, Download, FileImage, FileText, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme, getThemeColors } from '@/lib/theme-context'

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
}

interface AttachmentPreviewProps {
  files: AttachedFile[]
  onRemove: (assetId: string) => void
}

export function AttachmentPreview({ files, onRemove }: AttachmentPreviewProps) {
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null)
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)

  console.log('📎 [PREVIEW] Rendering AttachmentPreview with files:', files)
  
  if (files.length === 0) {
    console.log('📎 [PREVIEW] No files to display, returning null')
    return null
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-4 w-4 text-green-500" />
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handlePreview = (file: AttachedFile) => {
    if (file.type === 'image') {
      setPreviewFile(file)
    } else {
      // For documents, open in new tab
      window.open(file.url, '_blank')
    }
  }

  const handleDownload = (file: AttachedFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      {/* Attachment Preview Container */}
      <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
        <div className={cn(
          "bg-white dark:bg-slate-800 rounded-xl shadow-lg border p-3 mx-2",
          "backdrop-blur-sm bg-white/95 dark:bg-slate-800/95",
          colors.cardBorder
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attached ({files.length})
            </span>
            <div className="flex items-center gap-1">
              {files.length > 1 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {files.length} files
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.asset_id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
                  "hover:bg-gray-50 dark:hover:bg-slate-700/50",
                  "border border-gray-200 dark:border-slate-600"
                )}
              >
                {/* File Icon */}
                <div className="shrink-0">
                  {getFileIcon(file.type)}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(file)}
                    className={cn(
                      "p-1.5 rounded-full transition-all duration-200",
                      "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                      "text-blue-600 dark:text-blue-400",
                      "hover:scale-110 active:scale-95"
                    )}
                    title={file.type === 'image' ? 'Preview image' : 'Open document'}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  
                  <button
                    onClick={() => handleDownload(file)}
                    className={cn(
                      "p-1.5 rounded-full transition-all duration-200",
                      "hover:bg-green-100 dark:hover:bg-green-900/30",
                      "text-green-600 dark:text-green-400",
                      "hover:scale-110 active:scale-95"
                    )}
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  
                  <button
                    onClick={() => onRemove(file.asset_id)}
                    className={cn(
                      "p-1.5 rounded-full transition-all duration-200",
                      "hover:bg-red-100 dark:hover:bg-red-900/30",
                      "text-red-600 dark:text-red-400",
                      "hover:scale-110 active:scale-95"
                    )}
                    title="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewFile && previewFile.type === 'image' && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  "hover:bg-gray-100 dark:hover:bg-slate-700",
                  "text-gray-500 dark:text-gray-400"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <Image
                src={previewFile.url}
                alt={previewFile.name}
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-slate-600">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(previewFile.size)}
              </div>
              <button
                onClick={() => handleDownload(previewFile)}
                className={cn(
                  "px-4 py-2 rounded-lg transition-all duration-200",
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  "hover:scale-105 active:scale-95"
                )}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
