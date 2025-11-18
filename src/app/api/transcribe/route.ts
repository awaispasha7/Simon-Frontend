import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const requestId = Date.now().toString()
  console.log(`🎤 [${requestId}] ========== TRANSCRIPTION REQUEST START ==========`)
  
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    
    console.log(`🎤 [${requestId}] Backend URL: ${backendUrl}`)
    console.log(`🎤 [${requestId}] Request headers:`, {
      'content-type': req.headers.get('content-type'),
      'content-length': req.headers.get('content-length'),
      'user-agent': req.headers.get('user-agent'),
    })

    // Parse the incoming FormData
    console.log(`🎤 [${requestId}] Parsing incoming FormData...`)
    const formData = await req.formData()
    console.log(`🎤 [${requestId}] FormData parsed successfully`)
    console.log(`🎤 [${requestId}] FormData entries:`, Array.from(formData.entries()).map(([key, value]) => ({
      key,
      valueType: value instanceof File ? 'File' : typeof value,
      fileName: value instanceof File ? value.name : 'N/A',
      fileSize: value instanceof File ? value.size : 'N/A',
      fileType: value instanceof File ? value.type : 'N/A',
    })))
    
    const audioFile = formData.get('audio_file') as File | null
    
    if (!audioFile) {
      console.error(`🎤 [${requestId}] ❌ No audio file found in FormData`)
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    console.log(`🎤 [${requestId}] Audio file details:`, {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified,
    })

    // Read the file as ArrayBuffer to reconstruct it properly for serverless
    console.log(`🎤 [${requestId}] Reading file as ArrayBuffer...`)
    const fileBuffer = await audioFile.arrayBuffer()
    console.log(`🎤 [${requestId}] File read successfully: ${fileBuffer.byteLength} bytes`)
    
    // Create a new FormData with the file blob for the backend
    console.log(`🎤 [${requestId}] Creating new FormData for backend...`)
    const backendFormData = new FormData()
    const fileBlob = new Blob([fileBuffer], { type: audioFile.type || 'audio/webm' })
    backendFormData.append('audio_file', fileBlob, audioFile.name || 'recording.webm')
    console.log(`🎤 [${requestId}] Backend FormData created with blob size: ${fileBlob.size} bytes`)

    console.log(`🎤 [${requestId}] Sending request to backend: ${backendUrl}/transcribe`)
    const fetchStartTime = Date.now()
    
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: 'POST',
      body: backendFormData,
      // Don't set Content-Type - fetch will set it automatically with correct boundary
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
