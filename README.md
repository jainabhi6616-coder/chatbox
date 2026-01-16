# Chatbot App

A modern, responsive chatbot application built with React and TypeScript.

## Features

- 🎨 Modern and clean UI design
- 💬 Real-time chat interface
- 📱 Fully responsive design
- ⚡ Built with Vite for fast development
- 🔷 TypeScript for type safety
- 🎯 Smooth animations and transitions

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

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
levi/
├── src/
│   ├── components/
│   │   ├── Chatbot.tsx      # Main chatbot component
│   │   └── Chatbot.css      # Chatbot container styles
│   ├── shared/
│   │   └── components/      # Reusable UI components
│   │       ├── ChatHeader/  # Chat header component
│   │       ├── Message/     # Individual message component
│   │       ├── ChatInput/   # Input component
│   │       └── MessagesList/ # Messages list component
│   ├── hooks/
│   │   └── useChatbot.ts    # Custom hook for chatbot logic
│   ├── interfaces/
│   │   └── message.interface.ts # TypeScript interfaces
│   ├── constants/
│   │   └── app.constants.ts # Application constants
│   ├── utils/
│   │   ├── message.utils.ts # Message utility functions
│   │   ├── date.utils.ts    # Date formatting utilities
│   │   └── scroll.utils.ts  # Scroll utility functions
│   ├── App.tsx               # Root app component
│   ├── App.css               # App styles
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
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
- **Backend Integration**: Replace the simulated bot response in `useChatbot.ts` with API calls

## Technologies Used

- React 18
- TypeScript
- Vite
- CSS3

## License

MIT

