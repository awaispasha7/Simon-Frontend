'use client'

import { useState, useRef } from 'react'
import { Camera, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfilePictureUploadProps {
  currentImage?: string | null
  onImageChange: (imageUrl: string | null) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProfilePictureUpload({ 
  currentImage, 
  onImageChange, 
  size = 'md',
  className 
}: ProfilePictureUploadProps) {
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file)
      onImageChange(imageUrl)
    }
  }

  const handleRemoveImage = () => {
    onImageChange(null)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div 
      className={cn(
        "relative group cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Profile Picture Container */}
      <div 
        className={cn(
          "relative rounded-full bg-linear-to-br from-red-400 to-orange-500 flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer",
          sizeClasses[size],
          isHovered && "scale-110 shadow-2xl shadow-red-500/30 ring-4 ring-red-200/50"
        )}
        onClick={handleClick}
      >
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={currentImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn("text-white", iconSizes[size])} />
        )}

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
            <div className="flex flex-col items-center gap-1">
              <Camera className={cn("text-white drop-shadow-lg", iconSizes[size])} />
              <span className="text-xs text-white font-medium drop-shadow-lg">
                {currentImage ? 'Change' : 'Upload'}
              </span>
            </div>
          </div>
        )}

        {/* Remove button */}
        {currentImage && isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveImage()
            }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-200 cursor-pointer z-20 shadow-lg hover:shadow-xl"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
