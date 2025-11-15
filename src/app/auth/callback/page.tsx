'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, ArrowLeft, Mail } from 'lucide-react'
import { isAdminEmail, getAdminRedirectPath, getDefaultRedirectPath } from '@/lib/admin-utils'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // First, let Supabase handle the URL parameters (email confirmation)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage(error.message)
          return
        }

        // If we have a session, the email was confirmed successfully
        if (data.session) {
          setStatus('success')
          setMessage('Welcome!')
          
          // Redirect admins to admin panel, others to chat
          const userEmail = data.session.user?.email
          const redirectPath = isAdminEmail(userEmail)
            ? getAdminRedirectPath()
            : getDefaultRedirectPath()
          
          setTimeout(() => {
            router.push(redirectPath)
          }, 2000)
        } else {
          // No session found - this could mean:
          // 1. Email confirmation failed
          // 2. User already confirmed and session expired
          // 3. Invalid confirmation link
          
          // Let's try to get the current URL to see if there are confirmation parameters
          const urlParams = new URLSearchParams(window.location.search)
          const tokenHash = urlParams.get('token_hash')
          const type = urlParams.get('type')
          
          if (tokenHash && type) {
            // We have confirmation parameters, try to verify them
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as 'email'
            })
            
            if (verifyError) {
              console.error('Email verification error:', verifyError)
              setStatus('error')
              setMessage('The confirmation link has expired or is invalid.')
            } else if (verifyData.session) {
              setStatus('success')
              setMessage('Welcome!')
              
              // Redirect admins to admin panel, others to chat
              const userEmail = verifyData.session.user?.email
              const redirectPath = isAdminEmail(userEmail)
                ? getAdminRedirectPath()
                : getDefaultRedirectPath()
              
              setTimeout(() => {
                router.push(redirectPath)
              }, 2000)
            } else {
              setStatus('error')
              setMessage('Email verification completed but no session was created.')
            }
          } else {
            setStatus('error')
            setMessage('No confirmation link found. Please try signing up again.')
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 gap-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center flex flex-col gap-4 items-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-linear-to-br from-blue-500 via-sky-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/30">
            <span className="text-3xl text-white font-bold">SW</span>
          </div>

          {/* Status Content */}
          {status === 'loading' && (
            <div className="space-y-6 flex flex-col gap-4">
              <div className="flex gap-2 items-end justify-center">
                <div className="relative">
                  <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-7 h-7 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <h1 className="text-2xl font-bold text-blue-400 mb-3">Confirming your email</h1>
              </div>
              <p className="text-blue-400 text-lg mb-2">Please wait while we verify your email address...</p>
              
              <div className="space-y-3 px-6 py-9">
                <div className="flex items-center justify-center gap-2 text-blue-200/60">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Checking your inbox</span>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6 flex flex-col gap-4">
              <div className="flex gap-2 items-end justify-center">
                <CheckCircle className="text-white w-7 h-7 bg-linear-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30" />
                <h1 className="text-2xl font-bold text-emerald-400 mb-3">Email Confirmed!</h1>
              </div>
              <p className="text-emerald-400 text-lg mb-2">{message}</p>
              
              <div className="space-y-3 px-6 py-9">
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div className="bg-linear-to-r from-emerald-500 to-green-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-emerald-200/60 text-sm">Redirecting to your dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 flex flex-col gap-4">
              <div className="flex gap-2 items-end justify-center">
                <XCircle className="text-white w-7 h-7 bg-linear-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30" />
                <h1 className="text-2xl font-bold text-red-400 mb-3">Confirmation Failed</h1>
              </div>
              <p className="text-red-400 text-lg mb-2">{message}</p>
              
              <div className="space-y-3 px-6 py-9">
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full flex items-center justify-center gap-2 text-blue-200/80 hover:text-blue-200 text-sm font-medium py-2 transition-colors hover:cursor-pointer hover:scale-105 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        
      </div>
    </div>
  )
}
