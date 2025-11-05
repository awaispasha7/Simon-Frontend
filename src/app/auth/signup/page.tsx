'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to login page - signup is not available for single client system
    router.replace('/auth/login')
  }, [router])

  return null
}
