import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`Frontend API: Forwarding transcription request to backend at ${backendUrl}/transcribe`)

    // Parse the form data
    const formData = await req.formData()
    const audioFile = formData.get('audio_file') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log(`Frontend API: Received file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`)

    // Read the file as a blob to ensure proper serialization in serverless environment
    const fileBuffer = await audioFile.arrayBuffer()
    const fileBlob = new Blob([fileBuffer], { type: audioFile.type || 'audio/webm' })

    // Reconstruct FormData for backend
    const backendFormData = new FormData()
    backendFormData.append('audio_file', fileBlob, audioFile.name || 'recording.webm')
    
    console.log(`Frontend API: Forwarding ${fileBuffer.byteLength} bytes to backend`)
    
    // Use a timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
    
    try {
      console.log(`Frontend API: Attempting fetch to ${backendUrl}/transcribe`)
      
      const response = await fetch(`${backendUrl}/transcribe`, {
        method: 'POST',
        body: backendFormData,
        signal: controller.signal,
        // Don't set Content-Type - fetch will set it automatically with correct boundary
      })
      
      clearTimeout(timeoutId)
      console.log(`Frontend API: Backend responded with status ${response.status}`)

      if (!response.ok) {
        let errorData
        try {
          const responseText = await response.text()
          console.log('Backend response text:', responseText)
          
          // Try to parse as JSON
          try {
            errorData = JSON.parse(responseText)
          } catch {
            // If not JSON, create error object from text
            errorData = { detail: responseText || `Backend responded with status ${response.status}` }
          }
        } catch {
          errorData = { detail: `Backend responded with status ${response.status}` }
        }
        console.error('Backend transcription error:', errorData)
        return NextResponse.json(errorData, { status: response.status })
      }

      const responseText = await response.text()
      console.log('Backend response text:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch {
        data = { transcript: responseText, success: true }
      }
      
      console.log('Backend transcription successful:', data)
      return NextResponse.json(data)
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Backend transcription fetch failed:', fetchError)
      console.error('Fetch error type:', fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError)
      console.error('Fetch error message:', fetchError instanceof Error ? fetchError.message : String(fetchError))
      console.error('Fetch error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack')
      
      // Check if it's an abort error (timeout)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Transcription request timed out', details: 'The request took too long to complete' },
          { status: 504 }
        )
      }
      
      // Check if it's a network/connection error
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError)
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        return NextResponse.json(
          { 
            error: 'Failed to connect to transcription service', 
            details: `Cannot reach backend at ${backendUrl}. Please check if the backend is running and the URL is correct.`,
            backendUrl: backendUrl
          },
          { status: 503 }
        )
      }
      
      // Return the actual error for debugging
      return NextResponse.json(
        { 
          error: 'Transcription request failed', 
          details: errorMessage,
          type: fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Frontend API transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to process transcription request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
