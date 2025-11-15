'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import { isAdminEmail, getAdminRedirectPath, getDefaultRedirectPath } from '@/lib/admin-utils'
import '../auth-styles.css'


export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '', remember: false })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) =>
      login(data.email, data.password),
    onSuccess: () => {
      setShowSuccess(true)
      setTimeout(() => {
        // Redirect admins to admin panel, others to chat
        const redirectPath = isAdminEmail(formData.email) 
          ? getAdminRedirectPath() 
          : getDefaultRedirectPath()
        router.push(redirectPath)
      }, 3000)
    },
    onError: (err: Error) => {
      setErrors({ general: err.message || 'Login failed. Please try again.' })
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  })

  const validateEmail = (email: string) => {
    if (!email) return { isValid: false, message: 'Email is required' }
    if (!/\S+@\S+\.\S+/.test(email)) return { isValid: false, message: 'Enter a valid email' }
    return { isValid: true, message: '' }
  }

  const validatePassword = (password: string) => {
    if (!password) return { isValid: false, message: 'Password is required' }
    if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters' }
    return { isValid: true, message: '' }
  }

  const validateField = (fieldName: string, value: string) => {
    let result
    switch (fieldName) {
      case 'email':
        result = validateEmail(value)
        break
      case 'password':
        result = validatePassword(value)
        break
      default:
        result = { isValid: true, message: '' }
    }

    if (result.isValid) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    } else {
      setErrors(prev => ({ ...prev, [fieldName]: result.message }))
    }

    return result.isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailValid = validateField('email', formData.email)
    const passwordValid = validateField('password', formData.password)
    
    if (emailValid && passwordValid) {
      loginMutation.mutate({ email: formData.email, password: formData.password })
    } else {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (typeof value === 'string' && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSocialLogin = (provider: string) => {
    console.log(`Connecting to ${provider}...`)
    // Add your social login logic here
    if (provider === 'Facebook') {
      // TODO: Implement Facebook OAuth
      console.log('Facebook login not yet implemented')
    } else if (provider === 'X') {
      // TODO: Implement X (Twitter) OAuth
      console.log('X login not yet implemented')
    } else if (provider === 'Google') {
      // TODO: Implement Google OAuth
      console.log('Google login not yet implemented')
    }
  }

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault()
    // Navigate to forgot password page
    router.push('/auth/forgot-password')
  }

  const handleSignupLink = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/auth/signup')
  }

  return (
    <div className="auth-container">
      <div className="auth-card-container">
        <div className={`auth-card ${isShaking ? 'animate-shake' : ''}`}>
          {!showSuccess ? (
            <>
              {/* Header */}
              <div className="auth-header">
                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Sign in to your account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => validateField('email', formData.email)}
                      className="auth-input"
                      placeholder=" "
                      autoComplete="email"
                    />
                    <label htmlFor="email" className="auth-label">
                      Email Address
                    </label>
                    <div className="auth-focus-border"></div>
                  </div>
                  {errors.email && (
                    <span className="auth-error-message show">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Password Field */}
                <div className="auth-form-group">
                  <div className="auth-input-wrapper auth-password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onBlur={() => validateField('password', formData.password)}
                      className="auth-input"
                      placeholder=" "
                      autoComplete="current-password"
                    />
                    <label htmlFor="password" className="auth-label">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className={`auth-eye-icon ${showPassword ? 'show-password' : ''}`}></span>
                    </button>
                    <div className="auth-focus-border"></div>
                  </div>
                  {errors.password && (
                    <span className="auth-error-message show">
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Form Options */}
                <div className="auth-form-options">
                  <label className="auth-remember-wrapper">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={formData.remember}
                      onChange={(e) => handleInputChange('remember', e.target.checked)}
                      className="auth-remember-wrapper input[type='checkbox']"
                    />
                    <span className="auth-checkbox-label">
                      <span className="auth-checkmark"></span>
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="auth-forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                    {errors.general}
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className={`auth-btn auth-login-btn ${loginMutation.isPending ? 'loading' : ''}`}
                >
                  <span className="auth-btn-text">Sign In</span>
                  <span className="auth-btn-loader"></span>
                </button>
              </form>

              {/* Divider */}
              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              {/* Social Login */}
              <div className="auth-social-login">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Facebook')}
                  className="auth-social-btn auth-social-btn-disabled"
                  disabled
                  title="Coming soon"
                >
                  <span className="auth-social-icon auth-facebook-icon"></span>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('X')}
                  className="auth-social-btn auth-social-btn-disabled"
                  disabled
                  title="Coming soon"
                >
                  <span className="auth-social-icon auth-x-icon"></span>
                  X
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="auth-social-btn auth-social-btn-disabled"
                  disabled
                  title="Coming soon"
                >
                  <span className="auth-social-icon auth-google-icon"></span>
                  Google
                </button>
              </div>

              {/* Continue without Login */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  className=" text-cyan-500! text-sm! hover:text-white! transition-all! focus:outline-none"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Continue to Chat without Login
                </button>
              </div>

              {/* Signup Link */}
              <div className="auth-signup-link">
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={handleSignupLink}
                    className="auth-signup-link a px-4 py-2 rounded-lg hover:scale-105 transition-all duration-200"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* Success Message */
            <div className="auth-success-message show">
              <div className="auth-success-icon">✓</div>
              <h3>Login Successful!</h3>
              <p>Redirecting to your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}