'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card' // Removed - using custom styling
// import { Badge } from '@/components/ui/badge' // Removed - using custom styling
// import { Separator } from '@/components/ui/separator' // Unused import
import { api } from '@/lib/api'

// Import getUserHeaders for debugging
const getUserHeaders = () => {
  if (typeof window === 'undefined') return {}
  
  try {
    const user = localStorage.getItem('user')
    
    const headers: Record<string, string> = {}
    
    if (user) {
      const userData = JSON.parse(user)
      headers['X-User-ID'] = userData.user_id
    }
    
    return headers
  } catch (error) {
    console.error('Error getting user headers:', error)
  }
  
  return {}
}
import { useDossierRefresh } from '@/lib/dossier-context'
import { useTheme, getThemeColors } from '@/lib/theme-context'

interface DossierData {
  title: string
  logline: string
  genre: string
  tone: string
  scenes: SceneData[]
  characters: CharacterData[]
  locations: string[]
  project_id?: string  // Include project_id for visibility
  // Extended optional fields mirrored from snapshot_json
  outcome?: string
  runtime?: string
  actions_taken?: string
  likes_in_story?: string
  story_location?: string
  story_timeframe?: string
  story_world_type?: string
  problem_statement?: string
  subject_full_name?: string
  subject_brief_description?: string
  subject_exists_real_world?: boolean
  writer_connection_place_time?: string
  subject_relationship_to_writer?: string
  [key: string]: any
}

interface SceneData {
  scene_id: string
  one_liner?: string
  description?: string
  setting_time?: string
  setting_location?: string
  time_of_day?: string
  interior_exterior?: string
  tone?: string
}

interface CharacterData {
  character_id?: string
  name?: string
  description?: string
  role?: string
  [key: string]: any
}

interface SidebarDossierProps {
  sessionId?: string
  projectId?: string
  onClose?: () => void
}

export function SidebarDossier({ sessionId, projectId, onClose }: SidebarDossierProps) {
  const { refreshTrigger } = useDossierRefresh()
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme)
  
  const { data, isLoading } = useQuery({ 
    queryKey: ['dossier', sessionId, projectId, refreshTrigger], // Include session and project IDs
    queryFn: async () => {
      // Don't fetch if we don't have a session or project ID
      if (!sessionId || !projectId) {
        console.log('⚠️ Skipping dossier fetch - no session or project ID')
        return null
      }
      
      console.log('🔄 Fetching dossier for session:', sessionId, 'project:', projectId)
      console.log('🔍 API URL will be:', `api/v1/dossiers/${projectId}`)
      console.log('🔍 Headers being sent:', getUserHeaders())
      try {
        const raw = await api.get(`api/v1/dossiers/${projectId}`).json<any>()
        console.log('✅ Dossier fetched successfully:', raw)
        // The API returns a row with snapshot_json; unwrap it into the shape the UI expects
        const snapshot = raw?.snapshot_json || raw || {}
        const mapped: DossierData = {
          ...snapshot, // Spread all snapshot fields first
          title: snapshot.title || '',
          logline: snapshot.logline || '',
          genre: snapshot.genre || '',
          tone: snapshot.tone || '',
          scenes: snapshot.scenes || [],
          characters: snapshot.characters || [],
          locations: snapshot.locations || [],
          project_id: projectId,
          // Extended fields from snapshot_json
          problem_statement: snapshot.problem_statement,
          outcome: snapshot.outcome,
          runtime: snapshot.runtime,
          actions_taken: snapshot.actions_taken,
          likes_in_story: snapshot.likes_in_story,
          story_location: snapshot.story_location,
          story_timeframe: snapshot.story_timeframe,
          story_world_type: snapshot.story_world_type,
          subject_full_name: snapshot.subject_full_name,
          subject_brief_description: snapshot.subject_brief_description,
          subject_exists_real_world: snapshot.subject_exists_real_world,
          writer_connection_place_time: snapshot.writer_connection_place_time,
          subject_relationship_to_writer: snapshot.subject_relationship_to_writer
        }
        console.log('📋 Mapped dossier data:', mapped)
        console.log('📋 Characters count:', mapped.characters?.length || 0)
        console.log('📋 Scenes count:', mapped.scenes?.length || 0)
        // Cache a copy for other consumers
        try { localStorage.setItem('dossier_snapshot', JSON.stringify(mapped)) } catch {}
        return mapped
      } catch (err) {
        console.error('❌ Error fetching dossier:', err)
        console.error('❌ Full error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          status: (err as { response?: { status?: number } })?.response?.status,
          url: (err as { response?: { url?: string } })?.response?.url
        })
        // Don't throw error - return null to show empty state
        return null
      }
    },
    refetchInterval: false,
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid flash
    refetchOnMount: false, // Only refetch when query key changes (refreshTrigger)
    staleTime: 0,
    placeholderData: (previousData) => previousData, // Keep previous data during refetch to prevent flash
    enabled: !!(sessionId && projectId), // Only fetch if we have both IDs
    retry: 1, // Only retry once on failure
    retryDelay: 2000 // Wait 2 seconds before retry
  })
  const d = data ?? { title: '', logline: '', genre: '', tone: '', scenes: [], characters: [], locations: [] }

  // Show loading state ONLY on initial load (when there's no data yet)
  // This prevents flash during background refetches
  if (isLoading && !data) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-4 sm:gap-6 pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-12 custom-scrollbar" style={{ padding: '2rem' }}>
        {onClose && (
          <div className="sm:hidden mb-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Back"
              title="Back"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
        )}
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  // Show empty state if no session/project ID
  if (!sessionId || !projectId) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-4 sm:gap-6 pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-12 custom-scrollbar" style={{ padding: '2rem' }}>
        {onClose && (
          <div className="sm:hidden mb-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Back"
              title="Back"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
        )}
        <div className="text-center py-8">
          <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">No Active Session</h3>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Start a conversation to see your content dossier
          </p>
        </div>
      </div>
    )
  }

  // Show empty state if no dossier data
  if (!data) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-4 sm:gap-6 pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-12 custom-scrollbar" style={{ padding: '2rem' }}>
        {onClose && (
          <div className="sm:hidden mb-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Back"
              title="Back"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
        )}
        <div className="text-center py-8">
          <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">No Dossier Yet</h3>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            Your content dossier will appear here as you create content
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden flex flex-col gap-4 sm:gap-6 pt-16 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-12 custom-scrollbar" style={{ padding: '2rem' }}>
      {onClose && (
        <div className="sm:hidden mb-2">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Back"
            title="Back"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
      )}
      {/* Header */}
      <div className={`text-center pb-4 border-b-2 ${resolvedTheme === 'light' ? 'border-red-300' : 'border-red-600'}`}>
        <h2 className="text-xl font-bold bg-linear-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
          Content Dossier
        </h2>
        <p className={`text-sm ${colors.textSecondary} mt-1`}>Your content creation hub</p>
      </div>

      {/* Project Information */}
      {projectId && (
        <div className={`${colors.cardBackground} border-2 ${colors.borderSecondary} rounded-lg p-4 mb-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-linear-to-br from-red-500 to-orange-500 rounded-full"></div>
            <div className="flex-1">
              <div className={`text-xs font-semibold ${colors.textSecondary} uppercase tracking-wide mb-1`}>Project</div>
              <div className={`text-sm font-mono ${colors.text} break-all`} style={{ 
                fontFamily: 'monospace'
              }}>
                {projectId}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Story Overview Card */}
      <div>
        <div className="pb-3">
            <h3 className={`text-lg flex items-center gap-2 font-semibold ${colors.text}`}>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Content Overview
            </h3>
        </div>
        <div className={`${colors.cardBackground} border-2 ${colors.borderSecondary} shadow-lg mt-8 sm:mt-12 lg:mt-16 rounded-lg`} style={{ padding: '0.75rem' }}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-red-600' : 'text-red-400'} uppercase tracking-wide`}>Title</div>
              <div className="font-bold bg-linear-to-r from-red-500 to-blue-500 bg-clip-text text-transparent text-sm">
                {d.title || 'Untitled Project'}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className={`text-xs font-semibold ${resolvedTheme === 'light' ? 'text-red-600' : 'text-red-400'} uppercase tracking-wide`}>Logline</div>
              <div className={`text-sm leading-relaxed max-w-[70%] ${colors.textSecondary}`}>
                {d.logline || 'Content ready to be created...'}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {d.genre && (
                <span className="bg-linear-to-r from-red-500 to-red-600 text-white border-0 shadow-sm px-2 py-1 rounded-full text-xs">
                  {d.genre}
                </span>
              )}
              {d.tone && (
                <span className={`border ${resolvedTheme === 'light' ? 'border-red-300 text-red-700 bg-red-50/50' : 'border-red-600 text-red-300 bg-red-900/30'} px-2 py-1 rounded-full text-xs`}>
                  {d.tone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Key Details Card */}
      <div>
        <div className="pb-3">
            <h3 className={`text-lg flex items-center gap-2 font-semibold ${colors.text}`}>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Key Details
            </h3>
        </div>
        <div className={`${colors.cardBackground} border-2 ${colors.borderSecondary} shadow-lg mt-6 rounded-lg p-4`}>
          <div className="grid grid-cols-1 gap-3">
            {d.subject_full_name && (
              <div className="flex items-start justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Subject Name</div>
                <div className={`text-sm ${colors.text} max-w-[70%]`}>{d.subject_full_name}</div>
              </div>
            )}
            {d.subject_brief_description && (
              <div className="flex items-start justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Subject Description</div>
                <div className={`text-sm ${colors.text} max-w-[70%]`}>{d.subject_brief_description}</div>
              </div>
            )}
            {d.subject_relationship_to_writer && (
              <div className="flex items-start justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Relationship to Writer</div>
                <div className={`text-sm ${colors.text} max-w-[70%]`}>{d.subject_relationship_to_writer}</div>
              </div>
            )}
            {d.writer_connection_place_time && (
              <div className="flex items-start justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Writer Connection</div>
                <div className={`text-sm ${colors.text} max-w-[70%]`}>{d.writer_connection_place_time}</div>
              </div>
            )}
            {d.problem_statement && (
              <div className="flex items-start justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Problem</div>
                <div className={`text-sm ${colors.text} max-w-[70%]`}>{d.problem_statement}</div>
              </div>
            )}
            {d.outcome && (
              <div className="flex items-start justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Outcome</div>
                <div className={`text-sm ${colors.text} max-w-[70%]`}>{d.outcome}</div>
              </div>
            )}
            {d.runtime && (
              <div className="flex items-center justify-between gap-3">
                <div className={`text-xs font-semibold ${colors.textTertiary} uppercase tracking-wide`}>Runtime</div>
                <div className={`text-sm ${colors.textSecondary}`}>{d.runtime}</div>
              </div>
            )}
            {(d.story_location || d.story_timeframe || d.story_world_type) && (
              <div className={`text-xs ${colors.textSecondary} grid grid-cols-1 gap-1`}>
                {d.story_location && <div><span className={`font-semibold ${colors.text}`}>Location:</span> {d.story_location}</div>}
                {d.story_timeframe && <div><span className={`font-semibold ${colors.text}`}>Timeframe:</span> {d.story_timeframe}</div>}
                {d.story_world_type && <div><span className={`font-semibold ${colors.text}`}>World:</span> {d.story_world_type}</div>}
              </div>
            )}
            {d.actions_taken && (
              <div className={`text-xs ${colors.textSecondary}`}>
                <div className={`font-semibold ${colors.text} mb-1`}>Actions Taken</div>
                <div className="text-sm whitespace-pre-wrap">{d.actions_taken}</div>
              </div>
            )}
            {d.likes_in_story && (
              <div className={`text-xs ${colors.textSecondary}`}>
                <div className={`font-semibold ${colors.text} mb-1`}>What We Love</div>
                <div className="text-sm whitespace-pre-wrap">{d.likes_in_story}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scenes Card - show only if scenes are present */}
      {(d.scenes ?? []).length > 0 && (
        <div>
          <div className="pb-3">
              <h3 className={`text-lg flex items-center gap-2 font-semibold ${colors.text}`}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Scene Structure
              </h3>
            </div>
          <div className={`${colors.cardBackground} border-2 ${colors.borderSecondary} shadow-lg mt-8 sm:mt-12 lg:mt-16 rounded-lg`}>  
            <div className="space-y-4 p-4">
              {(d.scenes ?? []).slice(0, 8).map((s: SceneData, index: number) => (
                <div key={s.scene_id || `scene-${index}`} className={`${colors.backgroundTertiary} p-3 rounded-lg border ${colors.border} shadow-sm`}>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-linear-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${colors.text} text-sm mb-1`}>
                        {s.one_liner || s.description || 'Scene ' + (index + 1)}
                      </div>
                      <div className={`text-xs ${colors.textSecondary} space-y-1`}>
                        <div className="flex gap-2">
                          {s.time_of_day && (
                            <span className={`${resolvedTheme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-900/30 text-green-300'} px-2 py-0.5 rounded-full text-xs`}>
                              {s.time_of_day}
                            </span>
                          )}
                          {s.interior_exterior && (
                            <span className={`${resolvedTheme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/30 text-blue-300'} px-2 py-0.5 rounded-full text-xs`}>
                              {s.interior_exterior}
                            </span>
                          )}
                        </div>
                        {s.tone && (
                          <div className={`${colors.textTertiary} italic`}>Tone: {s.tone}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Characters Card */}
      <div>
        <div className="pb-3">
            <h3 className={`text-lg flex items-center gap-2 font-semibold ${colors.text}`}>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Characters
            </h3>
        </div>
        <div className={`${colors.cardBackground} border-2 ${colors.borderSecondary} shadow-lg mt-8 sm:mt-12 lg:mt-16 rounded-lg`} style={{ padding: '0.75rem' }}>
          <div>
            {(d.characters ?? []).length > 0 ? (
              <div className="space-y-3">
                {d.characters.map((char: CharacterData, idx: number) => (
                  <div key={char.character_id || `${idx}`} className={`${colors.backgroundTertiary} p-3 rounded-lg border ${colors.border}`}>
                    <div className={`font-semibold ${colors.text}`}>{char.name || 'Unnamed Character'}</div>
                    {char.role && (
                      <div className={`text-xs ${colors.textTertiary} mt-0.5`}>{char.role}</div>
                    )}
                    {char.description && (
                      <div className={`text-xs ${colors.textSecondary} mt-1 whitespace-pre-wrap`}>{char.description}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${colors.backgroundTertiary} p-3 rounded-lg border ${colors.border}`}>
                <div className={`font-semibold ${colors.text}`}>No characters yet</div>
                <div className={`text-xs ${colors.textSecondary} mt-1`}>Share character details to populate this section</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
