# Chatbot App

A modern, responsive chatbot application built with React and TypeScript.

## Features

- 🎨 Modern and clean UI design
- 💬 Real-time chat interface
- 📱 Fully responsive design
- ⚡ Built with Vite for fast development
- 🔷 TypeScript for type safety
- 🎯 Smooth animations and transitions
- 🔌 GraphQL integration for backend communication
- 🐍 Python backend integration support
- 💾 Intelligent response caching

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Create a `.env` file in the root directory
   - For direct Python API: `VITE_PYTHON_API_ENDPOINT=http://localhost:8000/api/chat` and `VITE_USE_GRAPHQL=false`
   - For GraphQL middleware: `VITE_GRAPHQL_ENDPOINT=http://localhost:8000/graphql` and `VITE_USE_GRAPHQL=true`
   - (Optional) Add authentication token if needed: `VITE_AUTH_TOKEN=your_token_here`

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Python Backend Integration

The chatbot can consume your existing Python endpoint in two ways:

**Option 1: Direct REST API (Recommended)**
- Set `VITE_PYTHON_API_ENDPOINT` to your Python API endpoint
- Set `VITE_USE_GRAPHQL=false`
- Your endpoint should accept POST requests with `{query, conversation_id}` and return `{response, id, timestamp}`

**Option 2: Through GraphQL**
- Set `VITE_GRAPHQL_ENDPOINT` to your GraphQL endpoint
- Set `VITE_USE_GRAPHQL=true`
- Your GraphQL endpoint should support the chatbot query schema

See `ENDPOINT_CONFIG.md` for detailed configuration and examples.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
chatbox/
├── src/
│   ├── components/
│   │   ├── Chatbot/          # Main chatbot component
│   │   └── Dashboard/        # Dashboard component
│   ├── shared/
│   │   └── components/       # Reusable UI components
│   │       ├── ChatHeader/   # Chat header component
│   │       ├── Message/      # Individual message component
│   │       ├── ChatInput/    # Input component
│   │       └── MessagesList/ # Messages list component
│   ├── services/
│   │   ├── graphql/          # GraphQL client and queries
│   │   │   ├── apollo-client.ts  # Apollo Client configuration
│   │   │   ├── queries.ts        # GraphQL queries
│   │   │   └── types.ts          # GraphQL types
│   │   └── api/              # API service layer
│   │       └── chatbot.service.ts # Chatbot API service with caching
│   ├── hooks/
│   │   └── useChatbot.ts     # Custom hook for chatbot logic
│   ├── interfaces/
│   │   └── message.interface.ts # TypeScript interfaces
│   ├── constants/
│   │   └── app.constants.ts  # Application constants
│   ├── utils/
│   │   ├── message.utils.ts  # Message utility functions
│   │   ├── date.utils.ts     # Date formatting utilities
│   │   └── scroll.utils.ts   # Scroll utility functions
│   ├── App.tsx               # Root app component
│   ├── App.css               # App styles
│   ├── main.tsx              # Entry point with Apollo Provider
│   └── index.css             # Global styles
├── ENDPOINT_CONFIG.md        # Python endpoint configuration guide
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Customization

You can customize the chatbot by:

- **Bot Configuration**: Modify constants in `src/constants/app.constants.ts`
- **Bot Logic**: Update the `useChatbot` hook in `src/hooks/useChatbot.ts`
- **Styling**: Change styles in individual component CSS files
- **Components**: Customize shared components in `src/shared/components/`
- **Interfaces**: Add new types in `src/interfaces/`
- **Utilities**: Add helper functions in `src/utils/`
- **Python Endpoint**: Configure your endpoint URL in `.env` file (see `ENDPOINT_CONFIG.md`)
- **Request/Response Format**: Customize the API call format in `src/services/api/chatbot.service.ts`
- **GraphQL Integration**: Modify queries in `src/services/graphql/queries.ts` (if using GraphQL)
- **Caching**: Adjust cache expiration in `src/services/api/chatbot.service.ts` (default: 5 minutes)

## GraphQL & Caching

The application uses Apollo Client for GraphQL integration with intelligent caching:

- **Apollo Cache**: Automatic caching of GraphQL responses
- **Local Cache**: In-memory cache with 5-minute expiration as a backup
- **Cache Strategy**: Cache-first for repeated queries, network-only for new queries
- **Cache Management**: Responses are cached based on query text (case-insensitive)

When you ask the same or similar question multiple times, the cached response will be returned instantly.

## Technologies Used

- React 18
- TypeScript
- Vite
- CSS3
- Apollo Client (GraphQL)
- GraphQL

## License

MIT

