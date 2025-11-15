import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { text, session_id, project_id, attached_files, edit_from_message_id, enable_web_search } = await req.json()
    
    // Get headers from the request
    const xSessionId = req.headers.get('X-Session-ID')
    const xUserId = req.headers.get('X-User-ID')
    const xProjectId = req.headers.get('X-Project-ID') || project_id // Fallback to body if header not present
    
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`Frontend: Attempting to call backend at ${backendUrl}/api/v1/chat`)
    console.log(`Frontend: Headers - X-Session-ID: ${xSessionId}, X-User-ID: ${xUserId}, X-Project-ID: ${xProjectId}`)
    if (edit_from_message_id) {
      console.log(`Frontend: Edit mode - deleting from message_id: ${edit_from_message_id}`)
    }
    
    // Try to call the backend with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(xUserId && { 'X-User-ID': xUserId }),
          ...(xSessionId && { 'X-Session-ID': xSessionId }),
          ...(xProjectId && { 'X-Project-ID': xProjectId }),
        },
        body: JSON.stringify({ text, session_id, project_id: xProjectId || project_id, attached_files, edit_from_message_id, enable_web_search: enable_web_search || false }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      console.log(`Frontend: Backend response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Backend error: ${response.status} - ${errorText}`)
        throw new Error(`Backend responded with status: ${response.status}`)
      }
      
      // Return the backend response with proper headers for streaming
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Backend fetch failed:', fetchError)
      
      // Return a fallback response
      const fallbackResponse = `I received your message: "${text}". I'm currently having trouble connecting to my AI backend, but I'm here to help you create amazing short-form content! 🎬

Let's get started - what type of content are you creating today?`
      
      return new Response(
        `data: ${JSON.stringify({ type: 'content', content: fallbackResponse, done: true })}\n\n`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        }
      )
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
