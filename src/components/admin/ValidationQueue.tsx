'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { useAuth } from '@/lib/auth-context'
import ValidationRequestCard from '@/components/admin/ValidationRequestCard'
import ValidationDetail from '@/components/admin/ValidationDetail'
import { adminApi } from '@/lib/admin-api'

interface ValidationRequest {
  validation_id: string
  project_id: string
  user_id: string
  session_id: string
  conversation_transcript: string
  generated_script: string
  client_email: string | null
  client_name: string | null
  status: 'pending' | 'approved' | 'rejected' | 'sent_to_client'
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  updated_at: string
}

export default function ValidationQueue() {
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<ValidationRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['validation-requests', statusFilter],
    queryFn: async () => await adminApi.getValidationRequests(statusFilter === 'all' ? undefined : statusFilter),
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      adminApi.approveRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setSelectedRequest(null)
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      adminApi.rejectRequest(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      setSelectedRequest(null)
    }
  })

  const updateScriptMutation = useMutation({
    mutationFn: ({ id, script }: { id: string; script: string }) => 
      adminApi.updateScript(id, script),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-requests'] })
    }
  })

  const handleApprove = (id: string, notes?: string) => {
    approveMutation.mutate({ id, notes })
  }

  const handleReject = (id: string, notes: string) => {
    rejectMutation.mutate({ id, notes })
  }

  const handleUpdateScript = (id: string, script: string) => {
    updateScriptMutation.mutate({ id, script })
  }

  if (error) {
    return (
      <div className={`p-4! rounded-lg! border! border-red-300! dark:border-red-700! bg-red-50! dark:bg-red-900/20! ${colors.text} shadow-lg!`}>
        <p className="font-semibold!">Error loading validation requests: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8!">
      {/* Header & Filters */}
      <div className={`flex! justify-between! items-center! mb-8! pb-6! border-b-2! ${colors.border}`}>
        <h2 className={`text-2xl! font-bold! ${colors.text}`}>Validation Queue</h2>
        <div className="flex! items-center! space-x-4!">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4! py-2! border! rounded-lg! text-sm! font-medium! ${colors.border} shadow-md! hover:shadow-lg! transition-shadow! cursor-pointer! focus:outline-none! focus:ring-2! focus:ring-blue-500! text-gray-900! dark:text-gray-100! bg-white! dark:bg-gray-800!`}
            style={{
              colorScheme: resolvedTheme === 'dark' ? 'dark' : 'light',
              backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff',
              color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827'
            }}
          >
            <option value="all" style={{ backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}>All Status</option>
            <option value="pending" style={{ backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}>Pending</option>
            <option value="approved" style={{ backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}>Approved</option>
            <option value="rejected" style={{ backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}>Rejected</option>
            <option value="sent_to_client" style={{ backgroundColor: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', color: resolvedTheme === 'dark' ? '#f3f4f6' : '#111827' }}>Sent to Client</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex! justify-center! py-12!">
          <div className="animate-spin! rounded-full! h-10! w-10! border-b-2! border-blue-600! dark:border-blue-400!"></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!requests || requests.length === 0) && (
        <div className={`text-center! py-16! ${colors.textSecondary} rounded-lg! border! ${colors.border} ${colors.background} shadow-md!`}>
          <p className="text-lg! font-medium!">No validation requests found.</p>
        </div>
      )}

      {/* Request List */}
      {!isLoading && requests && requests.length > 0 && (
        <div className="space-y-5!">
          {requests.map((request) => (
            <ValidationRequestCard
              key={request.validation_id}
              request={request}
              onSelect={() => setSelectedRequest(request)}
              isSelected={selectedRequest?.validation_id === request.validation_id}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <ValidationDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onUpdateScript={handleUpdateScript}
          isApproving={approveMutation.isPending}
          isRejecting={rejectMutation.isPending}
          isUpdatingScript={updateScriptMutation.isPending}
        />
      )}
    </div>
  )
}
