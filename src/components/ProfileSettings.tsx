'use client'

import { useState, useEffect } from 'react'
import { Settings, User, Save, X } from 'lucide-react'
import { ProfilePictureUpload } from './ProfilePictureUpload'
import { useAuth } from '@/lib/auth-context'
import { useProfile } from '@/lib/profile-context'

interface ProfileSettingsProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'chat' | 'account'
}

export function ProfileSettings({ isOpen, onClose, initialTab = 'chat' }: ProfileSettingsProps) {
  const { profile, updateUserImage, updateUserName } = useProfile()
  const { user, updateProfile, logout, changePassword, changeEmail, deleteAccount } = useAuth()
  const [tempName, setTempName] = useState(profile.userName)
  const [tempImage, setTempImage] = useState<string | null>(profile.userImage)
  const [activeTab, setActiveTab] = useState<'chat' | 'account'>(initialTab)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' })
  const [newEmail, setNewEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  const handleSave = async () => {
    updateUserName(tempName)
    updateUserImage(tempImage || '')
    try {
      await updateProfile({ display_name: tempName, avatar_url: tempImage || undefined })
    } catch (e) {
      console.warn('Profile save warning:', e)
    }
    onClose()
  }

  const handleCancel = () => {
    setTempName(profile.userName)
    setTempImage(profile.userImage)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="!fixed !inset-0 !bg-black/50 !backdrop-blur-sm !flex !items-center !justify-center !z-50 !p-3 sm:!p-4 !overflow-y-auto">
      <div className="!w-full !max-w-2xl !bg-white !shadow-2xl !rounded-xl sm:!rounded-2xl !overflow-hidden !max-h-[95vh] sm:!max-h-[90vh] !flex !flex-col !my-auto">
        {/* Header */}
        <div className="!relative !bg-linear-to-r !from-red-600 !to-orange-600 !px-4 sm:!px-6 !py-4 sm:!py-5 !space-y-3 sm:!space-y-4 !flex-shrink-0">
          <div className="!flex !items-center !justify-between !gap-3">
            <div className="!flex !items-center !gap-2.5 sm:!gap-3 !flex-1 !min-w-0">
              <div className="!p-2 !bg-white/10 !backdrop-blur-sm !rounded-lg !flex-shrink-0">
                <Settings className="!w-5 !h-5 !text-white" />
              </div>
              <div className="!flex-1 !min-w-0">
                <h2 className="!text-lg sm:!text-xl !font-semibold !text-white !leading-tight">Settings</h2>
                <p className="!text-red-100 !text-xs sm:!text-sm !mt-0.5 !leading-tight !line-clamp-1">Manage your profile and preferences</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="!h-10 !w-10 !flex-shrink-0 hover:!bg-white/10 active:!bg-white/20 !transition-colors !rounded-lg !flex !items-center !justify-center !group !touch-manipulation"
              aria-label="Close settings"
            >
              <X className="!h-5 !w-5 !text-white" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="!mt-4 sm:!mt-6 !flex !gap-1 sm:!gap-4 !justify-stretch sm:!justify-evenly !border-b !border-white/20">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={`!flex-1 sm:!flex-none !px-4 !py-3 !text-sm !font-medium !transition-all focus:!outline-none !relative hover:!cursor-pointer !min-h-[48px] !flex !items-center !justify-center !touch-manipulation
                ${activeTab === 'chat'
                  ? '!text-white'
                  : '!text-red-200 active:!text-white'}
              `}
              onClick={() => setActiveTab('chat')}
            >
              <span className="!whitespace-nowrap">Chat Profile</span>
              {activeTab === 'chat' && (
                <div className="!absolute !bottom-0 !left-0 !right-0 !h-0.5 !bg-white !rounded-full" />
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'account'}
              className={`!flex-1 sm:!flex-none !px-4 !py-3 !text-sm !font-medium !transition-all focus:!outline-none !relative hover:!cursor-pointer !min-h-[48px] !flex !items-center !justify-center !touch-manipulation
                ${activeTab === 'account'
                  ? '!text-white'
                  : '!text-red-200 active:!text-white'}
              `}
              onClick={() => setActiveTab('account')}
            >
              <span className="!whitespace-nowrap">Account</span>
              {activeTab === 'account' && (
                <div className="!absolute !bottom-0 !left-0 !right-0 !h-0.5 !bg-white !rounded-full" />
              )}
            </button>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="!p-4 sm:!p-6 !bg-white !overflow-y-auto !flex-1 !pb-6">
          {activeTab === 'chat' && (
          <div className="!space-y-5 sm:!space-y-6">
            {/* Profile Picture Section */}
            <div className="!flex !flex-col !items-center !space-y-3 !py-2">
              <div className="!relative">
                <ProfilePictureUpload
                  currentImage={tempImage}
                  onImageChange={setTempImage}
                  size="lg"
                />
              </div>
              
              <div className="!text-center !space-y-2.5 !w-full">
                <p className="!text-xs !text-gray-500 !px-4">
                  Supported: JPG, PNG, GIF (max 5MB)
                </p>
                {tempImage && (
                  <button
                    onClick={() => setTempImage(null)}
                    className="!text-sm !text-red-600 hover:!text-red-700 active:!text-red-800 !font-medium !transition-colors !flex !items-center !gap-1.5 !mx-auto !min-h-[44px] !px-4 !py-2 !rounded-lg hover:!bg-red-50 active:!bg-red-100 !touch-manipulation"
                  >
                    <X className="!w-4 !h-4" />
                    Remove Picture
                  </button>
                )}
              </div>
            </div>

             {/* Display Name */}
             <div className="!space-y-2.5">
               <label htmlFor="userName" className="!text-sm !font-medium !text-gray-700 !flex !items-center !gap-2">
                 <User className="!w-4 !h-4 !text-gray-500 !flex-shrink-0" />
                 <span>Display Name</span>
               </label>
               <input
                 id="userName"
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 placeholder="Enter your display name"
                 className="!w-full !h-12 !rounded-lg !border !border-gray-300 !bg-white !px-4 !py-3 !text-base !placeholder:!text-gray-400 focus:!outline-none focus:!ring-2 focus:!ring-red-500 focus:!border-red-500 hover:!border-gray-400 !transition-all !shadow-sm !touch-manipulation"
               />
              <p className="!text-xs !text-gray-500 !mt-1">
                This name appears in your chat messages
              </p>
            </div>

            {/* Action Buttons */}
            <div className="!flex !flex-col sm:!flex-row !gap-3 !pt-4 !sticky !bottom-0 !bg-white !pb-2 sm:!pb-0 sm:!relative sm:!bg-transparent">
              <button
                onClick={handleSave}
                className="!flex-1 !bg-red-600 hover:!bg-red-700 active:!bg-red-800 !text-white !font-medium !py-3.5 !rounded-lg !transition-colors !flex !items-center !justify-center !gap-2 !shadow-md hover:!shadow-lg active:!shadow-sm !min-h-[48px] !text-base !touch-manipulation"
              >
                <Save className="!w-4 !h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="!flex-1 !border-2 !border-gray-300 hover:!bg-gray-50 active:!bg-gray-100 !text-gray-700 !font-medium !py-3.5 !rounded-lg !transition-colors active:!scale-[0.98] !min-h-[48px] !text-base !touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
          )}

          {activeTab === 'account' && (
            <div className="!space-y-5 sm:!space-y-6">
              {/* Email Section */}
              <div className="!space-y-2.5">
                <label className="!text-sm !font-medium !text-gray-700 !block">Email Address</label>
                {showEmailChange ? (
                  <div className="!space-y-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={user?.email || 'Enter new email'}
                      autoComplete="email"
                      className="!w-full !h-12 !px-4 !rounded-lg !border !border-gray-300 !bg-white !text-base focus:!ring-2 focus:!ring-red-500 focus:!border-red-500 hover:!border-gray-400 !transition-all !shadow-sm !touch-manipulation"
                    />
                    <div className="!flex !flex-col sm:!flex-row !gap-2.5">
                      <button
                        onClick={async () => {
                          if (!newEmail || newEmail === user?.email) {
                            setShowEmailChange(false)
                            return
                          }
                          setIsLoading(true)
                          setError(null)
                          try {
                            await changeEmail(newEmail)
                            setShowEmailChange(false)
                            setNewEmail('')
                          } catch (err: any) {
                            setError(err.message || 'Failed to change email')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                        disabled={isLoading || !newEmail || newEmail === user?.email}
                        className="!flex-1 !px-4 !py-3.5 !bg-red-600 !text-white !rounded-lg hover:!bg-red-700 active:!bg-red-800 disabled:!opacity-50 disabled:!cursor-not-allowed !min-h-[48px] !text-base !font-medium !shadow-md hover:!shadow-lg active:!shadow-sm !touch-manipulation"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setShowEmailChange(false)
                          setNewEmail('')
                          setError(null)
                        }}
                        className="!flex-1 !px-4 !py-3.5 !border-2 !border-gray-300 !rounded-lg hover:!bg-gray-50 active:!bg-gray-100 !min-h-[48px] !text-base !font-medium !touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="!flex !flex-col sm:!flex-row !items-stretch sm:!items-center !gap-2.5">
                    <div className="!flex-1 !h-12 !flex !items-center !px-4 !rounded-lg !border !border-gray-200 !bg-gray-50 !text-gray-700 !text-sm !break-all !overflow-hidden">
                      <span className="!truncate">{user?.email || '—'}</span>
                    </div>
                    <button
                      onClick={() => {
                        setNewEmail(user?.email || '')
                        setShowEmailChange(true)
                        setError(null)
                      }}
                      className="!px-5 !py-3 !text-sm !font-medium !border-2 !border-gray-300 !rounded-lg hover:!bg-gray-50 active:!bg-gray-100 !min-h-[48px] !whitespace-nowrap !touch-manipulation"
                    >
                      Change
                    </button>
                  </div>
                )}
                {error && showEmailChange && (
                  <p className="!text-sm !text-red-600 !break-words !mt-1 !px-1">{error}</p>
                )}
              </div>

              {/* Password Change Section */}
              <div className="!space-y-2.5">
                <label className="!text-sm !font-medium !text-gray-700 !block">Password</label>
                {showPasswordChange ? (
                  <div className="!space-y-3">
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      placeholder="Current password"
                      autoComplete="current-password"
                      className="!w-full !h-12 !px-4 !rounded-lg !border !border-gray-300 !bg-white !text-base focus:!ring-2 focus:!ring-red-500 focus:!border-red-500 hover:!border-gray-400 !transition-all !shadow-sm !touch-manipulation"
                    />
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      placeholder="New password"
                      autoComplete="new-password"
                      className="!w-full !h-12 !px-4 !rounded-lg !border !border-gray-300 !bg-white !text-base focus:!ring-2 focus:!ring-red-500 focus:!border-red-500 hover:!border-gray-400 !transition-all !shadow-sm !touch-manipulation"
                    />
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="!w-full !h-12 !px-4 !rounded-lg !border !border-gray-300 !bg-white !text-base focus:!ring-2 focus:!ring-red-500 focus:!border-red-500 hover:!border-gray-400 !transition-all !shadow-sm !touch-manipulation"
                    />
                    {passwordData.new && passwordData.new !== passwordData.confirm && (
                      <p className="!text-sm !text-red-600 !px-1">Passwords do not match</p>
                    )}
                    <div className="!flex !flex-col sm:!flex-row !gap-2.5">
                      <button
                        onClick={async () => {
                          if (!passwordData.new || passwordData.new !== passwordData.confirm) {
                            setError('Passwords do not match')
                            return
                          }
                          if (passwordData.new.length < 6) {
                            setError('Password must be at least 6 characters')
                            return
                          }
                          setIsLoading(true)
                          setError(null)
                          try {
                            await changePassword(passwordData.new)
                            setShowPasswordChange(false)
                            setPasswordData({ current: '', new: '', confirm: '' })
                          } catch (err: any) {
                            setError(err.message || 'Failed to change password')
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                        disabled={isLoading || !passwordData.new || passwordData.new !== passwordData.confirm || passwordData.new.length < 6}
                        className="!flex-1 !px-4 !py-3.5 !bg-red-600 !text-white !rounded-lg hover:!bg-red-700 active:!bg-red-800 disabled:!opacity-50 disabled:!cursor-not-allowed !min-h-[48px] !text-base !font-medium !shadow-md hover:!shadow-lg active:!shadow-sm !touch-manipulation"
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordChange(false)
                          setPasswordData({ current: '', new: '', confirm: '' })
                          setError(null)
                        }}
                        className="!flex-1 !px-4 !py-3.5 !border-2 !border-gray-300 !rounded-lg hover:!bg-gray-50 active:!bg-gray-100 !min-h-[48px] !text-base !font-medium !touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowPasswordChange(true)
                      setError(null)
                    }}
                    className="!w-full !px-4 !py-3.5 !text-sm !font-medium !border-2 !border-gray-300 !rounded-lg hover:!bg-gray-50 active:!bg-gray-100 !text-left !min-h-[48px] !touch-manipulation"
                  >
                    Change Password
                  </button>
                )}
                {error && showPasswordChange && (
                  <p className="!text-sm !text-red-600 !break-words !mt-1 !px-1">{error}</p>
                )}
              </div>

              {/* Account Info Grid */}
              <div className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-3">
                <div className="!rounded-lg !border !border-gray-200 !bg-gray-50 !p-4">
                  <div className="!text-xs !font-medium !text-gray-500 !mb-2">User ID</div>
                  <div className="!text-xs !font-mono !text-gray-700 !break-all !leading-relaxed">{user?.user_id || '—'}</div>
                </div>
                <div className="!rounded-lg !border !border-gray-200 !bg-gray-50 !p-4">
                  <div className="!text-xs !font-medium !text-gray-500 !mb-2">Member Since</div>
                  <div className="!text-sm !text-gray-700">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</div>
                </div>
              </div>

              {/* Delete Account */}
              {showDeleteConfirm ? (
                <div className="!space-y-3 !p-4 !border-2 !border-red-200 !rounded-lg !bg-red-50">
                  <p className="!text-sm !font-semibold !text-red-800">Are you sure you want to delete your account?</p>
                  <p className="!text-xs !text-red-600 !leading-relaxed">This action cannot be undone. All your data will be permanently deleted.</p>
                  <div className="!flex !flex-col sm:!flex-row !gap-2.5">
                    <button
                      onClick={async () => {
                        setIsLoading(true)
                        setError(null)
                        try {
                          await deleteAccount()
                          // User will be logged out and redirected
                        } catch (err: any) {
                          setError(err.message || 'Failed to delete account')
                          setIsLoading(false)
                        }
                      }}
                      disabled={isLoading}
                      className="!flex-1 !px-4 !py-3.5 !bg-red-600 !text-white !rounded-lg hover:!bg-red-700 active:!bg-red-800 disabled:!opacity-50 !min-h-[48px] !text-base !font-medium !shadow-md hover:!shadow-lg active:!shadow-sm !touch-manipulation"
                    >
                      {isLoading ? 'Deleting...' : 'Yes, Delete Account'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setError(null)
                      }}
                      disabled={isLoading}
                      className="!flex-1 !px-4 !py-3.5 !border-2 !border-gray-300 !rounded-lg hover:!bg-gray-50 active:!bg-gray-100 disabled:!opacity-50 !min-h-[48px] !text-base !font-medium !touch-manipulation"
                    >
                      Cancel
                    </button>
                  </div>
                  {error && (
                    <p className="!text-sm !text-red-600 !break-words !mt-1 !px-1">{error}</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="!w-full !px-4 !py-3.5 !text-sm !font-medium !border-2 !border-red-300 !text-red-600 !rounded-lg hover:!bg-red-50 active:!bg-red-100 !min-h-[48px] !touch-manipulation"
                >
                  Delete Account
                </button>
              )}

              {/* Sign Out */}
              <div className="!pt-2">
                <button
                  onClick={logout}
                  className="!w-full !border-2 !border-red-300 hover:!bg-red-50 active:!bg-red-100 !text-red-600 !font-medium !py-3.5 !rounded-lg !transition-colors active:!scale-[0.98] !min-h-[48px] !text-base !touch-manipulation"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}