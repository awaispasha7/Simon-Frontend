// Google OAuth configuration and utilities
// This file contains the setup for Google OAuth integration

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
  given_name: string
  family_name: string
}

export const initializeGoogleAuth = () => {
  if (typeof window === 'undefined') return

  // Load Google Identity Services library
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  document.head.appendChild(script)

  return new Promise<void>((resolve) => {
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        })
        resolve()
      }
    }
  })
}

export const handleGoogleResponse = (response: { credential: string }) => {
  // Decode the JWT token
  const payload = JSON.parse(atob(response.credential.split('.')[1]))
  
  const googleUser: GoogleUser = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    given_name: payload.given_name,
    family_name: payload.family_name,
  }

  // You can dispatch this to your auth context or handle it as needed
  return googleUser
}

export const renderGoogleButton = (elementId: string) => {
  if (typeof window === 'undefined' || !window.google) return

  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'continue_with',
      shape: 'rectangular',
    }
  )
}

// Extend Window interface for Google
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement | null, config: object) => void
        }
      }
    }
  }
}
