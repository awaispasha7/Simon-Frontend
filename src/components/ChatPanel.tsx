'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble, BubbleProps } from './MessageBubble'
import { Composer } from './Composer'
import { useAuth } from '@/lib/auth-context'
import { useSession } from '@/hooks/useSession'
import { sessionSyncManager } from '@/lib/session-sync'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { CompletionModal } from '@/components/CompletionModal'
// import { useChatStore } from '@/lib/store' // Unused for now
// import { Loader2 } from 'lucide-react' // Unused import

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
}

interface ChatPanelProps {
  _sessionId?: string
  onSessionUpdate?: (sessionId: string) => void
}

export function ChatPanel({ _sessionId, onSessionUpdate }: ChatPanelProps) {
  const { user, isAuthenticated } = useAuth()
  const { 
    sessionId: hookSessionId, 
    isSessionExpired, 
    getSessionInfo,
    createSession
  } = useSession(_sessionId)
  const router = useRouter()
  const toast = useToast()
  
  // Authentication required - no action buttons needed

  const handleNewStory = () => {
    // Reset completion states
    setStoryCompleted(false)
    setShowCompletion(false)
    setCompletedTitle(undefined)
    
    // For authenticated users, create new story
    if (isAuthenticated) {
      // Clear localStorage to prevent restoring old session
      try {
        localStorage.removeItem('chat_session')
        console.log('🆕 [CHAT] Cleared localStorage for authenticated user new story')
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
      
      setCurrentSessionId('')
      sessionIdRef.current = ''
      isNewSessionRef.current = false // Reset new session flag
      
      // Reset messages to initial state
      setMessages([
        {
          role: 'assistant',
          content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
        }
      ])
    } else {
      // Authentication required - redirect to login
      router.push('/auth/login')
      return
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string, attachedFiles?: AttachedFile[]) => {
    // Extract message index from messageId (format: "message-{index}")
    const messageIndex = parseInt(messageId.replace('message-', ''))
    
    if (isNaN(messageIndex) || messageIndex < 0 || messageIndex >= messages.length) {
      console.error('Invalid message index:', messageIndex)
      return
    }
    
    // Get the actual database message_id from the message
    const messageToEdit = messages[messageIndex]
    const dbMessageId = messageToEdit.messageId || null
    
    // Store the edit point for later use - don't remove messages yet
    setEditContent(newContent)
    setIsEditing(true)
    setEditMessageIndex(messageIndex)
    setEditAttachedFiles(attachedFiles || [])
    setEditMessageId(dbMessageId)
    
  }

  const handleEditComplete = () => {
    setEditContent('')
    setIsEditing(false)
    setEditMessageIndex(null)
    setEditAttachedFiles([])
    setEditMessageId(null)
  }

  // Action buttons removed - authentication required
  const shouldShowActionButtons = () => false
  
  const [messages, setMessages] = useState<BubbleProps[]>([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  // showSignInPrompt removed - authentication required
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [storyCompleted, setStoryCompleted] = useState(false)
  const [completedTitle, setCompletedTitle] = useState<string | undefined>(undefined)
  
  // Edit functionality state
  const [editContent, setEditContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editMessageIndex, setEditMessageIndex] = useState<number | null>(null)
  const [editAttachedFiles, setEditAttachedFiles] = useState<AttachedFile[]>([])
  const [editMessageId, setEditMessageId] = useState<string | null>(null) // Store database message_id for editing
  
  // Local state to track current session for this chat
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(_sessionId || undefined)
  
  // Track previous session ID to detect changes
  const prevSessionIdRef = useRef<string | undefined>(_sessionId || undefined)
  
  // Use ref to store session ID for immediate access (bypasses React state async updates)
  const sessionIdRef = useRef<string | undefined>(_sessionId || undefined)
  
  // Track if current message is creating a new session (used to dispatch correct event)
  const isNewSessionRef = useRef<boolean>(false)
  
  // Sync local state with props when they change
  // CRITICAL: Sync props to local state immediately when props change
  // This ensures we use the correct session even if localStorage has stale data
  useEffect(() => {
    if (_sessionId && _sessionId !== currentSessionId) {
      setCurrentSessionId(_sessionId)
      sessionIdRef.current = _sessionId
    }
  }, [_sessionId])

  // Sync local state with localStorage session changes
  useEffect(() => {
    const checkLocalStorageSession = () => {
      try {
        const stored = localStorage.getItem('chat_session')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.sessionId) {
            // Only use localStorage session if no specific session was provided via props
            // This prevents overriding when user clicks on a previous chat
            if (!_sessionId || _sessionId.trim() === '') {
              setCurrentSessionId(parsed.sessionId)
              sessionIdRef.current = parsed.sessionId
              
              // Notify parent component about the restored session
              if (onSessionUpdate) {
                onSessionUpdate(parsed.sessionId)
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to check localStorage session:', error)
      }
    }

    // Check localStorage on mount
    checkLocalStorageSession()

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chat_session') {
        // Authentication required - no anonymous users
        
        // Only respond to storage changes if no specific session is provided via props
        if (!_sessionId || _sessionId.trim() === '') {
          checkLocalStorageSession()
        }
      }
    }

    // Listen for custom session update events
    const handleSessionUpdate = (event: CustomEvent) => {
      console.log('🔄 [CHAT] Received session update event:', event.detail)
      const { sessionId: newSessionId } = event.detail || {}
      if (newSessionId) {
        console.log('🔄 [CHAT] Updating session from event:', newSessionId)
        setCurrentSessionId(newSessionId)
        sessionIdRef.current = newSessionId
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sessionUpdated', handleSessionUpdate as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sessionUpdated', handleSessionUpdate as EventListener)
    }
  }, [_sessionId, onSessionUpdate, isAuthenticated]) // Include missing dependencies
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // const _send = useChatStore(s => s.send) // Unused for now

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  // Load existing messages when session changes
  useEffect(() => {
    const loadSessionMessages = async () => {
      // Determine which session ID to use: prop > hook > current state > localStorage
      const sessionIdToUse = _sessionId || hookSessionId || currentSessionId || (typeof window !== 'undefined' ? (() => {
        try {
          const stored = localStorage.getItem('chat_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.sessionId || undefined
          }
        } catch (e) {
          console.error('Error reading localStorage:', e)
        }
        return undefined
      })() : undefined)
      
      // Projects removed - no projectId needed
      
      // Check if session ID has actually changed
      const currentSessionIdValue = sessionIdToUse || undefined
      if (currentSessionIdValue === prevSessionIdRef.current) {
        // Session ID hasn't changed, don't reset anything
        return
      }
      
      // Session ID has changed, update the ref
      prevSessionIdRef.current = currentSessionIdValue
      
      // If session ID is explicitly empty string (from props), reset to initial state (new chat)
      if (_sessionId === '') {
        setMessages([
          {
            role: 'assistant',
            content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
          }
        ])
        // Reset local session tracking for new chat  
        setCurrentSessionId(undefined)
        prevSessionIdRef.current = undefined
        return
      }
      
      // Update local state with the session we're using
      setCurrentSessionId(sessionIdToUse || undefined)
      
      // For authenticated users with no session ID, try to restore the most recent session
      // BUT: Don't restore if _sessionId is explicitly '' (user clicked "New Chat")
      if (isAuthenticated && user && !sessionIdToUse && _sessionId !== '') {
        try {
          const { sessionApi } = await import('@/lib/api')
          const sessionsResponse = await sessionApi.getSessions(1) // Get the most recent session
          const sessions = Array.isArray(sessionsResponse) 
            ? sessionsResponse 
            : (sessionsResponse && typeof sessionsResponse === 'object' && 'sessions' in sessionsResponse)
              ? (sessionsResponse as { sessions: unknown[] }).sessions
              : []
          
          if (sessions.length > 0 && sessions[0]?.session_id) {
            const lastSessionId = sessions[0].session_id
            console.log('🔄 [CHAT] Restoring last session:', lastSessionId)
            setCurrentSessionId(lastSessionId)
            sessionIdRef.current = lastSessionId
            prevSessionIdRef.current = lastSessionId
            
            // Update localStorage
            try {
              localStorage.setItem('chat_session', JSON.stringify({
                sessionId: lastSessionId,
                userId: user.user_id,
                isAuthenticated: true
              }))
            } catch (e) {
              console.error('Failed to save session to localStorage:', e)
            }
            
            // Continue to load messages for this session
            // Don't return here, let it continue to load messages
          } else {
            // No previous session found - don't create one yet, wait for first message
            console.log('📝 [CHAT] No previous session found. Will create session on first message.')
            return
          }
        } catch (error) {
          console.error('Failed to restore last session:', error)
          // If we can't restore, don't create a new session - wait for first message
          return
        }
      }

      // If no session ID, don't load messages
      if (!sessionIdToUse && !currentSessionId) {
        return
      }
      
      // Use the session ID we have (either from props, state, or restored)
      const finalSessionId = sessionIdToUse || currentSessionId

      try {
        const { sessionApi } = await import('@/lib/api')
        const messagesResponse = await sessionApi.getSessionMessages(finalSessionId, 50, 0)
        
        // Handle backend response structure: { success: true, messages: [...] }
        const messages = (messagesResponse as { messages?: unknown[] })?.messages || []
        
        if (messages && Array.isArray(messages)) {
          if (messages.length > 0) {
            const formattedMessages = messages.map((msg: unknown) => {
              const message = msg as { 
                role?: string; 
                content?: string; 
                created_at?: string; 
                message_id?: string;
                metadata?: { attached_files?: AttachedFile[] };
                attached_files?: AttachedFile[] // Fallback for direct attachment (shouldn't happen but just in case)
              }
              
              // Extract attached files from metadata (where they're stored in the database)
              const attachedFiles = message.metadata?.attached_files || message.attached_files || []
              
              return {
                role: message.role as 'user' | 'assistant',
                content: message.content || '',
                timestamp: message.created_at,
                attachedFiles: attachedFiles,
                messageId: message.message_id // Store message_id for editing functionality
              }
            })
            
            setMessages(formattedMessages)
          } else {
            // Session exists but has no messages - show initial welcome message
            setMessages([
              {
                role: 'assistant',
                content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
              }
            ])
          }
        } else {
          // Invalid response format - show welcome message
          setMessages([
            {
              role: 'assistant',
              content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
            }
          ])
        }
      } catch (error) {
        console.error('Failed to load session messages:', error)
        
        // Use session sync manager to handle invalid sessions
        if (error && typeof error === 'object' && 'response' in error && 
            error.response && typeof error.response === 'object' && 'status' in error.response) {
          
          const status = error.response.status
          
          if (status === 403 || status === 404) {
            // Session is invalid, let the sync manager handle it
            // Clear the invalid session from localStorage immediately
            try {
              localStorage.removeItem('chat_session')
            } catch (e) {
              console.error('Failed to clear session from localStorage:', e)
            }
            
            // Reset local state to reflect invalid session
            setMessages([
              {
                role: 'assistant',
                content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
              }
            ])
            setCurrentSessionId('')
            sessionIdRef.current = ''
            
            // Trigger sync manager to clean up and find a valid session
            sessionSyncManager.forceSync()
          }
        }
      }
    }

    loadSessionMessages()
  }, [_sessionId, isAuthenticated, user?.user_id, currentSessionId, hookSessionId, user])

  // Sync hook session values with local state
  useEffect(() => {
    if (hookSessionId) {
      setCurrentSessionId(hookSessionId)
      sessionIdRef.current = hookSessionId
    }
  }, [hookSessionId])

  // Listen for session deleted events to clear chat if current session is deleted
  useEffect(() => {
    const handleSessionDeleted = (event: CustomEvent) => {
      const { sessionId: deletedSessionId } = event.detail || {}
      const currentSession = currentSessionId || sessionIdRef.current
      
      // If the deleted session is the current one, clear the chat
      if (deletedSessionId && deletedSessionId === currentSession) {
        console.log('🗑️ [CHAT] Current session was deleted - clearing chat content')
        setCurrentSessionId('')
        sessionIdRef.current = ''
        setMessages([
          {
            role: 'assistant',
            content: "Hey! 👋 I'm your content creation assistant! Let's create some killer short-form videos for Instagram and TikTok. What topic are you passionate about sharing today?"
          }
        ])
        // Clear localStorage
        try {
          localStorage.removeItem('chat_session')
        } catch (e) {
          console.error('Failed to clear localStorage:', e)
        }
      }
    }

    window.addEventListener('sessionDeleted', handleSessionDeleted as EventListener)
    
    return () => {
      window.removeEventListener('sessionDeleted', handleSessionDeleted as EventListener)
    }
  }, [currentSessionId])

  const getDynamicTypingMessage = (userMessage: string) => {
    const message = userMessage.toLowerCase()
    
    // Fitness content keywords
    const fitnessKeywords = [
      'workout', 'exercise', 'fitness', 'nutrition', 'motivation', 'transformation', 'gym', 'training', 'content', 'video',
      'instagram', 'tiktok', 'reels', 'shorts', 'fitness influencer', 'workout routine', 'meal prep', 'protein', 'cardio',
      'strength training', 'weight loss', 'muscle gain', 'fitness tips', 'health', 'wellness', 'diet', 'supplements'
    ]
    
    // Check if user is talking about fitness content
    const isFitnessContent = fitnessKeywords.some(keyword => message.includes(keyword))
    
    if (isFitnessContent) {
      return "Creating your fitness content..."
    }
    
    // Use a deterministic approach based on message content to avoid hydration issues
    const casualMessages = [
      "Thinking...",
      "Cooking a response...",
      "Building blocks...",
      "Connecting dots...",
      "Processing...",
      "Weaving thoughts...",
      "Gathering ideas...",
      "Shaping words...",
      "Finding the right words...",
      "Putting pieces together...",
      "Brewing ideas...",
      "Spinning thoughts...",
      "Crafting a reply...",
      "Mixing concepts...",
      "Stirring creativity...",
      "Blending insights...",
      "Forming thoughts...",
      "Assembling ideas...",
      "Polishing words...",
      "Refining thoughts..."
    ]
    
    // Use message length and first character to create deterministic selection
    const hash = message.length + (message.charCodeAt(0) || 0)
    const index = hash % casualMessages.length
    return casualMessages[index]
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (text: string, attachedFiles?: AttachedFile[], enableWebSearch?: boolean) => {
    if (!text.trim() || isLoading) {
      return
    }
    
    // Check if content is completed - show helpful prompt instead of sending message
    if (storyCompleted) {
      
      // Add user message to UI
      const userMessage: BubbleProps = { 
        role: 'user', 
        content: text,
        attachedFiles: attachedFiles
      }
      setMessages(prev => [...prev, userMessage])
      
      // Add helpful assistant response based on auth status
      const promptMessage: BubbleProps = {
        role: 'assistant',
        content: isAuthenticated 
          ? "Your content is ready! 🎉 To create new content, please click the \"New Project\" button in the sidebar."
          : "Your content is ready! 🎉 To create unlimited content ideas and save your progress, please sign up or log in. It's free and takes just a moment!"
      }
      
      setTimeout(() => {
        setMessages(prev => [...prev, promptMessage])
      }, 500)
      
      return
    }
    
    setIsProcessingMessage(true)

    // Authentication required - no anonymous users
    if (!isAuthenticated) {
      console.error('⚠️ Authentication required to send messages')
      return
    }

    // Add user message with attached files
    const userMessage: BubbleProps = { 
      role: 'user', 
      content: text,
      attachedFiles: attachedFiles
    }
    
    // If we're editing a message, replace it and remove subsequent messages
    if (isEditing && editMessageIndex !== null) {
      const editedMessages = messages.slice(0, editMessageIndex)
      setMessages([...editedMessages, userMessage])
    } else {
      setMessages(prev => [...prev, userMessage])
    }
    
    setIsLoading(true)
    
    // Set dynamic typing message
    const dynamicMessage = getDynamicTypingMessage(text)
    setTypingMessage(dynamicMessage)

    // Add empty assistant message that we'll stream into
    const assistantMessage: BubbleProps = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Make streaming API call to backend with extended timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
      
      // REQUIRE AUTHENTICATION - use session info from authenticated user
      if (!isAuthenticated) {
        throw new Error('Authentication required to send messages')
      }
      
      // For authenticated users, prioritize props > local state > hook values
      let sessionId = _sessionId || currentSessionId || hookSessionId || sessionIdRef.current
      
      console.log('💬 [CHAT] Using sessionId:', sessionId)
      
      // CRITICAL: Create session if none exists
      if (!sessionId) {
        console.log('💬 [CHAT] No session ID available, creating new session...')
        isNewSessionRef.current = true // Mark as new session
        
        // Try to create a session
        try {
          await createSession()
          // Wait a bit for the session to be created and state to update
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Try to get the session ID again from various sources
          sessionId = hookSessionId || sessionIdRef.current || currentSessionId
          
          // Check localStorage as a fallback
          if (!sessionId) {
            try {
              const stored = localStorage.getItem('chat_session')
              if (stored) {
                const parsed = JSON.parse(stored)
                if (parsed.sessionId) {
                  sessionId = parsed.sessionId
                  sessionIdRef.current = parsed.sessionId
                  setCurrentSessionId(parsed.sessionId)
                  console.log('💬 [CHAT] Retrieved session from localStorage:', parsed.sessionId)
                }
              }
            } catch (e) {
              console.error('Error reading localStorage:', e)
            }
          }
          
          if (!sessionId) {
            throw new Error('Failed to create session - please try again')
          }
          
          console.log('💬 [CHAT] Using newly created session:', sessionId)
          // Don't dispatch sessionCreated here - wait until message is saved
        } catch (error) {
          console.error('💬 [CHAT] Failed to create session:', error)
          throw new Error('Failed to create session - please try again')
        }
      }
      
      // Get headers for the request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add session headers
      if (sessionId) {
        headers['X-Session-ID'] = sessionId
      }
      if (user?.user_id) {
        headers['X-User-ID'] = user.user_id
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          text,
          session_id: sessionId,
          attached_files: attachedFiles || [],
          edit_from_message_id: (isEditing && editMessageId) ? editMessageId : undefined,
          enable_web_search: enableWebSearch || false
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get response from server: ${response.status} - ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let assistantContent = ''
      let streamComplete = false

      while (!streamComplete) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        const chunk = decoder.decode(value)
        
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'content') {
                assistantContent += data.content
                
                // Update the last message (assistant message) with new content
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: assistantContent
                  }
                  return newMessages
                })
                
                // Check if this is the final chunk
                if (data.done) {
                  streamComplete = true
                  break
                }
              } else if (data.type === 'metadata') {
                // Handle metadata chunk - store session_id for next message
                if (data.metadata?.session_id) {
                  // Update both state and ref immediately
                  setCurrentSessionId(data.metadata.session_id)
                  sessionIdRef.current = data.metadata.session_id
                  
                  // Persist session to localStorage and ensure it completes before dispatching event
                  try {
                    const sessionData = {
                      sessionId: data.metadata.session_id,
                      isAuthenticated: isAuthenticated
                    }
                    
                    localStorage.setItem('chat_session', JSON.stringify(sessionData))
                    console.log('💾 Session persisted to localStorage:', data.metadata.session_id)
                    
                    // Verify the localStorage write was successful
                    const stored = localStorage.getItem('chat_session')
                    if (stored) {
                      const parsed = JSON.parse(stored)
                      if (parsed.sessionId === data.metadata.session_id) {
                        console.log('✅ localStorage verification successful')
                        
                        // Dispatch events after localStorage is confirmed updated
                        // Use sessionCreated for new sessions, sessionUpdated for existing ones
                        setTimeout(() => {
                          if (isNewSessionRef.current) {
                            // New session - dispatch sessionCreated event to refresh sidebar
                            window.dispatchEvent(new CustomEvent('sessionCreated', { 
                              detail: { 
                                sessionId: data.metadata.session_id
                              } 
                            }))
                            console.log('📡 Session created event dispatched:', data.metadata.session_id)
                            // Mark that we need to refresh after stream completes
                            isNewSessionRef.current = true // Keep flag true to trigger refresh later
                          } else {
                            // Existing session - dispatch sessionUpdated event
                            window.dispatchEvent(new CustomEvent('sessionUpdated', { 
                              detail: { 
                                sessionId: data.metadata.session_id
                              } 
                            }))
                            console.log('📡 Session update event dispatched:', data.metadata.session_id)
                          }
                          
                          // Also notify parent component if callback is provided
                          if (onSessionUpdate) {
                            onSessionUpdate(data.metadata.session_id)
                          }
                        }, 200) // Small delay to ensure message is saved and localStorage is fully written
                      } else {
                        console.error('❌ localStorage verification failed - session ID mismatch')
                      }
                    } else {
                      console.error('❌ localStorage verification failed - no stored data')
                    }
                  } catch (error) {
                    console.error('Failed to persist session:', error)
                  }
                }
              }
            } catch {
              // Error parsing streaming data
            }
          }
        }
      }
      
      // Check if we received any content - if not, show error message
      // Detect completion heuristics (match backend markers)
      const lower = assistantContent.toLowerCase()
      const completed = [
        'this is perfect',
        'i\'m ready',
        'let\'s go with this',
        'this is good',
        'content is ready',
        "we've reached the end",
        'the end',
        'conclusion',
        'would you like to create another',
        'would you like to start another'
      ].some(k => lower.includes(k))

      if (completed) {
        setShowCompletion(true)
        setStoryCompleted(true)
        // Dossier functionality removed
      }

      if (assistantContent.trim() === '') {
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: "I'm sorry, I didn't receive a proper response. Please try again."
          }
          return newMessages
        })
      }
      
      // Ensure loading state is cleared
      setIsLoading(false)
      
      // If this was a new session, dispatch event to refresh sidebar (no page refresh needed)
      if (isNewSessionRef.current) {
        console.log('🔄 New session created - dispatching event to update sidebar')
        isNewSessionRef.current = false // Reset flag
        // Dispatch event to refresh sidebar - the sidebar will refetch automatically
        window.dispatchEvent(new CustomEvent('sessionCreated', { 
          detail: { 
            sessionId: sessionIdRef.current
          } 
        }))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Reset new session flag on error to prevent unwanted refresh
      isNewSessionRef.current = false
      
      // Show specific error message for session issues
      let errorContent = "I'm sorry, I encountered an error. Please make sure the backend server is running and try again."
      
      if (error instanceof Error && error.message.includes('No session ID available')) {
        errorContent = 'Session error: Please refresh the page and try again. Your conversation will be preserved.'
      }
      
      const errorMessage: BubbleProps = {
        role: 'assistant',
        content: errorContent
      }
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = errorMessage
        return newMessages
      })
    } finally {
      setIsLoading(false)
      setIsProcessingMessage(false)
      setTypingMessage('')
      
      // Clear edit state after sending message
      if (isEditing) {
        handleEditComplete()
      }
      
      // Dossier functionality removed - no refresh needed
    }
  }


  return (
    <div className="flex flex-col h-full bg-linear-to-b from-white via-green-50/60 to-red-50/40 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-70 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-56 h-56 bg-linear-to-br from-green-400/80 to-green-500/60 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-10 w-48 h-48 bg-linear-to-br from-red-400/70 to-orange-500/60 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-linear-to-br from-red-400/70 to-red-500/60 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
        <div className="w-full px-6 py-4" key={currentSessionId || hookSessionId || _sessionId || 'no-session'}>
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-linear-to-br from-green-400 to-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <span className="text-2xl">🎬</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Let's Create Viral Content! 🎬</h2>
              <p className="text-gray-600 max-w-md leading-relaxed">
                I'll help you create engaging short-form videos for Instagram Reels and TikTok. What content are you thinking about?
              </p>
              <div className="mt-6 text-sm text-gray-500">
                Share your content idea to get started
              </div>
            </div>
          )}

          {/* Anonymous user prompt removed - authentication required */}

          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
              showActionButtons={false}
              onNewStory={handleNewStory}
              attachedFiles={message.attachedFiles}
              onEdit={handleEditMessage}
              messageId={`message-${index}`}
            />
          ))}

          {/* Dynamic Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 mb-6 animate-in slide-in-from-bottom-2 duration-300 ml-8" style={{ marginTop: '2px', marginLeft: '16px' }}>
              <div className="h-9 w-9 flex items-center justify-center shrink-0 mt-1 ml-4">
                {/* <span className="text-xs font-bold text-green-800">SW</span> */}
              </div>
              <div className="flex items-center pt-2">
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                  {typingMessage.split('').map((char, index) => (
                    <span 
                      key={index}
                      className="inline-block animate-pulse-wave" 
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

              {/* Enhanced Composer - Fixed at bottom */}
              <div className="border-t border-gray-200/50 bg-white/90 backdrop-blur-sm relative z-10 mt-auto">
                <div className="w-full overflow-hidden">
                  <Composer 
                    onSend={handleSendMessage} 
                    disabled={isLoading || isProcessingMessage} 
                    sessionId={currentSessionId || hookSessionId || undefined}
                    editContent={editContent}
                    isEditing={isEditing}
                    onEditComplete={handleEditComplete}
                    editAttachedFiles={editAttachedFiles}
                  />
                </div>
              </div>

            {/* Completion Modal */}
            <CompletionModal
              open={showCompletion}
              title={completedTitle}
              onClose={() => setShowCompletion(false)}
              onNewStory={handleNewStory}
            />
    </div>
  )
}
