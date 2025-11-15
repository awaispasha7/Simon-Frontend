'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import '../auth-styles.css'


export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    agreeToTerms: false 
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const router = useRouter()
  const { signup } = useAuth()

  const signupMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      console.log('Signup attempt with data:', { email: data.email, display_name: data.name, password: '***' })
      return signup(data.email, data.password, data.name)
    },
    onSuccess: (data: unknown) => {
      console.log('Signup successful:', data)
      // Always show email confirmation message for signup
      setShowSuccess(true)
    },
    onError: (err: Error) => {
      console.error('Signup error:', err)
      setErrors({ general: err.message || 'Signup failed. Please try again.' })
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  })

  const validateName = (name: string) => {
    if (!name) return { isValid: false, message: 'Name is required' }
    if (name.length < 2) return { isValid: false, message: 'Name must be at least 2 characters' }
    return { isValid: true, message: '' }
  }

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

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) return { isValid: false, message: 'Please confirm your password' }
    if (confirmPassword !== formData.password) return { isValid: false, message: 'Passwords do not match' }
    return { isValid: true, message: '' }
  }

  const validateField = (fieldName: string, value: string) => {
    let result
    switch (fieldName) {
      case 'name':
        result = validateName(value)
        break
      case 'email':
        result = validateEmail(value)
        break
      case 'password':
        result = validatePassword(value)
        break
      case 'confirmPassword':
        result = validateConfirmPassword(value)
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
    
    const nameValid = validateField('name', formData.name)
    const emailValid = validateField('email', formData.email)
    const passwordValid = validateField('password', formData.password)
    const confirmPasswordValid = validateField('confirmPassword', formData.confirmPassword)
    
    if (!formData.agreeToTerms) {
      setErrors(prev => ({ ...prev, terms: 'You must agree to the terms and conditions' }))
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      return
    }
    
    if (nameValid && emailValid && passwordValid && confirmPasswordValid) {
      signupMutation.mutate({ 
        email: formData.email,
        name: formData.name, 
        password: formData.password 
      })
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

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/auth/login')
  }

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Navigate to terms page
    router.push('/terms')
  }

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Navigate to privacy page
    router.push('/privacy')
  }

  return (
    <div className="auth-container">
      <div className="auth-card-container">
        {/* Back Button */}
        {/* <button
          onClick={handleBackToLogin}
          className="auth-back-button"
        >
          ← Back to Login
        </button> */}

        <div className={`auth-card ${isShaking ? 'animate-shake' : ''}`}>
          {!showSuccess ? (
            <>
              {/* Header */}
              <div className="auth-header">
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join Chat and start your journey</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onBlur={() => validateField('name', formData.name)}
                      className="auth-input"
                      placeholder=" "
                      autoComplete="name"
                    />
                    <label htmlFor="name" className="auth-label">
                      Full Name
                    </label>
                    <div className="auth-focus-border"></div>
                  </div>
                  {errors.name && (
                    <span className="auth-error-message show">
                      {errors.name}
                    </span>
                  )}
                </div>

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
                      autoComplete="new-password"
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

                {/* Confirm Password Field */}
                <div className="auth-form-group">
                  <div className="auth-input-wrapper auth-password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
                      className="auth-input"
                      placeholder=" "
                      autoComplete="new-password"
                    />
                    <label htmlFor="confirmPassword" className="auth-label">
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="auth-password-toggle"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className={`auth-eye-icon ${showConfirmPassword ? 'show-password' : ''}`}></span>
                    </button>
                    <div className="auth-focus-border"></div>
                  </div>
                  {errors.confirmPassword && (
                    <span className="auth-error-message show">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Terms Agreement */}
                <div className="auth-terms-wrapper">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                    className="auth-terms-checkbox"
                  />
                  <label htmlFor="agreeToTerms" className="auth-terms-label">
                    <span className="auth-terms-checkmark"></span>
                    I agree to the{' '}
                    <button type="button" onClick={handleTermsClick} className="auth-terms-link">
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button type="button" onClick={handlePrivacyClick} className="auth-terms-link">
                      Privacy Policy
                    </button>
                  </label>
                </div>
                {errors.terms && (
                  <span className="auth-error-message show">
                    {errors.terms}
                  </span>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                    {errors.general}
                  </div>
                )}

                {/* Signup Button */}
                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className={`auth-btn auth-login-btn ${signupMutation.isPending ? 'loading' : ''}`}
                >
                  <span className="auth-btn-text">Create Account</span>
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

              {/* Continue without Signup */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  className=" text-cyan-500! text-sm! hover:text-white! transition-all! focus:outline-none"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Continue to Chat without Signup
                </button>
              </div>

              {/* Login Link */}
              <div className="auth-signup-link">
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={handleBackToLogin}
                    className="auth-signup-link a px-4 py-2 rounded-lg hover:scale-105 transition-all duration-200"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* Success Message */
            <div className="auth-success-message show">
              <div className="auth-success-icon">📧</div>
              <h3>Check Your Email!</h3>
              <p>We've sent you a confirmation link. Please check your email and click the link to activate your account.</p>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="auth-back-button"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}