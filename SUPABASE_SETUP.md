# Supabase Storage Setup Instructions

## Required Setup for File Upload Feature

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter the following details:
   - **Name**: `story-assets`
   - **Public bucket**: ✅ **YES** (Enable public access)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: Leave empty (or specify: `image/*, video/*, application/pdf, application/msword, text/plain`)

5. Click **Create bucket**

### 2. Set Up Row Level Security (RLS) Policies

After creating the bucket, you need to set up access policies:

#### Option A: Public Access (For Development/Testing)
1. In the Storage section, select your `story-assets` bucket
2. Go to **Policies** tab
3. Create a new policy with:
   - **Policy name**: `Public Access`
   - **Allowed operation**: `INSERT`, `SELECT`
   - **Target roles**: `public`, `authenticated`, `anon`
   - **Policy definition**: `true` (allows all access)

#### Option B: Authenticated Access (Recommended for Production)
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'story-assets');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'story-assets');

-- Allow public read access (optional)
CREATE POLICY "Public can read files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-assets');
```

### 3. Enable pgvector Extension (Already Done)

The pgvector extension should already be enabled for the `vector` column in the `assets` table.

To verify:
1. Go to **Database** → **Extensions**
2. Search for `vector`
3. If not enabled, click **Enable**

### 4. Verify Assets Table

Ensure the `assets` table exists with the correct schema:

```sql
SELECT * FROM assets LIMIT 1;
```

The table should have these columns:
- `id` (UUID, PRIMARY KEY)
- `project_id` (UUID, FOREIGN KEY to dossier)
- `type` (TEXT)
- `uri` (TEXT)
- `notes` (TEXT)
- `vector` (VECTOR(1536))

### 5. Test Upload

1. Visit your application: https://stories-we-tell.vercel.app/
2. Click the paperclip icon in the chat input
3. Select a file (image, PDF, or video)
4. Wait for upload confirmation
5. Check Supabase Storage → `story-assets` bucket to see the uploaded file
6. Check `assets` table to see the metadata

### Troubleshooting

**Issue**: "Bucket not found" error
- **Solution**: Make sure the bucket name is exactly `story-assets`

**Issue**: "Permission denied" error
- **Solution**: Check RLS policies are correctly set up

**Issue**: Files upload but don't appear in assets table
- **Solution**: Check that the `project_id` in assets table has a corresponding entry in `dossier` table (or temporarily remove the foreign key constraint for testing)

### Environment Variables

Make sure these are set in your Vercel deployment:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Features Implemented

✅ **File Upload Portal**
- Drag and drop support
- Multiple file upload
- File type validation
- File size limit (10MB)
- Upload progress indicator
- Error handling

✅ **Secure Storage**
- Supabase Storage integration
- Row Level Security policies
- Public/Authenticated access control

✅ **Assets Table Integration**
- Automatic metadata storage
- File type classification
- URL generation
- Project association

---

**Phase One Deliverable Status**: ✅ **COMPLETE** (100%)

