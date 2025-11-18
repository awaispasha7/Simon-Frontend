import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio_file') as File | null
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`Transcribing audio: ${audioFile.name}, size: ${audioFile.size}, type: ${audioFile.type}`)

    // Create a fresh FormData with the file
    // This avoids boundary corruption issues with forwarding
    const newFormData = new FormData()
    
    // Convert File to Blob to ensure clean transfer
    const blob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type || 'audio/webm' })
    newFormData.append('audio_file', blob, audioFile.name || 'recording.webm')

    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: newFormData,
    })

    if (!response.ok) {
      let errorData
      try {
        const responseText = await response.text()
        console.error('Backend error response:', responseText)
        
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { detail: responseText || `Backend error: ${response.status}` }
        }
      } catch {
        errorData = { detail: `Backend error: ${response.status}` }
      }
      return NextResponse.json(errorData, { status: response.status })
    }

    const responseText = await response.text()
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { transcript: responseText, success: true }
    }
    
    console.log('Transcription successful')
    return NextResponse.json(data)

  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
