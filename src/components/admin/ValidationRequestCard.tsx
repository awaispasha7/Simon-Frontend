'use client'

import { useTheme, getThemeColors } from '@/lib/theme-context'
import { formatDistanceToNow } from 'date-fns'

interface ValidationRequest {
  validation_id: string
  project_id: string
  user_id: string
  session_id: string
  conversation_transcript: string
  generated_script: string
  client_email: string | null
  client_name: string | null
  status: 'pending' | 'approved' | 'rejected' | 'sent_to_client'
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  updated_at: string
}

interface Props {
  request: ValidationRequest
  onSelect: () => void
  isSelected: boolean
}

const statusColors = {
  pending: 'bg-yellow-100! dark:bg-yellow-900/30! text-yellow-800! dark:text-yellow-300! border-yellow-300! dark:border-yellow-700!',
  approved: 'bg-green-100! dark:bg-green-900/30! text-green-800! dark:text-green-300! border-green-300! dark:border-green-700!',
  rejected: 'bg-red-100! dark:bg-red-900/30! text-red-800! dark:text-red-300! border-red-300! dark:border-red-700!',
  sent_to_client: 'bg-purple-100! dark:bg-purple-900/30! text-purple-800! dark:text-purple-300! border-purple-300! dark:border-purple-700!',
  // Legacy support for existing records
  in_review: 'bg-yellow-100! dark:bg-yellow-900/30! text-yellow-800! dark:text-yellow-300! border-yellow-300! dark:border-yellow-700!'
}

export default function ValidationRequestCard({ request, onSelect, isSelected }: Props) {
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)

  const getStatusDisplay = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  return (
    <div
      onClick={onSelect}
      className={`
        p-6! rounded-xl! border-2! cursor-pointer! transition-all! duration-300! shadow-md! hover:shadow-xl!
        ${isSelected 
          ? `border-blue-500! dark:border-blue-400! shadow-xl! ${colors.sidebarBackground} ring-2! ring-blue-500/50!` 
          : `${colors.border} hover:border-blue-300! dark:hover:border-blue-700! ${colors.background}`
        }
      `}
    >
      <div className="flex! justify-between! items-start! mb-4!">
        <div className="flex-1!">
          <div className="flex! items-center! space-x-3! mb-3!">
            <h3 className={`font-bold! text-lg! ${colors.text}`}>
              {request.client_name || 'Anonymous User'}
            </h3>
            <span 
              className={`
                px-3! py-1! text-xs! font-bold! rounded-full! border-2!
                ${statusColors[request.status]}
              `}
            >
              {getStatusDisplay(request.status)}
            </span>
          </div>
          
          <div className={`text-sm! ${colors.textSecondary} space-y-1! font-medium!`}>
            <p>📧 Email: {request.client_email || 'N/A'}</p>
            <p>🕐 Created: {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</p>
            {request.reviewed_at && (
              <p>✅ Reviewed: {formatDistanceToNow(new Date(request.reviewed_at), { addSuffix: true })}</p>
            )}
          </div>
        </div>

        <div className="ml-4!">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className={`
              px-4! py-2! text-sm! rounded-lg! border-2! transition-all! font-semibold! shadow-md! hover:shadow-lg!
              ${colors.border} ${colors.textSecondary} hover:${colors.text} hover:border-blue-500! hover:bg-blue-500/10!
            `}
          >
            View Details
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="space-y-4!">
        <div className="p-3! rounded-lg! bg-gray-50! dark:bg-gray-900/50!">
          <h4 className={`text-sm! font-bold! ${colors.text} mb-2!`}>💬 Conversation Preview</h4>
          <p className={`text-sm! ${colors.textSecondary} leading-relaxed!`}>
            {truncateText(request.conversation_transcript.replace(/[#*]/g, ''), 150)}
          </p>
        </div>

        <div className="p-3! rounded-lg! bg-gray-50! dark:bg-gray-900/50!">
          <h4 className={`text-sm! font-bold! ${colors.text} mb-2!`}>📝 Script Preview</h4>
          <p className={`text-sm! ${colors.textSecondary} leading-relaxed!`}>
            {truncateText(request.generated_script, 120)}
          </p>
        </div>

        {request.review_notes && (
          <div className="p-3! rounded-lg! bg-yellow-50! dark:bg-yellow-900/20! border! border-yellow-200! dark:border-yellow-800!">
            <h4 className={`text-sm! font-bold! text-yellow-800! dark:text-yellow-300! mb-2!`}>📋 Review Notes</h4>
            <p className={`text-sm! text-yellow-700! dark:text-yellow-400! leading-relaxed!`}>
              {truncateText(request.review_notes, 100)}
            </p>
          </div>
        )}
      </div>

      <div className={`mt-5! pt-4! border-t-2! ${colors.border} flex! justify-between! items-center! text-xs! font-mono! ${colors.textSecondary}`}>
        <span>🔑 ID: {request.validation_id.slice(0, 8)}...</span>
        <span>📁 Project: {request.project_id.slice(0, 8)}...</span>
      </div>
    </div>
  )
}
