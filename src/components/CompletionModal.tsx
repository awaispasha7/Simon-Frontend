"use client"

import { useEffect } from 'react'

interface CompletionModalProps {
  open: boolean
  title?: string
  onClose: () => void
  onNewStory: () => void
  onViewDossier?: () => void
}

export function CompletionModal({ open, title, onClose, onNewStory, onViewDossier }: CompletionModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed! inset-0! z-2000! flex! items-center! justify-center! bg-black/60! backdrop-blur-sm!"
      onClick={onClose}
    >
      <div
        className="w-[90vw]! max-w-md! bg-white! dark:bg-gray-800! rounded-2xl! shadow-2xl! border! border-gray-200! dark:border-gray-700! p-6!"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}
      >
        <div className="flex! items-center! gap-3! mb-3!">
          <div
            className="w-10! h-10! rounded-full! text-white! flex! items-center! justify-center! font-bold!"
            style={{ background: 'linear-gradient(135deg, #34d399, #3b82f6)' }}
          >
            SW
          </div>
          <h3 className="text-lg! font-semibold! text-gray-900! dark:text-gray-100!">Story Completed</h3>
        </div>
        <p className="text-sm! leading-6! text-gray-600! dark:text-gray-300! mb-4!">
          {title ? `“${title}” has been captured.` : 'Your story has been captured.'} A confirmation email will be sent if email is configured.
        </p>
        <div className="flex! items-center! gap-3! mt-4!">
          <button
            onClick={onNewStory}
            className="px-4! py-2! rounded-lg! text-white! bg-blue-600! hover:bg-blue-700! shadow-md! hover:shadow-lg! transition-all! cursor-pointer!"
          >
            Start New Story
          </button>
          {onViewDossier && (
            <button
              onClick={onViewDossier}
              className="px-4! py-2! rounded-lg! text-blue-700! dark:text-blue-300! bg-blue-50! dark:bg-blue-900/20! hover:bg-blue-100! dark:hover:bg-blue-900/30! border! border-blue-200! dark:border-blue-800! transition-all! cursor-pointer!"
            >
              View Dossier
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto! px-4! py-2! rounded-lg! text-gray-700! dark:text-gray-200! bg-gray-100! dark:bg-gray-700! hover:bg-gray-200! dark:hover:bg-gray-600! border! border-gray-200! dark:border-gray-600! transition-all! cursor-pointer!"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}


