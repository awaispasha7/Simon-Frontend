# Dossier System Documentation

## Overview

The Dossier system automatically extracts and stores structured story metadata from chat conversations using AI.

## How It Works

### 1. **Chat Flow**
```
User sends message
  ↓
AI generates response
  ↓
Both stored in `turns` table
  ↓
Conversation history updated in memory
  ↓
Every 3 exchanges or when story keywords detected:
  → AI extracts metadata from conversation
  → Updates `dossier` table with structured data
```

### 2. **Automatic Extraction**

The system automatically extracts:
- **Title**: Story's working title
- **Logline**: One-sentence summary
- **Genre**: Primary genre (Drama, Comedy, Thriller, etc.)
- **Tone**: Overall tone (Dark, Light, Suspenseful, etc.)
- **Characters**: List with names and descriptions
- **Scenes**: Key scenes with descriptions, time of day, INT/EXT
- **Locations**: Settings where story takes place

### 3. **Update Triggers**

Dossier is updated when:
- ✅ Every 6 messages (3 user + 3 assistant exchanges)
- ✅ Keywords detected: "character", "scene", "story", "plot", "genre", "title", "protagonist", "antagonist", "setting", "location"

## Database Schema

### `dossier` Table
```sql
CREATE TABLE dossier (
    project_id UUID PRIMARY KEY,
    snapshot_json JSONB,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp
);
```

### `snapshot_json` Structure
```json
{
  "title": "string",
  "logline": "string",
  "genre": "string",
  "tone": "string",
  "characters": [
    {
      "character_id": "char_1",
      "name": "Character Name",
      "description": "Brief description"
    }
  ],
  "scenes": [
    {
      "scene_id": "scene_1",
      "one_liner": "Brief scene description",
      "description": "Detailed description",
      "time_of_day": "Day/Night",
      "interior_exterior": "INT/EXT",
      "tone": "Scene tone"
    }
  ],
  "locations": ["location1", "location2"]
}
```

## API Endpoints

### GET `/dossier`
Fetches the current dossier for a project.

**Query Parameters:**
- `project_id` (optional): Specific project ID. If not provided, uses default session.

**Response:**
```json
{
  "title": "My Story",
  "logline": "A thrilling adventure...",
  "genre": "Thriller",
  "tone": "Dark",
  "characters": [...],
  "scenes": [...],
  "locations": [...]
}
```

### POST `/chat`
Handles chat interactions and automatically updates dossier.

**Request:**
```json
{
  "text": "User message"
}
```

**Response:** Streaming response with chat content

**Side Effect:** Updates dossier in `dossier` table when triggered

## Session Management

### Current Implementation (In-Memory)
```python
conversation_sessions = {
    "default_session": {
        "project_id": "uuid-xxxx",
        "history": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."}
        ]
    }
}
```

### Production Recommendation
- Use **Redis** for distributed session storage
- Use **cookies** or **JWT tokens** for user session tracking
- Implement **user authentication** for multi-user support

## Frontend Integration

### SidebarDossier Component
```typescript
const { data } = useQuery({ 
  queryKey: ['dossier'], 
  queryFn: () => api.get('dossier').json<DossierData>() 
})
```

The component automatically fetches and displays:
- Story Overview (title, logline, genre, tone)
- Scene Structure (up to 4 scenes with details)
- Characters (up to 3 main characters)

## Testing

### Manual Test Flow

1. **Start a conversation:**
```
User: "I want to write a thriller about a detective"
AI: "Great! Tell me more about your detective..."
```

2. **Continue for 3+ exchanges:**
```
User: "Her name is Sarah, she's haunted by a past case"
AI: "Interesting! What's the main mystery she's investigating?"

User: "A series of murders in a small coastal town"
AI: "Perfect! Is this set during day or night?"
```

3. **Check Supabase:**
   - Go to `dossier` table
   - Find entry with your `project_id`
   - Inspect `snapshot_json` column

4. **View in Frontend:**
   - Open sidebar dossier
   - See extracted metadata displayed

### Expected Results

After 3-4 exchanges about a story, you should see:
- ✅ Title populated (if mentioned)
- ✅ Logline generated from conversation
- ✅ Genre identified
- ✅ Characters listed with descriptions
- ✅ Scenes extracted with details
- ✅ Locations identified

## Troubleshooting

### Dossier Not Updating

**Issue**: Dossier stays as "Untitled Story"
**Causes:**
1. Haven't reached 6 messages yet
2. No story keywords in conversation
3. AI extraction failed

**Solution:**
- Check backend logs for "📊 Updating dossier..."
- Verify conversation has story-related content
- Check Supabase `dossier` table for entries

### Extraction Not Accurate

**Issue**: Wrong genre, missing characters
**Causes:**
- Conversation too vague
- AI misinterpretation

**Solution:**
- Be more specific in conversations
- Mention explicit details (names, genres, settings)
- Update extraction prompt in `dossier_extractor.py`

### Session Not Persisting

**Issue**: New `project_id` on every refresh
**Current Limitation:**
- In-memory sessions don't persist across server restarts

**Production Solution:**
- Implement Redis session storage
- Use cookies/JWT for session persistence

## Future Enhancements

### Phase 2 Features
1. **User Authentication**
   - Multiple users
   - Personal project management
   
2. **Manual Editing**
   - Edit dossier fields directly
   - Override AI extractions

3. **Version History**
   - Track dossier changes over time
   - Rollback to previous versions

4. **Advanced Extraction**
   - Plot structure analysis
   - Character relationships
   - Story arc identification

5. **Export Options**
   - PDF export of dossier
   - Script format export
   - Integration with Final Draft

---

## Summary

✅ **Automatic extraction** from conversations
✅ **Intelligent triggering** based on keywords and message count
✅ **Structured storage** in Supabase
✅ **Real-time updates** in frontend
✅ **Production-ready** architecture (needs Redis for scale)

The dossier system is now **fully functional** and automatically populates as users discuss their stories! 🎬✨

