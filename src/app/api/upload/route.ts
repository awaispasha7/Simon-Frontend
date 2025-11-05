import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    console.log(`📤 Received ${files.length} file(s) for upload`)

    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://simon-backend-blond.vercel.app'

    // Forward files to backend
    const backendFormData = new FormData()
    files.forEach(file => {
      backendFormData.append('files', file)
    })

    console.log(`🔄 Forwarding to backend: ${backendUrl}/api/v1/upload`)

    // Forward session headers from the request
    const headers: Record<string, string> = {}
    const sessionId = req.headers.get('X-Session-ID')
    const projectId = req.headers.get('X-Project-ID')
    const userId = req.headers.get('X-User-ID')
    
    if (sessionId) headers['X-Session-ID'] = sessionId
    if (projectId) headers['X-Project-ID'] = projectId
    if (userId) headers['X-User-ID'] = userId
    
    console.log('🔄 Forwarding headers:', headers)

    const response = await fetch(`${backendUrl}/api/v1/upload`, {
      method: 'POST',
      body: backendFormData,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Backend upload error: ${response.status} - ${errorText}`)
      throw new Error(`Backend upload failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Upload successful:', data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload files', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

