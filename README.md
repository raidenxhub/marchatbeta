# MAR Chat

<div align="center">
  <img src="public/favicon.svg" alt="MAR Chat Logo" width="120" height="120">
  
  ### Free, Open-Source AI Assistant
  
  **Multimodal AI Reasoning** • [gomarai.com](https://gomarai.com)
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)
</div>

---

## ✨ Features

- 🚀 **Free Forever** - No subscriptions, no usage limits
- 🔒 **Privacy First** - Your conversations stay private
- 🧠 **Multiple AI Models** - MAR Beta, MAR Pro, MAR Deep Research
- 📝 **Rich Markdown** - Syntax highlighting, tables, LaTeX
- 💬 **Streaming Responses** - Real-time AI responses
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode
- 📱 **PWA Support** - Installable on any device
- 🔌 **Extensible** - Plugin system (coming soon)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Google Gemini API (2.0 Flash, 1.5 Pro)
- **State**: Zustand with persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google AI Studio API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gomarai/mar-chat.git
   cd mar-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Set up the database**
   - Go to your Supabase dashboard
   - Run the SQL from `supabase/schema.sql` in the SQL editor

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🔑 Getting API Keys

### Google Gemini API
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new key (it's free!)

### Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API to find your keys

## 📁 Project Structure

```
mar-chat/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   └── chat/          # Chat API with streaming
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main chat page
├── components/
│   ├── chat/              # Chat components
│   │   ├── chat-input.tsx
│   │   ├── chat-message.tsx
│   │   ├── model-selector.tsx
│   │   └── welcome-screen.tsx
│   ├── layout/            # Layout components
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── providers/         # React providers
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── ai/                # AI integrations
│   │   └── gemini.ts      # Gemini API client
│   ├── store/             # Zustand stores
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   └── utils.ts           # Utility functions
├── public/                # Static assets
└── supabase/              # Database schema
```

## 🎨 Customization

### Themes
Edit `tailwind.config.ts` to customize colors and styling.

### Models
Add or modify models in `lib/types/chat.ts`.

### Personas
Customize AI behavior in `lib/ai/gemini.ts`.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) for the AI models
- [Supabase](https://supabase.com) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) for UI components
- [Vercel](https://vercel.com) for hosting

---

<div align="center">
  <p>Built with ❤️ by <a href="https://gomarai.com">MAR AI</a></p>
  <p>Free. Open. Private. Yours.</p>
</div>
