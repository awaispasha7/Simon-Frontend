'use client'

import { useQuery } from '@tanstack/react-query'
import { useTheme, getThemeColors } from '@/lib/theme-context'
import { adminApi } from '@/lib/admin-api'

export default function AdminStats() {
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats(), // Bind context properly
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className={`p-6! rounded-lg! border! ${colors.border} ${colors.background} shadow-lg!`}>
        <div className="animate-pulse! space-y-4!">
          <div className="h-4! bg-gray-300! dark:bg-gray-700! rounded! w-3/4!"></div>
          <div className="space-y-2!">
            <div className="h-3! bg-gray-200! dark:bg-gray-800! rounded!"></div>
            <div className="h-3! bg-gray-200! dark:bg-gray-800! rounded! w-5/6!"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-8! rounded-xl! border! ${colors.border} ${colors.background} shadow-lg! backdrop-blur-sm!`}>
      <h3 className={`font-bold! mb-6! text-xl! ${colors.text}`}>Queue Statistics</h3>
      
      <div className="space-y-6!">
        {/* Total Requests */}
        <div className="text-center! p-6! bg-linear-to-br! from-blue-50! to-blue-100! dark:from-blue-900/30! dark:to-blue-800/20! rounded-xl! border! border-blue-200! dark:border-blue-700! shadow-md!">
          <div className="text-4xl! font-bold! text-blue-600! dark:text-blue-400! mb-2!">
            {stats?.total_requests || 0}
          </div>
          <div className="text-sm! text-blue-700! dark:text-blue-300! font-semibold!">Total Requests</div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-4!">
          <h4 className={`text-base! font-bold! ${colors.text} mb-4!`}>By Status</h4>
          
          <div className="grid! grid-cols-1! gap-3! text-sm!">
            <div className="flex! justify-between! items-center! p-4! bg-linear-to-r! from-yellow-50! to-yellow-100/50! dark:from-yellow-900/20! dark:to-yellow-800/10! rounded-lg! border! border-yellow-200! dark:border-yellow-700! shadow-sm! hover:shadow-md! transition-shadow!">
              <span className="text-yellow-700! dark:text-yellow-300! font-semibold!">Pending</span>
              <span className="font-bold! text-yellow-800! dark:text-yellow-200! text-xl!">
                {stats?.pending_count || 0}
              </span>
            </div>
            
            <div className="flex! justify-between! items-center! p-4! bg-linear-to-r! from-green-50! to-green-100/50! dark:from-green-900/20! dark:to-green-800/10! rounded-lg! border! border-green-200! dark:border-green-700! shadow-sm! hover:shadow-md! transition-shadow!">
              <span className="text-green-700! dark:text-green-300! font-semibold!">Approved</span>
              <span className="font-bold! text-green-800! dark:text-green-200! text-xl!">
                {stats?.approved_count || 0}
              </span>
            </div>
            
            <div className="flex! justify-between! items-center! p-4! bg-linear-to-r! from-red-50! to-red-100/50! dark:from-red-900/20! dark:to-red-800/10! rounded-lg! border! border-red-200! dark:border-red-700! shadow-sm! hover:shadow-md! transition-shadow!">
              <span className="text-red-700! dark:text-red-300! font-semibold!">Rejected</span>
              <span className="font-bold! text-red-800! dark:text-red-200! text-xl!">
                {stats?.rejected_count || 0}
              </span>
            </div>
            
            <div className="flex! justify-between! items-center! p-4! bg-linear-to-r! from-purple-50! to-purple-100/50! dark:from-purple-900/20! dark:to-purple-800/10! rounded-lg! border! border-purple-200! dark:border-purple-700! shadow-sm! hover:shadow-md! transition-shadow!">
              <span className="text-purple-700! dark:text-purple-300! font-semibold!">Sent to Client</span>
              <span className="font-bold! text-purple-800! dark:text-purple-200! text-xl!">
                {stats?.sent_count || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {stats && (
          <div className="pt-6! mt-6! border-t-2! ${colors.border} space-y-3! text-xs!">
            <div className={`flex! justify-between! ${colors.textSecondary} font-medium!`}>
              <span>Avg. Review Time:</span>
              <span className="font-semibold!">{stats.avg_review_time || 'N/A'}</span>
            </div>
            <div className={`flex! justify-between! ${colors.textSecondary} font-medium!`}>
              <span>Today's Requests:</span>
              <span className="font-semibold!">{stats.today_requests || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
