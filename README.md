# Simon Chatbot - Frontend

A modern Next.js frontend application for the Simon Chatbot personal AI assistant, built with TypeScript, Tailwind CSS, and React Query.

## Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **React Query** for data fetching and state management
- **Zustand** for client-side state management
- **Lucide React** for icons
- **Responsive Design** with mobile-first approach
- **Dark Mode Support**
- **Real-time Chat Interface**
- **Character Dossier Sidebar**

## Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Backend API running (see backend README)

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd Simon-Chatbot-Frontend
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

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

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
Simon-Chatbot-Frontend/
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
- Application header with branding
- Version information
- Responsive design with mobile support

### ChatPanel  
- Main chat interface
- Message input and display
- Real-time conversation handling

### SidebarDossier
- Character and story information display
- Scene breakdowns
- Metadata visualization
- Responsive sidebar that hides on mobile

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
  }
}))
```

### React Query
For server state management and data fetching:

```typescript
// Example query for fetching dossier data
const { data } = useQuery({ 
  queryKey: ['dossier'], 
  queryFn: () => api.get('dossier').json<any>() 
})
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

### Vercel (Recommended)

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

This is the frontend for the Simon Chatbot personal AI assistant application.
