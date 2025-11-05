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
      'flex w-full gap-4 animate-in slide-in-from-bottom-2 duration-300',
      isUser ? 'justify-end' : 'justify-start'
    )} style={{
      marginTop: '20px',
      marginBottom: '20px',
      paddingLeft: '24px',
      paddingRight: '24px'
    }}>
      {!isUser && (
        <div className={cn(
          "h-10 w-10 mt-1 shrink-0 rounded-lg flex items-center justify-center",
          resolvedTheme === 'light'
            ? "bg-gray-100 border border-gray-300"
            : "bg-zinc-950 border border-zinc-800"
        )} style={{ marginLeft: '8px' }}>
          <div className={cn(
            "text-xs font-bold rounded-lg w-full h-full flex items-center justify-center",
            resolvedTheme === 'light'
              ? "bg-gray-100 text-gray-700"
              : "bg-zinc-900 text-zinc-300"
          )}>
            <span className="text-lg">✨</span>
          </div>
        </div>
      )}
      <div className={cn(
        'max-w-[75%] rounded-2xl px-6 py-5 text-base leading-relaxed transform transition-all duration-200 relative group',
        'break-words', // Ensure proper text wrapping
        isUser
          ? resolvedTheme === 'light'
            ? 'bg-gray-100 text-gray-900 rounded-tr-none shadow-md border border-gray-300' // Same white background as assistant in light mode
            : 'bg-zinc-900 text-white rounded-tr-none shadow-lg border border-zinc-800'
          : resolvedTheme === 'light'
            ? 'bg-gray-100 text-gray-900 rounded-tl-none shadow-md border border-gray-300' // Changed to gray-100 for better contrast and readability
            : 'bg-black text-zinc-200 rounded-tl-none shadow-xl border border-zinc-900'
      )} style={{
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        hyphens: 'auto',
        minWidth: 0 // Ensure flex items can shrink below content size
      }}>
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
        
                <div className="whitespace-pre-wrap leading-relaxed break-words font-light" style={{ 
                  letterSpacing: '0.01em',
                  lineHeight: '1.7',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto',
                  maxWidth: '100%'
                }}>
                  {content}
                </div>
        
        {/* Action buttons for assistant messages */}
        {!isUser && showActionButtons && onLogin && (
          <div style={{ 
            marginLeft: '10px',
            marginRight: '10px'
          }}>
            <ChatActionButtons
              onLogin={onLogin}
              onNewStory={onNewStory}
              showNewStory={!!onNewStory}
            />
          </div>
        )}
        
        <div className={cn(
          'text-xs mt-3 opacity-50 font-mono tracking-wider',
          isUser ? 'text-zinc-400' : resolvedTheme === 'light' ? 'text-gray-400' : 'text-zinc-500'
        )}>
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
        <div className={cn(
          "h-10 w-10 mt-1 shrink-0 rounded-lg flex items-center justify-center",
          resolvedTheme === 'light'
            ? "bg-gray-100 border border-gray-300"
            : "bg-zinc-950 border border-zinc-800"
        )} style={{ marginRight: '8px' }}>
          <div className={cn(
            "text-xs font-bold rounded-lg w-full h-full flex items-center justify-center border",
            resolvedTheme === 'light'
              ? "bg-white text-gray-700 border-gray-300"
              : "bg-zinc-900 text-zinc-300 border-zinc-800"
          )}>
            {isHydrated && profile.userImage ? (
              <Image 
                src={profile.userImage} 
                alt="User" 
                width={32} 
                height={32}
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <span className={resolvedTheme === 'light' ? 'text-gray-600' : 'text-zinc-400'}>{isHydrated ? profile.userName.charAt(0).toUpperCase() : 'U'}</span>
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
