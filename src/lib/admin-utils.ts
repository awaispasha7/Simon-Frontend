/**
 * Utility functions for admin access control
 */

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [
    'admin@storieswetell.ai' // Default test admin account
  ]
  
  return adminEmails.some(adminEmail => 
    adminEmail.trim().toLowerCase() === email.toLowerCase()
  )
}

export function getAdminRedirectPath(): string {
  return '/admin'
}

export function getDefaultRedirectPath(): string {
  return '/chat'
}
