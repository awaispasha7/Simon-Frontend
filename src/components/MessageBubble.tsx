import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
// import { Avatar, AvatarFallback } from '@/components/ui/avatar' // Removed - using custom styling
import { useProfile } from '@/lib/profile-context'
import { useTheme } from '@/lib/theme-context'
import { ProfileSettings } from './ProfileSettings'
import { ChatActionButtons } from './ChatActionButtons'
import { SimpleAttachmentPreview } from './SimpleAttachmentPreview'
// import { Edit3 } from 'lucide-react' // Replaced with custom SVG
import Image from 'next/image'

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
}

export type BubbleProps = { 
  role: 'user'|'assistant'
  content: string
  showActionButtons?: boolean
  onSignup?: () => void
  onLogin?: () => void
  onNewStory?: () => void
  attachedFiles?: AttachedFile[]
  onEdit?: (messageId: string, newContent: string, attachedFiles?: AttachedFile[]) => void
  messageId?: string
}

export function MessageBubble({ 
  role, 
  content, 
  showActionButtons = false,
  onSignup,
  onLogin,
  onNewStory,
  attachedFiles,
  onEdit,
  messageId
}: BubbleProps) {
  const isUser = role === 'user'
  const { profile, isHydrated } = useProfile()
  const { resolvedTheme } = useTheme()
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [timestamp, setTimestamp] = useState('')
  
  useEffect(() => {
    setTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  }, [])
  return (
    <div className={cn(
      'flex w-full gap-3 animate-in slide-in-from-bottom-2 duration-300',
      isUser ? 'justify-end' : 'justify-start'
    )} style={{
      marginTop: '16px',
      marginBottom: '16px'
    }}>
      {!isUser && (
        <div className="h-9 w-9 mt-1 shrink-0 ring-2 ring-green-200 rounded-full flex items-center justify-center" style={{ marginLeft: '16px', marginTop: '16px' }}>
          <div className="bg-linear-to-br from-green-200 to-green-300 text-green-800 text-xs font-bold shadow-sm rounded-full w-full h-full flex items-center justify-center">
            <Image 
              src="/swt-logo.svg" 
              alt="AI Assistant" 
              width={36} 
              height={36}
              className="w-9 h-9"
            />
          </div>
        </div>
      )}
      <div className={cn(
        'max-w-[70%] rounded-xl px-8 py-6 text-sm leading-relaxed transform transition-all duration-200 hover:scale-[1.02] relative group',
        isUser
          ? 'bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-br-lg shadow-2xl shadow-blue-500/40 border-2 border-blue-400/40'
          : resolvedTheme === 'light'
            ? 'bg-linear-to-br from-gray-100 via-gray-50 to-white text-gray-900 backdrop-blur-sm border-2 border-gray-200 rounded-bl-lg shadow-2xl shadow-gray-300/30'
            : 'bg-linear-to-br from-slate-800 via-slate-700 to-slate-600 text-slate-100 backdrop-blur-sm border-2 border-slate-500/70 rounded-bl-lg shadow-2xl shadow-slate-400/30'
      )}>
        {/* Attached Files Display - Above message content */}
        {attachedFiles && attachedFiles.length > 0 && (
          <div className="mb-3 ml-2 mr-2">
            <SimpleAttachmentPreview 
              files={attachedFiles} 
              onRemove={() => {}} // No remove functionality in chat messages
              variant="chat"
              backgroundColor="transparent"
              borderRadius="12px"
            />
          </div>
        )}
        
        <div className="whitespace-pre-wrap leading-relaxed wrap-break-words" style={{ 
          marginLeft: '10px',
          marginRight: isUser ? '10px' : '10px'
        }}>
          {content}
        </div>
        
        {/* Action buttons for assistant messages */}
        {!isUser && showActionButtons && onSignup && onLogin && (
          <div style={{ 
            marginLeft: '10px',
            marginRight: '10px'
          }}>
            <ChatActionButtons
              onSignup={onSignup}
              onLogin={onLogin}
              onNewStory={onNewStory}
              showNewStory={!!onNewStory}
            />
          </div>
        )}
        
        <div className={cn(
          'text-xs mt-2 opacity-70 ',
          isUser ? 'text-white/70' : resolvedTheme === 'light' ? 'text-gray-500' : 'text-slate-300'
        )} style={{ 
          marginLeft: '10px',
          marginRight: isUser ? '10px' : '10px'
        }}>
          {timestamp}
        </div>
        
        {/* Edit button - pops out of bubble corner */}
        {isUser && onEdit && messageId && (
          <button
            onClick={() => onEdit(messageId, content, attachedFiles)}
            className="absolute -top-2 -right-2 p-1.5 bg-white hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 z-10"
            title="Edit message"
          >
            <svg 
              className="h-3 w-3" 
              fill="#000000" 
              viewBox="0 0 494.936 494.936"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M389.844,182.85c-6.743,0-12.21,5.467-12.21,12.21v222.968c0,23.562-19.174,42.735-42.736,42.735H67.157
                c-23.562,0-42.736-19.174-42.736-42.735V150.285c0-23.562,19.174-42.735,42.736-42.735h267.741c6.743,0,12.21-5.467,12.21-12.21
                s-5.467-12.21-12.21-12.21H67.157C30.126,83.13,0,113.255,0,150.285v267.743c0,37.029,30.126,67.155,67.157,67.155h267.741
                c37.03,0,67.156-30.126,67.156-67.155V195.061C402.054,188.318,396.587,182.85,389.844,182.85z"/>
              <path d="M483.876,20.791c-14.72-14.72-38.669-14.714-53.377,0L221.352,229.944c-0.28,0.28-3.434,3.559-4.251,5.396l-28.963,65.069
                c-2.057,4.619-1.056,10.027,2.521,13.6c2.337,2.336,5.461,3.576,8.639,3.576c1.675,0,3.362-0.346,4.96-1.057l65.07-28.963
                c1.83-0.815,5.114-3.97,5.396-4.25L483.876,74.169c7.131-7.131,11.06-16.61,11.06-26.692
                C494.936,37.396,491.007,27.915,483.876,20.791z M466.61,56.897L257.457,266.05c-0.035,0.036-0.055,0.078-0.089,0.107
                l-33.989,15.131L238.51,247.3c0.03-0.036,0.071-0.055,0.107-0.09L447.765,38.058c5.038-5.039,13.819-5.033,18.846,0.005
                c2.518,2.51,3.905,5.855,3.905,9.414C470.516,51.036,469.127,54.38,466.61,56.897z"/>
            </svg>
          </button>
        )}
      </div>
      {isUser && (
        <div className="h-9 w-9 mt-1 shrink-0 ring-2 ring-blue-200 rounded-full flex items-center justify-center" style={{ marginRight: '16px' }}>
          <div className="bg-linear-to-br from-blue-200 to-blue-300 text-blue-800 text-xs font-bold shadow-sm rounded-full w-full h-full flex items-center justify-center">
            {isHydrated && profile.userImage ? (
              <Image 
                src={profile.userImage} 
                alt="User Profile" 
                width={24} 
                height={24}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              isHydrated ? profile.userName.charAt(0).toUpperCase() : 'U'
            )}
          </div>
        </div>
      )}
      
      {/* Profile Settings Modal */}
      <ProfileSettings 
        isOpen={showProfileSettings} 
        onClose={() => setShowProfileSettings(false)} 
      />
    </div>
  )
}
