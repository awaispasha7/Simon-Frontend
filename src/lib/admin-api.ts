import ky from 'ky'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

interface AdminStats {
  total_requests: number
  pending_count: number
  approved_count: number
  rejected_count: number
  sent_count: number
  failed_count?: number  // Optional for backwards compatibility
  avg_review_time: string
  today_requests: number
}

class AdminApi {
  private getAuthHeaders() {
    // Get user ID from localStorage/auth context
    let userId: string | null = null
    
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('supabase.auth.token')
        if (storedUser) {
          const authData = JSON.parse(storedUser)
          userId = authData?.user?.id
        }
      } catch (error) {
        console.warn('Could not parse auth data:', error)
      }
    }
    
    return userId ? { 'X-User-ID': userId } : {}
  }

  async getValidationRequests(status?: string): Promise<ValidationRequest[]> {
    try {
      const searchParams = new URLSearchParams()
      if (status) {
        searchParams.set('status', status)
      }

      const url = `${API_BASE_URL}/api/v1/validation/queue${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      
      const response = await ky.get(url, {
        headers: this.getAuthHeaders(),
        timeout: 30000
      }).json<ValidationRequest[]>()

      return response
    } catch (error) {
      console.error('Failed to fetch validation requests:', error)
      throw new Error('Failed to fetch validation requests')
    }
  }

  async getValidationRequest(id: string): Promise<ValidationRequest> {
    try {
      const response = await ky.get(`${API_BASE_URL}/api/v1/validation/queue/${id}`, {
        headers: this.getAuthHeaders(),
        timeout: 15000
      }).json<ValidationRequest>()

      return response
    } catch (error) {
      console.error('Failed to fetch validation request:', error)
      throw new Error('Failed to fetch validation request')
    }
  }

  async approveRequest(id: string, notes?: string): Promise<{ success: boolean }> {
    try {
      const response = await ky.post(`${API_BASE_URL}/api/v1/validation/queue/${id}/approve`, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        json: { notes: notes || '' },
        timeout: 30000
      }).json<{ success: boolean }>()

      return response
    } catch (error) {
      console.error('Failed to approve request:', error)
      throw new Error('Failed to approve request')
    }
  }

  async rejectRequest(id: string, notes: string): Promise<{ success: boolean }> {
    try {
      const response = await ky.post(`${API_BASE_URL}/api/v1/validation/queue/${id}/reject`, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        json: { notes },
        timeout: 15000
      }).json<{ success: boolean }>()

      return response
    } catch (error) {
      console.error('Failed to reject request:', error)
      throw new Error('Failed to reject request')
    }
  }

  async updateScript(id: string, script: string): Promise<{ success: boolean }> {
    try {
      const response = await ky.put(`${API_BASE_URL}/api/v1/validation/queue/${id}/script`, {
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        json: { generated_script: script },
        timeout: 15000
      }).json<{ success: boolean }>()

      return response
    } catch (error) {
      console.error('Failed to update script:', error)
      throw new Error('Failed to update script')
    }
  }

  async getStats(): Promise<AdminStats> {
    try {
      const response = await ky.get(`${API_BASE_URL}/api/v1/validation/stats`, {
        headers: this.getAuthHeaders(),
        timeout: 15000
      }).json<AdminStats>()

      return response
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
      throw new Error('Failed to fetch admin stats')
    }
  }
}

export const adminApi = new AdminApi()
