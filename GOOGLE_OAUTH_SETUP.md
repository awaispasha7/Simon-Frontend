# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Chat application.

## Prerequisites

1. A Google Cloud Platform account
2. A Google Cloud Project

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity" if available

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
6. Click "Create"
7. Copy the Client ID

## Step 4: Configure Environment Variables

Create a `.env.local` file in the `Stories-we-tell` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Replace `your_google_client_id_here` with the Client ID from Step 3.

## Step 5: Update Authentication Pages

The authentication pages are already set up to use Google OAuth. The buttons are currently disabled until you:

1. Add your Google Client ID to the environment variables
2. Uncomment the Google OAuth functionality in the login/signup pages

## Step 6: Backend Integration

You'll need to update your backend to handle Google OAuth tokens:

1. Create an endpoint to verify Google tokens
2. Create or find users based on Google account information
3. Return your application's JWT tokens

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/auth/login` or `/auth/signup`
3. Click the "Continue with Google" button
4. Complete the Google OAuth flow

## Production Deployment

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Set the production environment variables
3. Deploy your application

## Security Notes

- Never commit your Client Secret to version control
- Use HTTPS in production
- Validate tokens on the backend
- Implement proper session management

## Troubleshooting

### Common Issues

1. **"Invalid client" error**: Check your Client ID and authorized origins
2. **"Redirect URI mismatch"**: Ensure redirect URIs match exactly
3. **CORS errors**: Check your authorized JavaScript origins

### Debug Mode

Enable debug mode by adding `?debug=true` to your OAuth URLs to see detailed error messages.

## Next Steps

After setting up Google OAuth:

1. Implement proper JWT token handling
2. Add user profile management
3. Implement logout functionality
4. Add social login options (Facebook, Twitter, etc.)
