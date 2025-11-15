# Frontend - Chat Application

A modern Next.js frontend application for an AI chat assistant, built with TypeScript, Tailwind CSS, and React Query. An AI-powered assistant that helps users through conversational interaction.

## ✨ Key Features

### 🎭 Story Development

- **AI-Powered Chat Interface**: Conversational story development with context-aware AI assistance
- **Interactive Story Building**: Natural dialogue to develop characters, plot, and world-building
- **Smart Dossier Generation**: Automatically extracts and structures story elements from conversations
- **Real-time Story Analysis**: AI analyzes your story in real-time and provides intelligent feedback

### 📊 Story Dossier System

- **Automatic Story Extraction**: AI intelligently extracts characters, themes, locations, and plot points
- **Structured Story Elements**:
  - Character profiles with relationships and arcs
  - Key themes and motifs
  - Important locations and settings
  - Plot structure and story beats
- **Live Updates**: Dossier updates as your story evolves through conversation
- **Visual Story Map**: Clean, organized view of all story elements

### 💬 Session Management

- **Multi-Chat Support**: Manage multiple story projects simultaneously
- **Session History**: Access and continue previous story conversations
- **Persistent Sessions**: Your chats are automatically saved and synced
- **Smart Session Creation**: New sessions created only when needed
- **Session Metadata**: Track creation time, last message, and message count

### 🔐 Authentication & User Management

- **Supabase Authentication**: Secure login with email/password
- **User Profiles**: Personalized experience with display names and avatars
- **Anonymous Sessions**: Start chatting without signing up
- **Session Migration**: Seamlessly migrate anonymous sessions to authenticated accounts
- **Multi-device Sync**: Access your stories from any device

### 🎨 User Interface

- **Modern Design**: Clean, professional interface with smooth animations
- **Dark/Light Theme**: Full theme support with system preference detection
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Resizable Sidebars**: Customize your workspace layout
- **Touch-Friendly**: Optimized for touch interactions on mobile devices
- **Keyboard Shortcuts**: Efficient navigation for power users

### 🚀 Performance & Developer Experience

- **Real-time Streaming**: Server-sent events for instant AI responses
- **Optimistic Updates**: Instant UI feedback while waiting for server responses
- **Smart Caching**: React Query for efficient data fetching and caching
- **Type Safety**: Full TypeScript coverage for robust development
- **Code Quality**: ESLint and TypeScript for code quality enforcement

## 🛠️ Technical Stack

- **Next.js 15** with App Router for modern React framework
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS v4** for utility-first styling
- **React Query** for server state management and caching
- **Zustand** for client-side state management
- **Supabase** for authentication and real-time database
- **Lucide React** for beautiful, consistent icons
- **SSE (Server-Sent Events)** for real-time AI streaming

## 🎯 How It Works

### For Writers

1. **Start a Conversation**: Simply start chatting about your story idea
2. **Develop Your Story**: The AI asks intelligent questions to help you flesh out characters, plot, and themes
3. **Watch Your Dossier Grow**: Story elements are automatically extracted and organized
4. **Refine and Iterate**: Continue conversations to develop your story further
5. **Switch Between Projects**: Manage multiple stories with separate chat sessions

### Behind the Scenes

1. **Chat Interaction**: User sends messages through the chat interface
2. **AI Processing**: Backend LLM processes the message with full conversation context
3. **Intelligent Extraction**: AI decides when to extract story elements into dossier
4. **Real-time Updates**: Frontend receives streaming responses and metadata
5. **Persistent Storage**: Sessions, messages, and dossiers saved to Supabase
6. **Smart Synchronization**: All changes synced across devices and sessions

## Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Backend API running (see backend README)
- Supabase account and project (for authentication and database)

## Installation

1. **Navigate to the frontend directory:**

   ```bash
   cd stories-we-tell
   ```

2. **Install dependencies:**

   ```bash
   # Using npm
   npm install

   # Using yarn
   yarn install

   # Using pnpm (recommended)
   pnpm install
   ```

## Environment Setup

Create a `.env.local` file in the stories-we-tell directory:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Getting Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a project
2. Navigate to Project Settings → API
3. Copy your Project URL and anon/public key
4. Paste them into your `.env.local` file

## Running the Application

### Development Mode

```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

The application will start on `http://localhost:3000`

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Other Scripts

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run build analysis
npm run analyze
```

## Project Structure

```
stories-we-tell/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx        # Chat interface page
│   │   ├── globals.css         # Global styles and Tailwind imports
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── Topbar.tsx          # Application header
│   │   ├── ChatPanel.tsx       # Main chat interface
│   │   ├── SidebarDossier.tsx  # Character/story information sidebar
│   │   └── ui/                 # Reusable UI components (to be created)
│   └── lib/
│       ├── utils.ts            # Utility functions
│       ├── store.ts            # Zustand store configuration
│       └── api.ts              # API client configuration
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## Key Components

### Topbar

- Application header with branding and navigation
- User authentication controls (sign in/sign up/sign out)
- User profile display with avatar
- Theme toggle (dark/light mode)
- Responsive mobile menu

### ChatPanel

- Main chat interface with streaming AI responses
- Message input with auto-resize textarea
- Real-time conversation handling with typing indicators
- Persistent session management across messages
- Support for authenticated and anonymous users
- Message history loading from previous sessions
- Smart session creation and continuation

### SessionsSidebar

- List of all user chat sessions
- Session previews with first message
- Session metadata (creation date, message count)
- "New Chat" button with smooth animations
- Session deletion with confirmation
- Auto-refresh on session changes
- Responsive mobile-friendly layout

### SidebarDossier

- Real-time story dossier display
- Structured story elements:
  - **Characters**: Names, descriptions, relationships, arcs
  - **Themes**: Central themes and motifs
  - **Locations**: Settings and environments
  - **Plot Points**: Key story beats and structure
- Auto-refresh when dossier updates
- Elegant loading states
- Responsive collapsible sidebar

### Authentication Components

- Sign-in and sign-up forms
- Email/password authentication via Supabase
- User profile management
- Session migration for anonymous users
- Secure token-based authentication

## Styling

The application uses **Tailwind CSS v4** with a custom design system:

### Color Palette

- **Brand Colors**: Custom purple theme (`#645bb2`)
- **Semantic Colors**: Background, foreground, muted, accent
- **Dark Mode**: Full dark mode support with CSS variables

### Design Tokens

```css
/* Brand Colors */
--color-brand: #645bb2
--color-brand-50: #f0effa
--color-brand-900: #27244a

/* Shadows */
--shadow-soft: 0 10px 30px rgba(0,0,0,0.05)
```

## State Management

### Zustand Store

The application uses Zustand for client-side state management:

```typescript
// Chat store for managing conversation state
const useChatStore = create<ChatStore>((set) => ({
  init: () => {
    // Initialize chat store
  },
}));
```

### React Query

For server state management and data fetching:

```typescript
// Example query for fetching dossier data
const { data } = useQuery({
  queryKey: ["dossier"],
  queryFn: () => api.get("dossier").json<any>(),
});
```

## API Integration

The frontend communicates with the backend API through:

- **Base URL**: Configurable via `NEXT_PUBLIC_API_URL`
- **Endpoints**:
  - `POST /chat` - Send chat messages
  - `GET /dossier` - Fetch character/story information
- **Error Handling**: Comprehensive error states and loading indicators

## Responsive Design

The application is fully responsive with:

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
- **Grid Layout**: Responsive grid system for chat and sidebar
- **Touch Friendly**: Optimized for touch interactions

## Dark Mode

Dark mode is implemented using:

- **CSS Variables**: Dynamic color switching
- **Tailwind Classes**: `dark:` prefix for dark mode styles
- **System Preference**: Respects user's system preference
- **Manual Toggle**: (To be implemented)

## Development

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import and use in pages or other components
4. Add TypeScript types for props

### Styling Guidelines

1. Use Tailwind utility classes
2. Create custom components for reusable patterns
3. Use CSS variables for theme colors
4. Follow mobile-first responsive design

### State Management

1. Use Zustand for client state
2. Use React Query for server state
3. Keep state as close to where it's used as possible
4. Use TypeScript for state type safety

## Building for Production

1. **Environment Variables**: Ensure all required env vars are set
2. **Build Optimization**: Next.js automatically optimizes the build
3. **Static Assets**: Place images in `public/` directory
4. **API Configuration**: Update API URLs for production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Troubleshooting

### Common Issues

1. **Build Errors**: Check TypeScript types and imports
2. **Styling Issues**: Verify Tailwind classes and CSS imports
3. **API Connection**: Ensure backend is running and accessible
4. **Environment Variables**: Check `.env.local` configuration

### Development Tools

- **Next.js DevTools**: Built-in development tools
- **React DevTools**: Browser extension for React debugging
- **Tailwind CSS IntelliSense**: VS Code extension for autocomplete

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Test responsive design on multiple screen sizes
4. Update this README when adding new features
5. Use semantic commit messages

## Dependencies

### Core

- **Next.js 15**: React framework
- **React 18**: UI library
- **TypeScript**: Type safety

### Styling

- **Tailwind CSS v4**: Utility-first CSS framework
- **Lucide React**: Icon library

### State Management

- **Zustand**: Client state management
- **React Query**: Server state management

### Development

- **ESLint**: Code linting
- **PostCSS**: CSS processing

## License

This project is part of the Chat application suite.
