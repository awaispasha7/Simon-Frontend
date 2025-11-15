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
  const { user, updateProfile, logout } = useAuth()
  const [tempName, setTempName] = useState(profile.userName)
  const [tempImage, setTempImage] = useState<string | null>(profile.userImage)
  const [activeTab, setActiveTab] = useState<'chat' | 'account'>(initialTab)

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Settings</h2>
                <p className="text-indigo-100 text-sm">Manage your profile and preferences</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="h-9 w-9 hover:bg-white/10 transition-colors rounded-lg flex items-center justify-center group hover:cursor-pointer hover:scale-105"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="mt-8 flex gap-4 justify-evenly border-b border-white/20">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={`px-4 py-2.5 text-sm font-medium transition-all focus:outline-none relative hover:cursor-pointer
                ${activeTab === 'chat'
                  ? 'text-white'
                  : 'text-indigo-200 hover:text-white'}
              `}
              onClick={() => setActiveTab('chat')}
            >
              Chat Profile
              {activeTab === 'chat' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'account'}
              className={`px-4 py-2.5 text-sm font-medium transition-all focus:outline-none relative hover:cursor-pointer
                ${activeTab === 'account'
                  ? 'text-white'
                  : 'text-indigo-200 hover:text-white'}
              `}
              onClick={() => setActiveTab('account')}
            >
              Account
              {activeTab === 'account' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8"></div>
        
        {/* Content */}
        <div className="p-6 bg-white">
          {activeTab === 'chat' && (
          <div className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4 py-4">
              <div className="relative">
                <ProfilePictureUpload
                  currentImage={tempImage}
                  onImageChange={setTempImage}
                  size="lg"
                />
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-500">
                  Supported: JPG, PNG, GIF (max 5MB)
                </p>
                {tempImage && (
                  <button
                    onClick={() => setTempImage(null)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <X className="w-4 h-4" />
                    Remove Picture
                  </button>
                )}
              </div>
            </div>

            {/* Spacer */}
            <div className="h-8"></div>

             {/* Display Name */}
             <div className="space-y-2 mx-4 flex flex-col items-center justify-center">
               <label htmlFor="userName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                 <User className="w-4 h-4 text-gray-500" />
                 Display Name
               </label>
               <input
                 id="userName"
                 value={tempName}
                 onChange={(e) => setTempName(e.target.value)}
                 placeholder="Enter your display name"
                 className="flex h-12 sm:w-[35%] w-[90%] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white hover:border-gray-300 hover:bg-white transition-all shadow-sm"
               />
              <p className="text-xs text-gray-500 mt-1.5">
                This name appears in your chat messages
              </p>
            </div>

            {/* Spacer */}
            <div className="h-8"></div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm hover:cursor-pointer hover:scale-105"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-colors hover:cursor-pointer hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Email - Read Only */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Email Address</div>
                <div className="h-11 flex items-center px-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm">
                  {user?.email || '—'}
                </div>
              </div>

              {/* Spacer */}
            <div className="h-8"></div>

              {/* Account Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">User ID</div>
                  <div className="text-sm font-mono text-gray-700 break-all">{user?.user_id || '—'}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs font-medium text-gray-500 mb-1">Member Since</div>
                  <div className="text-sm text-gray-700">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</div>
                </div>
              </div>

              {/* Spacer */}
            <div className="h-8"></div>

              {/* Sign Out */}
              <div className="pt-4">
                <button
                  onClick={logout}
                  className="w-full border border-red-300 hover:bg-red-50 text-red-600 font-medium py-2.5 rounded-lg transition-colors hover:cursor-pointer hover:scale-105"
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