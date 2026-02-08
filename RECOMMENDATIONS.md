# MAR Chat: Roadmap to Beat ChatGPT, Gemini & Claude

## ✅ Completed Fixes
- **SparkleLoader**: Fixed JSX syntax (ternary instead of `&&` fragment)
- **Page title**: Set to "MAR Chat" in layout metadata
- **Single model**: GPT-4o-mini only, no model selection UI

---

## Full-Stack Recommendations

### Backend & AI

| Area | Suggestion | Why it matters |
|------|------------|----------------|
| **Multi-provider routing** | (Optional) Route by task for future scaling | Best model per use case; currently single model |
| **Conversation memory** | Persist preferences (e.g. "prefer direct answers", "Python") in context | Personalization without extra prompts |
| **Streaming robustness** | Retries with exponential backoff for transient API failures | Fewer "something went wrong" errors |
| **Context trimming** | Summarize older turns when approaching token limit | Longer chats without hitting limits |
| **RAG over history** | Index past chats/artifacts for logged-in users | Context-aware follow-ups |
| **Tool parallelism** | Run independent tools in parallel (e.g. search + weather) | Faster responses when multiple tools are needed |

### Tools & Capabilities

| Area | Suggestion | Why it matters |
|------|------------|----------------|
| **Image input** | Accept image uploads for OCR, diagrams, screenshots | Same capabilities as GPT-4o/Claude |
| **File parsing** | PDF/DOCX/XLSX parsing (e.g. via API or server-side libs) | Handle document-heavy workflows |
| **Send attachments** | Include pasted/uploaded images in API calls | Make attachments actually affect responses |
| **Code execution feedback** | Stream sandbox output as it runs | Real-time feedback instead of end-only |
| **Calendar/notes** | Integrations with Google Calendar, Notion | Move from chat into action |

### Frontend & UX

| Area | Suggestion | Why it matters |
|------|------------|----------------|
| **Streaming markdown** | Render markdown progressively during streaming | Feels more responsive |
| **Message actions** | Copy, Edit & resend, Branch, "Explain", "Simplify", "Continue" | Power-user controls like competitors |
| **Inline editing** | Edit user messages and regenerate from there | Easier iteration |
| **Artifact inline preview** | Show HTML/code preview in chat with "Open in panel" | Claude-style artifact flow |
| **Search** | Full-text search over conversations and artifacts | Find past content quickly |
| **Keyboard-first** | Cmd+K command palette, consistent shortcuts | Faster navigation |
| **Skeleton loaders** | Skeleton placeholders during streaming | Less empty space, clearer loading |
| **Error recovery** | Clear, actionable error messages + retry buttons | Fewer dead ends |

### Data & Persistence

| Area | Suggestion | Why it matters |
|------|------------|----------------|
| **Supabase sync** | Persist conversations & artifacts for logged-in users | Cross-device continuity |
| **Export** | Markdown/JSON export for conversations | Migration and backup |
| **Import** | Import from ChatGPT/Claude/Gemini exports | Easier switching |
| **Offline queue** | Queue messages when offline, send when back | More reliable in poor connectivity |

### Mobile & Performance

| Area | Suggestion | Why it matters |
|------|------------|----------------|
| **PWA** | Installable app, offline shell | App-like experience on mobile |
| **Optimistic updates** | Add user messages immediately, show "Thinking…" | Faster perceived response |
| **Image optimization** | Compress/optimize images before send | Lower bandwidth, faster uploads |
| **Code splitting** | Lazy-load heavy components (e.g. artifact panel) | Faster initial load |
| **Usage display** | Optional token/usage for power users | Transparency and debugging |

### Differentiation (MAR Advantage)

| Area | Suggestion | Why it matters |
|------|------------|----------------|
| **Single MAR voice** | One assistant (GPT-4o-mini), mode toggles only—no model selection | Simpler and more consistent |
| **Proactive defaults** | Suggest next steps, remember context | Less repetitive prompting |
| **Artifacts first-class** | Preview, version, copy, download in chat | Stronger creation workflow |
| **Privacy controls** | Incognito, local-only, clear data policies | Trust and compliance |
| **Transparency** | Show when tools are used, what's searched | Explainability and trust |

### Quick Wins (High impact, low effort)

1. **Send attachments to API** – Wire pasted/uploaded files into the chat request
2. **Progressive markdown** – Render markdown as it streams
3. **Copy/Edit on messages** – Add these actions to assistant messages
4. **Better titles** – Use last user message for auto-generated titles
5. **Retry on failure** – Automatic retry with backoff for 5xx/timeouts

### Longer-Term Bets

1. **Voice input/output** – Microphone + TTS for hands-free use
2. **Collaborative chats** – Share conversations, multi-user editing
3. **Plugins/extensions** – Third-party integrations (Slack, Notion, etc.)
4. **Fine-tuned MAR** – Domain-specific models for power users
5. **Local models** – Optional on-device inference for privacy

---

## Priority Order

1. **P0** – Send attachments, retries, error recovery
2. **P1** – Progressive markdown, message actions
3. **P2** – Image input, Supabase sync, search
4. **P3** – Multi-provider routing, RAG, voice
