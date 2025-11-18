import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`Frontend API: Forwarding transcription request to backend at ${backendUrl}/transcribe`)

    // Reconstruct FormData to ensure proper boundary handling
    const audioFile = formData.get('audio_file') as File
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Create new FormData with the file
    const backendFormData = new FormData()
    backendFormData.append('audio_file', audioFile, audioFile.name || 'recording.webm')
    
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: backendFormData,
      // Don't set Content-Type - fetch will set it automatically with correct boundary
    })

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

  } catch (error) {
    console.error('Frontend API transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to process transcription request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
