import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const requestId = Date.now().toString()
  console.log(`🎤 [${requestId}] ========== TRANSCRIPTION REQUEST START ==========`)
  
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`🎤 [${requestId}] Backend URL: ${backendUrl}`)
    
    // Get the original Content-Type header (includes the boundary)
    const contentType = req.headers.get('content-type')
    console.log(`🎤 [${requestId}] Original Content-Type: ${contentType}`)
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.error(`🎤 [${requestId}] ❌ Invalid Content-Type: ${contentType}`)
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      )
    }

    // Forward the raw request body directly to preserve the multipart boundary
    // This is the only reliable way to forward multipart data in serverless environments
    console.log(`🎤 [${requestId}] Reading raw request body...`)
    const requestBody = await req.arrayBuffer()
    console.log(`🎤 [${requestId}] Request body size: ${requestBody.byteLength} bytes`)

    console.log(`🎤 [${requestId}] Sending request to backend: ${backendUrl}/transcribe`)
    const fetchStartTime = Date.now()
    
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: requestBody,
      headers: {
        'Content-Type': contentType, // Preserve the original boundary
      },
    })
    
    const fetchDuration = Date.now() - fetchStartTime
    console.log(`🎤 [${requestId}] Backend response received in ${fetchDuration}ms`)
    console.log(`🎤 [${requestId}] Response status: ${response.status} ${response.statusText}`)
    console.log(`🎤 [${requestId}] Response headers:`, {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    })

    if (!response.ok) {
      console.error(`🎤 [${requestId}] ❌ Backend returned error status: ${response.status}`)
      let errorData
      try {
        const responseText = await response.text()
        console.error(`🎤 [${requestId}] Error response text (first 500 chars):`, responseText.substring(0, 500))
        
        // Try to parse as JSON
        try {
          errorData = JSON.parse(responseText)
          console.error(`🎤 [${requestId}] Parsed error data:`, errorData)
        } catch {
          // If not JSON, create error object from text
          errorData = { detail: responseText || `Backend responded with status ${response.status}` }
          console.error(`🎤 [${requestId}] Error is not JSON, using raw text`)
        }
      } catch (e) {
        console.error(`🎤 [${requestId}] Failed to read error response:`, e)
        errorData = { detail: `Backend responded with status ${response.status}` }
      }
      console.error(`🎤 [${requestId}] ========== TRANSCRIPTION REQUEST FAILED ==========`)
      return NextResponse.json(errorData, { status: response.status })
    }

    console.log(`🎤 [${requestId}] ✅ Backend returned success status`)
    const responseText = await response.text()
    console.log(`🎤 [${requestId}] Response text length: ${responseText.length} characters`)
    console.log(`🎤 [${requestId}] Response text (first 200 chars):`, responseText.substring(0, 200))
    
    let data
    try {
      data = JSON.parse(responseText)
      console.log(`🎤 [${requestId}] ✅ Response parsed as JSON successfully`)
      console.log(`🎤 [${requestId}] Transcript preview:`, data.transcript?.substring(0, 100) || 'No transcript field')
    } catch (e) {
      console.warn(`🎤 [${requestId}] ⚠️ Response is not JSON, treating as plain text:`, e)
      data = { transcript: responseText, success: true }
    }
    
    console.log(`🎤 [${requestId}] ========== TRANSCRIPTION REQUEST SUCCESS ==========`)
    return NextResponse.json(data)

  } catch (error) {
    console.error(`🎤 [${requestId}] ❌❌❌ EXCEPTION IN TRANSCRIPTION ROUTE ❌❌❌`)
    console.error(`🎤 [${requestId}] Error type:`, error instanceof Error ? error.constructor.name : typeof error)
    console.error(`🎤 [${requestId}] Error message:`, error instanceof Error ? error.message : String(error))
    console.error(`🎤 [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    console.error(`🎤 [${requestId}] Full error object:`, error)
    console.error(`🎤 [${requestId}] ========== TRANSCRIPTION REQUEST FAILED ==========`)
    return NextResponse.json(
      { error: 'Failed to process transcription request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
