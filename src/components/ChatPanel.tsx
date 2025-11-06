'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble, BubbleProps } from './MessageBubble'
import { Composer } from './Composer'
// Dossier and Auth removed for coaching MVP
import { useSession } from '@/hooks/useSession'
import { sessionSyncManager } from '@/lib/session-sync'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { cn } from '@/lib/utils'
// import { useChatStore } from '@/lib/store' // Unused for now
// import { Loader2 } from 'lucide-react' // Unused import

interface AttachedFile {
  name: string
  size: number
  url: string
  type: string
  asset_id: string
  extracted_text?: string // Optional: extracted text from documents (from upload endpoint)
}

interface ChatPanelProps {
  _sessionId?: string
  _projectId?: string
  onSessionUpdate?: (sessionId: string, projectId?: string) => void
}

export function ChatPanel({ _sessionId, _projectId, onSessionUpdate }: ChatPanelProps) {
  const user: any = null
  const isAuthenticated = false
  const { 
    sessionId: hookSessionId, 
    projectId: hookProjectId,
    isSessionExpired, 
    getSessionInfo 
  } = useSession(_sessionId, _projectId)
  const router = useRouter()
  const toast = useToast()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  
  // Action button handlers for interactive chat buttons
  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleNewStory = () => {
    // For authenticated users, create new story
    if (isAuthenticated) {
      // Clear localStorage to prevent restoring old session
      try {
        localStorage.removeItem('stories_we_tell_session')
        console.log('🆕 [CHAT] Cleared localStorage for authenticated user new story')
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
      
      setCurrentSessionId('')
      setCurrentProjectId('')
      sessionIdRef.current = ''
      
      // Reset messages to initial state
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm here to help bring your story to life. What story idea has been on your mind?"
        }
      ])
    } else {
      // For anonymous users, show warning toast with options
      toast.newChatWarning(
        'Create New Chat?',
        'If you create a new chat, your current chat data will be lost forever! Please login to save and load chats.',
        () => {
          // User confirmed - clear current session
          setCurrentSessionId('')
          setCurrentProjectId('')
          sessionIdRef.current = ''
          localStorage.removeItem('stories_we_tell_session')
          setMessages([
            {
              role: 'assistant',
              content: "Hi! I'm here to help bring your story to life. What story idea has been on your mind?"
            }
          ])
        },
        undefined, // No cancel action needed
        handleLogin, // Login button
        'Continue',
        'Cancel'
      )
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
    
    console.log('✏️ [EDIT] Edit message at index:', messageIndex, 'Content:', newContent)
    console.log('✏️ [EDIT] Database message_id:', dbMessageId)
    console.log('✏️ [EDIT] Edit attached files:', attachedFiles)
    console.log('✏️ [EDIT] Messages will be trimmed when user sends the edited message')
  }

  const handleEditComplete = () => {
    setEditContent('')
    setIsEditing(false)
    setEditMessageIndex(null)
    setEditAttachedFiles([])
    setEditMessageId(null)
  }

  // Function to determine if a message should show action buttons
  // This is now simpler and focused on AI responses that mention signup
  const shouldShowActionButtons = (content: string, role: string) => {
    if (role !== 'assistant') return false
    if (isAuthenticated) return false // Don't show for authenticated users
    
    // Check for AI responses that mention signup/login
    const signupKeywords = [
      'sign up', 'signup', 'create account', 'register', 'unlimited stories',
      'multiple stories', 'save your story', 'access your stories',
      'create unlimited stories', 'sign up to create', 'register to access'
    ]
    
    const contentLower = content.toLowerCase()
    return signupKeywords.some(keyword => contentLower.includes(keyword))
  }
  
  const [messages, setMessages] = useState<BubbleProps[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your personal content strategist and assistant. Tell me your goal, topic, or paste a script—I'll help you plan, write, or refine with emotional clarity."
    }
  ])
  
  // Track if we're currently streaming to prevent message reload during streaming
  const isStreamingRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)
  
  // Edit functionality state
  const [editContent, setEditContent] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [editMessageIndex, setEditMessageIndex] = useState<number | null>(null)
  const [editAttachedFiles, setEditAttachedFiles] = useState<AttachedFile[]>([])
  const [editMessageId, setEditMessageId] = useState<string | null>(null) // Store database message_id for editing
  
  // Local state to track current session and project for this chat
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(_sessionId || undefined)
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(_projectId || undefined)
  
  // Track previous session ID to detect changes
  const prevSessionIdRef = useRef<string | undefined>(_sessionId || undefined)
  
  // Use ref to store session ID for immediate access (bypasses React state async updates)
  const sessionIdRef = useRef<string | undefined>(_sessionId || undefined)
  
  // Sync local state with props when they change
  useEffect(() => {
    if (_sessionId !== currentSessionId) {
      console.log('🔄 [CHAT] Syncing sessionId from props:', _sessionId)
      setCurrentSessionId(_sessionId)
      sessionIdRef.current = _sessionId
    }
    if (_projectId !== currentProjectId) {
      console.log('🔄 [CHAT] Syncing projectId from props:', _projectId)
      setCurrentProjectId(_projectId)
    }
  }, [_sessionId, _projectId, currentSessionId, currentProjectId])

  // Sync local state with localStorage session changes
  useEffect(() => {
    const checkLocalStorageSession = () => {
      try {
        const stored = localStorage.getItem('stories_we_tell_session')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.sessionId) {
            console.log('🔄 [CHAT] Found session in localStorage:', parsed.sessionId)
            
            // For anonymous users, allow session restoration
            if (!isAuthenticated) {
              console.log('🔄 [DEMO] Anonymous user - allowing session restoration')
            }
            
            // Only use localStorage session if no specific session was provided via props
            // This prevents overriding when user clicks on a previous chat
            if (!_sessionId || _sessionId.trim() === '') {
              setCurrentSessionId(parsed.sessionId)
              sessionIdRef.current = parsed.sessionId
              if (parsed.projectId) {
                setCurrentProjectId(parsed.projectId)
              }
              
              // Notify parent component about the restored session
              if (onSessionUpdate) {
                console.log('🔄 [CHAT] Notifying parent about restored session:', parsed.sessionId)
                onSessionUpdate(parsed.sessionId, parsed.projectId)
              }
            } else {
              console.log('🔄 [CHAT] Skipping localStorage session because specific session provided via props:', _sessionId)
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
      if (e.key === 'stories_we_tell_session') {
        // For anonymous users, allow localStorage changes
        if (!isAuthenticated) {
          console.log('🔄 [DEMO] Anonymous user - allowing localStorage changes')
        }
        
        // Only respond to storage changes if no specific session is provided via props
        if (!_sessionId || _sessionId.trim() === '') {
          checkLocalStorageSession()
        }
      }
    }

    // Listen for custom session update events
    const handleSessionUpdate = (event: CustomEvent) => {
      console.log('🔄 [CHAT] Received session update event:', event.detail)
      const { sessionId: newSessionId, projectId: newProjectId } = event.detail || {}
      if (newSessionId) {
        console.log('🔄 [CHAT] Updating session from event:', newSessionId)
        setCurrentSessionId(newSessionId)
        sessionIdRef.current = newSessionId
        if (newProjectId) {
          setCurrentProjectId(newProjectId)
        }
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
  // Dossier refresh removed
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
          const stored = localStorage.getItem('stories_we_tell_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.sessionId || undefined
          }
        } catch (e) {
          console.error('Error reading localStorage:', e)
        }
        return undefined
      })() : undefined)
      
      const projectIdToUse = _projectId || hookProjectId || currentProjectId || (typeof window !== 'undefined' ? (() => {
        try {
          const stored = localStorage.getItem('stories_we_tell_session')
          if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.projectId || undefined
          }
        } catch (e) {
          console.error('Error reading localStorage:', e)
        }
        return undefined
      })() : undefined)
      
      // Check if session ID has actually changed
      const currentSessionIdValue = sessionIdToUse || undefined
      if (currentSessionIdValue === prevSessionIdRef.current) {
        // Session ID hasn't changed, don't reset anything
        return
      }
      
      // CRITICAL: Don't reload messages if we're currently streaming a response
      // This prevents overwriting messages that are being streamed in
      if (isStreamingRef.current) {
        console.log('🔄 [CHAT] Skipping message reload - currently streaming response')
        // Still update the ref to track the session change
        prevSessionIdRef.current = currentSessionIdValue
        setCurrentSessionId(sessionIdToUse || undefined)
        setCurrentProjectId(projectIdToUse || undefined)
        return
      }
      
      // Session ID has changed, update the ref
      prevSessionIdRef.current = currentSessionIdValue
      
      // If session ID is explicitly empty string (from props), reset to initial state (new chat)
      if (_sessionId === '') {
        setMessages([
          {
            role: 'assistant',
            content: "Hi! I'm here to help bring your story to life. What story idea has been on your mind?"
          }
        ])
        // Reset local session tracking for new chat  
        setCurrentSessionId(undefined)
        setCurrentProjectId(undefined)
        prevSessionIdRef.current = undefined
        return
      }
      
      // Update local state with the session we're using
      setCurrentSessionId(sessionIdToUse || undefined)
      setCurrentProjectId(projectIdToUse || undefined)
      
      // For authenticated users with no session ID, create one immediately
      if (isAuthenticated && user && !sessionIdToUse) {
        const newSessionId = crypto.randomUUID()
        setCurrentSessionId(newSessionId)
        sessionIdRef.current = newSessionId
        prevSessionIdRef.current = newSessionId
      }

      // If no session ID, don't load messages
      if (!sessionIdToUse) {
        console.log('🔄 [CHAT] No session ID available, skipping message load')
        return
      }

      // Load messages for both authenticated and anonymous users
      // Anonymous users can have sessions too (stored in localStorage)
      console.log('🔄 [CHAT] Loading messages for session:', sessionIdToUse, 'Authenticated:', isAuthenticated)

      try {
        const { sessionApi } = await import('@/lib/api')
        const messagesResponse = await sessionApi.getSessionMessages(sessionIdToUse, 50, 0)
        console.log('📋 ChatPanel messages response:', messagesResponse)
        
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
              
              console.log('📎 [CHAT] Loading message:', {
                message_id: message.message_id,
                role: message.role,
                content: message.content?.substring(0, 50),
                hasAttachedFiles: attachedFiles.length > 0,
                attachedFilesCount: attachedFiles.length,
                attachedFiles: attachedFiles.map(f => ({ name: f.name, type: f.type })),
                timestamp: message.created_at
              })
              
              return {
                role: message.role as 'user' | 'assistant',
                content: message.content || '',
                timestamp: message.created_at,
                attachedFiles: attachedFiles,
                messageId: message.message_id // Store message_id for editing functionality
              }
            })
            
            console.log('📋 [CHAT] Formatted messages summary:', formattedMessages.map(m => ({
              role: m.role,
              hasFiles: m.attachedFiles?.length > 0,
              fileCount: m.attachedFiles?.length || 0,
              fileNames: m.attachedFiles?.map(f => f.name) || []
            })))
            
            setMessages(formattedMessages)
          } else {
            // Session exists but has no messages - show initial welcome message
            console.log('📋 [CHAT] Session exists but has no messages - showing welcome message')
            setMessages([
              {
                role: 'assistant',
                content: "Hi! I'm your personal content strategist and assistant. Tell me your goal, topic, or paste a script—I'll help you plan, write, or refine with emotional clarity."
              }
            ])
          }
        } else {
          // Invalid response format - show welcome message
          console.log('📋 [CHAT] Invalid response format - showing welcome message')
          setMessages([
            {
              role: 'assistant',
              content: "Hi! I'm your personal content strategist and assistant. Tell me your goal, topic, or paste a script—I'll help you plan, write, or refine with emotional clarity."
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
            console.log(`🚨 Session validation failed (${status}) - triggering sync cleanup`)
            console.log(`🚨 Invalid session ID: ${currentSessionId}`)
            
            // Clear the invalid session from localStorage immediately
            try {
              localStorage.removeItem('stories_we_tell_session')
              console.log('🧹 Cleared invalid session from localStorage')
            } catch (e) {
              console.error('Failed to clear session from localStorage:', e)
            }
            
            // Reset local state to reflect invalid session
            setMessages([
              {
                role: 'assistant',
                content: "Hi! I'm here to help bring your story to life. What story idea has been on your mind?"
              }
            ])
            setCurrentSessionId('')
            setCurrentProjectId('')
            sessionIdRef.current = ''
            
            // Trigger sync manager to clean up and find a valid session
            sessionSyncManager.forceSync()
          }
        }
      }
    }

    loadSessionMessages()
  }, [_sessionId, _projectId, isAuthenticated, user?.user_id, currentSessionId, hookSessionId, hookProjectId, currentProjectId, user])

  // Sync hook session values with local state
  useEffect(() => {
    if (hookSessionId && hookProjectId) {
      console.log('🔄 [CHAT] Syncing hook session values:', hookSessionId, hookProjectId)
      setCurrentSessionId(hookSessionId)
      setCurrentProjectId(hookProjectId)
      sessionIdRef.current = hookSessionId
    }
  }, [hookSessionId, hookProjectId])

  const getDynamicTypingMessage = (userMessage: string) => {
    const message = userMessage.toLowerCase()
    
    // Story development keywords
    const storyKeywords = [
      'character', 'plot', 'scene', 'setting', 'theme', 'conflict', 'resolution',
      'protagonist', 'antagonist', 'dialogue', 'script', 'story', 'narrative',
      'beginning', 'middle', 'end', 'climax', 'tension', 'drama', 'comedy',
      'thriller', 'romance', 'action', 'adventure', 'mystery', 'horror'
    ]
    
    // Check if user is talking about story development
    const isStoryDevelopment = storyKeywords.some(keyword => message.includes(keyword))
    
    if (isStoryDevelopment) {
      return "Crafting your story..."
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

  const handleSendMessage = async (text: string, attachedFiles?: AttachedFile[]) => {
    // Allow sending if there's text OR attached files
    if ((!text.trim() && (!attachedFiles || attachedFiles.length === 0)) || isLoading) {
      return
    }
    
    console.log('💬 [CHAT] handleSendMessage called with text:', text.substring(0, 50) + '...')
    console.log('💬 [CHAT] isAuthenticated:', isAuthenticated, 'hookSessionId:', hookSessionId, 'hookProjectId:', hookProjectId)
    console.log('💬 [CHAT] _sessionId prop:', _sessionId, '_projectId prop:', _projectId)
    console.log('💬 [CHAT] currentSessionId state:', currentSessionId, 'currentProjectId state:', currentProjectId)
    
    setIsProcessingMessage(true)

    // Check if session is expired for anonymous users
    if (!isAuthenticated && isSessionExpired) {
      setShowSignInPrompt(true)
      return
    }

    // Add user message with attached files
    // Allow empty content if files are attached
    const userMessage: BubbleProps = { 
      role: 'user', 
      content: text || (attachedFiles && attachedFiles.length > 0 ? '📎 Attached file(s)' : ''),
      attachedFiles: attachedFiles
    }
    
    // If we're editing a message, replace it and remove subsequent messages
    if (isEditing && editMessageIndex !== null) {
      const editedMessages = messages.slice(0, editMessageIndex)
      setMessages([...editedMessages, userMessage])
      console.log('✏️ [EDIT] Replaced message at index', editMessageIndex, 'and removed', messages.length - editMessageIndex - 1, 'subsequent messages')
    } else {
      setMessages(prev => [...prev, userMessage])
    }
    
    setIsLoading(true)
    isStreamingRef.current = true // Mark that we're starting to stream
    
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
      
      // Use session info from useSession hook for both authenticated and anonymous users
      let sessionId, projectId
      if (isAuthenticated) {
        // For authenticated users, prioritize currentSessionId (from selected chat) over hook values
        // This ensures that when a user clicks on a previous chat, messages are sent to that chat
        sessionId = currentSessionId || hookSessionId || sessionIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('anonymous_session_id') : null)
        projectId = currentProjectId || hookProjectId || (typeof window !== 'undefined' ? localStorage.getItem('anonymous_project_id') : null)
      } else {
        // For anonymous users, try multiple sources to find session data
        // This ensures consistency with upload component
        sessionId = hookSessionId || sessionIdRef.current || (typeof window !== 'undefined' ? localStorage.getItem('anonymous_session_id') : null)
        projectId = hookProjectId || (typeof window !== 'undefined' ? localStorage.getItem('anonymous_project_id') : null)
        
        // If still no session, try to get from localStorage (for demo users)
        if (!sessionId) {
          try {
            const stored = typeof window !== 'undefined' ? localStorage.getItem('stories_we_tell_session') : null
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed.sessionId) {
                sessionId = parsed.sessionId
                projectId = parsed.projectId
                console.log('💬 [CHAT] Restored session from localStorage for anonymous user:', sessionId)
              }
            }
          } catch (error) {
            console.error('Error parsing localStorage session:', error)
          }
        }
      }
      
      console.log('💬 [CHAT] Using sessionId:', sessionId, 'projectId:', projectId)
      
      // For single-user personal assistant: allow backend to create session automatically
      // If no session ID, backend will create one on first message
      if (!sessionId) {
        console.log('💬 [CHAT] No session ID available - backend will create one automatically')
        // Don't throw error - let backend handle session creation
      }
      
      // Get headers for the request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Add session headers (optional - backend will create session if missing)
      if (sessionId) {
        headers['X-Session-ID'] = sessionId
      }
      if (projectId) {
        headers['X-Project-ID'] = projectId
      }
      // For single-user personal assistant, backend uses fixed user_id automatically
      // No need to send X-User-ID header
      
      const chatPayload = { 
        text,
        session_id: sessionId || undefined, // Allow undefined - backend will create
        project_id: projectId || undefined,  // Allow undefined - backend will use default
        attached_files: attachedFiles || [],
        edit_from_message_id: (isEditing && editMessageId) ? editMessageId : undefined
      }
      
      // Debug: Log attached files and extracted_text
      if (attachedFiles && attachedFiles.length > 0) {
        console.log('📤 [CHAT] Sending chat request with attached files:', attachedFiles.map(f => ({
          name: f.name,
          type: f.type,
          has_extracted_text: !!f.extracted_text,
          extracted_text_length: f.extracted_text?.length || 0
        })))
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(chatPayload),
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
                // Handle metadata chunk - store session_id and project_id for next message
                if (data.metadata?.session_id) {
                  // CRITICAL: Update refs immediately but don't trigger message reload during streaming
                  sessionIdRef.current = data.metadata.session_id
                  prevSessionIdRef.current = data.metadata.session_id
                  
                  // Update state but don't trigger reload (isStreamingRef prevents it in useEffect)
                  setCurrentSessionId(data.metadata.session_id)
                  
                  // Persist session to localStorage
                  try {
                    const sessionData = {
                      sessionId: data.metadata.session_id,
                      projectId: data.metadata?.project_id,
                      isAuthenticated: isAuthenticated
                    }
                    
                    localStorage.setItem('stories_we_tell_session', JSON.stringify(sessionData))
                    console.log('💾 Session persisted to localStorage (during streaming):', data.metadata.session_id)
                    
                    // Defer session update event until streaming completes to prevent message reload
                    // This prevents the useEffect from overwriting messages during streaming
                    setTimeout(() => {
                      // Only dispatch if streaming has completed
                      if (!isStreamingRef.current) {
                        window.dispatchEvent(new CustomEvent('sessionUpdated', { 
                          detail: { 
                            sessionId: data.metadata.session_id,
                            projectId: data.metadata?.project_id 
                          } 
                        }))
                        console.log('📡 Session update event dispatched (after streaming):', data.metadata.session_id)
                        
                        if (onSessionUpdate) {
                          onSessionUpdate(data.metadata.session_id, data.metadata?.project_id)
                        }
                      } else {
                        // Still streaming - defer until complete
                        const checkInterval = setInterval(() => {
                          if (!isStreamingRef.current) {
                            clearInterval(checkInterval)
                            window.dispatchEvent(new CustomEvent('sessionUpdated', { 
                              detail: { 
                                sessionId: data.metadata.session_id,
                                projectId: data.metadata?.project_id 
                              } 
                            }))
                            if (onSessionUpdate) {
                              onSessionUpdate(data.metadata.session_id, data.metadata?.project_id)
                            }
                          }
                        }, 100)
                        // Clear interval after 5 seconds max
                        setTimeout(() => clearInterval(checkInterval), 5000)
                      }
                    }, 100) // Small delay
                  } catch (error) {
                    console.error('Failed to persist session:', error)
                  }
                }
                if (data.metadata?.project_id) {
                  setCurrentProjectId(data.metadata.project_id)
                }
              }
            } catch {
              // Error parsing streaming data
            }
          }
        }
      }
      
      // Check if we received any content - if not, show error message
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
      isStreamingRef.current = false // Mark that streaming is complete
    } catch (error) {
      console.error('Error sending message:', error)
      
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
      isStreamingRef.current = false // Ensure streaming flag is cleared
      
      // Clear edit state after sending message
      if (isEditing) {
        handleEditComplete()
      }
      
      // No dossier refresh in MVP
    }
  }


  return (
    <div className={cn(
      "flex flex-col h-full relative overflow-hidden",
      resolvedTheme === 'light' ? colors.background : "bg-black"
    )}>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
        <div className="w-full px-6 py-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
              <div className={cn(
                "w-20 h-20 rounded-xl flex items-center justify-center mb-8 border",
                resolvedTheme === 'light'
                  ? "bg-gray-100 border-gray-300"
                  : "bg-zinc-950 border border-zinc-800"
              )}>
                <span className="text-3xl">✨</span>
              </div>
              <h2 className={`text-2xl font-semibold ${colors.text} mb-4 tracking-tight`}>Welcome</h2>
              <p className={`${colors.textSecondary} max-w-md leading-relaxed text-base`}>
                Hi! I'm your personal content strategist and assistant. Tell me your goal, topic, or paste a script—I'll help you plan, write, or refine with emotional clarity.
              </p>
              <div className={`mt-8 text-sm ${colors.textTertiary} font-light`}>
                Start typing to begin
              </div>
            </div>
          )}

          {/* Sign-in Prompt for Anonymous Users */}
          {showSignInPrompt && (
            <div className="flex items-start gap-3 mb-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="h-9 w-9 flex items-center justify-center shrink-0 mt-1 ml-4">
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-amber-200 to-orange-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-800">⏰</span>
                </div>
              </div>
              <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm font-semibold text-amber-700">Session Expired</span>
                </div>
                <p className="text-sm text-amber-800 mb-3">
                  Your anonymous session has expired. Sign in to save your chats and continue your story development.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSignInPrompt(false)}
                    className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
                  >
                    Continue Anonymously
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Navigate to sign-in page
                    }}
                    className="px-3 py-1 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              role={message.role}
              content={message.content}
              showActionButtons={shouldShowActionButtons(message.content, message.role)}
              onLogin={handleLogin}
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

              {/* Composer - Fixed at bottom, theme-aware */}
              <div className={`border-t ${colors.border} ${colors.background} relative z-10 mt-auto`}>
                <div className="w-full overflow-hidden">
                  <Composer 
                    onSend={handleSendMessage} 
                    disabled={isLoading || isProcessingMessage} 
                    sessionId={isAuthenticated ? (currentSessionId || hookSessionId || undefined) : (hookSessionId || sessionIdRef.current || undefined)} 
                    projectId={isAuthenticated ? (currentProjectId || hookProjectId || undefined) : (hookProjectId || (typeof window !== 'undefined' ? localStorage.getItem('anonymous_project_id') : null) || undefined)}
                    editContent={editContent}
                    isEditing={isEditing}
                    onEditComplete={handleEditComplete}
                    editAttachedFiles={editAttachedFiles}
                  />
                </div>
              </div>
    </div>
  )
}
