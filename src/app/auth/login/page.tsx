'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import '../auth-styles.css'


export default function LoginPage() {
  // Check if remember me was previously set
  const remembered = typeof window !== 'undefined' ? localStorage.getItem('remember_me') === 'true' : false
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    remember: remembered 
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) =>
      login(data.username, data.password),
    onSuccess: () => {
      // Store remember me preference
      if (formData.remember) {
        localStorage.setItem('remember_me', 'true')
      } else {
        localStorage.removeItem('remember_me')
      }
      // Redirect immediately after successful login
      router.push('/chat')
    },
    onError: (err: Error) => {
      setErrors({ general: err.message || 'Login failed. Please try again.' })
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }
  })

  const validateUsername = (username: string) => {
    if (!username) return { isValid: false, message: 'Username is required' }
    return { isValid: true, message: '' }
  }

  const validatePassword = (password: string) => {
    if (!password) return { isValid: false, message: 'Password is required' }
    return { isValid: true, message: '' }
  }

  const validateField = (fieldName: string, value: string) => {
    let result
    switch (fieldName) {
      case 'username':
        result = validateUsername(value)
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
    
    const usernameValid = validateField('username', formData.username)
    const passwordValid = validateField('password', formData.password)
    
    if (usernameValid && passwordValid) {
      loginMutation.mutate({ username: formData.username, password: formData.password })
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



  return (
    <div className={`auth-container ${resolvedTheme === 'dark' ? 'dark' : 'light'}`}>
      <div className="auth-card-container">
        <div className={`auth-card ${isShaking ? 'animate-shake' : ''}`}>
          {!showSuccess ? (
            <>
              {/* Header */}
              <div className="auth-header">
                <h2 className="auth-title">Welcome</h2>
                <p className="auth-subtitle">Sign in to your personal AI assistant</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="auth-form-group">
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      onBlur={() => validateField('username', formData.username)}
                      className={`auth-input ${formData.username ? 'has-value' : ''}`}
                      placeholder=" "
                      autoComplete="username"
                    />
                    <label htmlFor="username" className={`auth-label ${formData.username ? 'has-value' : ''}`}>
                      Username
                    </label>
                    <div className="auth-focus-border"></div>
                  </div>
                  {errors.username && (
                    <span className="auth-error-message show">
                      {errors.username}
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
                      className={`auth-input ${formData.password ? 'has-value' : ''}`}
                      placeholder=" "
                      autoComplete="current-password"
                    />
                    <label htmlFor="password" className={`auth-label ${formData.password ? 'has-value' : ''}`}>
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