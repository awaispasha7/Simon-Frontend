import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`Frontend API: Forwarding transcription request to backend at ${backendUrl}/transcribe`)

    // Get the Content-Type header from the original request (includes boundary)
    const contentType = req.headers.get('content-type')
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )
    }

    // Forward the raw request body directly to preserve the boundary
    // This avoids any FormData parsing/serialization issues
    const requestBody = await req.arrayBuffer()
    
    console.log(`Frontend API: Forwarding ${requestBody.byteLength} bytes with content-type: ${contentType}`)
    
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': contentType, // Preserve the original boundary
      },
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
