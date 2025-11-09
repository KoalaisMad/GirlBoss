# GirlBoss Page Structure

## Important Note about Next.js App Router
In Next.js App Router, all route files **MUST** be named `page.tsx`. The folder names determine the URL paths and indicate what each page does.

## Current Page Structure

```
app/
├── page.tsx                    → Home Page (/)
│   Purpose: Main trip planning page with location search
│
├── chat-assistant/
│   └── page.tsx               → Chat Assistant Page (/chat-assistant)
│       Purpose: AI chatbot for safety tips and advice
│
├── voice-control/
│   └── page.tsx               → Voice Assistant Page (/voice-control)
│       Purpose: Voice-activated safety assistant
│
├── explore-maps/
│   └── page.tsx               → Maps Page (/explore-maps)
│       Purpose: Location search and map exploration
│
├── trip-options/
│   └── page.tsx               → Trip Options Page (/trip-options)
│       Purpose: Display trip routes with safety scores
│
├── app-settings/
│   └── page.tsx               → Settings Page (/app-settings)
│       Purpose: User profile and emergency contacts
│
└── components/
    └── Navigation.tsx          → Shared navigation menu component
```

## URL Routes
- `/` - Home page (main trip search)
- `/chat-assistant` - Chatbot interface
- `/voice-control` - Voice assistant
- `/explore-maps` - Map exploration
- `/trip-options` - Trip planning results
- `/app-settings` - User settings

## Design Updates Applied
✅ All logos updated to 150x150
✅ Chat page matches screenshot with conversation history
✅ Voice Agent has pink gradient background
✅ Settings page has name, email, and emergency contacts
✅ Trip Options displays safety scores for all modes
✅ All pages have consistent header with hamburger menu
