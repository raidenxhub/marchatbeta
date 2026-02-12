# Competitor Analysis: ChatGPT, OpenAI, Claude

**Purpose:** Capture what to **take** (good) and **avoid** (bad) from each competitor so MAR Chat can be better than all of them.

---

## ChatGPT (chat.openai.com)

### ✅ GOOD — 15+ things to take / implement

1. **Skip to content** — Accessibility link at top; visible on focus only.
2. **Single hero line: "What can I help with?"** — Clear, repeated as main CTA.
3. **Chat history** — Sidebar labeled "Chat history" so users know where past chats live.
4. **Log in / Sign up for free** — Two clear CTAs; "free" reduces friction.
5. **Quick action chips** — Attach, Search, Study, Create image, Voice — one-tap entry points.
6. **Terms + Privacy in footer** — "By messaging ChatGPT... you agree to our Terms and have read our Privacy Policy."
7. **Cookie preferences** — Explicit link for consent/preferences.
8. **Minimal chrome** — No heavy hero imagery; chat-first above the fold.
9. **Dual H1 "What can I help with?"** — Reinforces primary action (we use one + subtitle).
10. **No pricing on chat page** — Chat product isn’t cluttered with plans.
11. **Simple nav** — Logo + Chat history + account; no product switcher on chat.
12. **Consistent placeholder** — Input matches hero message.
13. **Attach as first action** — Files/images are primary, not buried.
14. **Search as first-class** — Web search visible as a mode, not hidden in settings.
15. **Study / Create image / Voice** — Named modes so users know what’s possible.
16. **Short legal line** — One sentence with links; not a wall of text.
17. **No “Meet X” marketing** — Chat page doesn’t try to sell; it just lets you chat.

### ❌ BAD — 15+ things to avoid / fix

1. **Login wall for history/sync** — Requiring sign-in before trying can lose users; we allow anonymous then nudge.
2. **Heavy client bundle** — Large JS can slow first paint; we keep bundle lean and stream.
3. **Cookie banner fatigue** — If we add cookies, keep consent simple and dismissible.
4. **Duplicate H1s** — Two identical H1s can hurt SEO; we use one H1 + supporting line.
5. **No visible keyboard shortcut** — We have Cmd+K / command palette.
6. **“Sign up for free” can imply limits** — We emphasize “no subscriptions” instead.
7. **No explicit “no ads”** — We can state “No ads. No sponsored content.” like Claude.
8. **Study/Create image/Voice** — If we don’t have exact equivalents, we don’t overclaim; we label what we have (e.g. Attach, Search, Artifacts).
9. **Generic “Attach”** — We can clarify “Attach files or images” in tooltip/label.
10. **No download app CTA on chat** — We could add “Get the app” in footer or settings.
11. **Limited aria-live for stream** — We use role="status" and live regions for streaming.
12. **No “New chat” always visible** — We have sidebar + new chat; keep it obvious.
13. **History as sidebar only** — We match; avoid hiding history behind a second menu.
14. **No dark/light toggle on chat** — We support theme; keep it discoverable.
15. **Terms link off-domain** — We link to our own Terms/Privacy (e.g. gomarai.com) for trust.
16. **No “Message X” branding** — We use “Message MAR” or “What can I help with?” consistently.
17. **Single product focus on chat** — We don’t mix in Sora/API on the chat UI.

---

## OpenAI (openai.com)

### ✅ GOOD — 15+ things to take / implement

1. **Skip to main content** — Same accessibility pattern as ChatGPT.
2. **“What can I help with?” / “Message ChatGPT”** — Clear primary CTA.
3. **Product switcher** — ChatGPT, Sora, API Platform; we could add “MAR Chat” / “API” / “Docs” if we expand.
4. **Learn about ChatGPT Business** — Dedicated link for business value.
5. **Search with ChatGPT** — Direct link to search mode; we have web search and can surface it.
6. **Talk with ChatGPT** — Voice; we can add “Voice” or “Talk” when we support it.
7. **Research** — Link to research blog; we can link “Research” or “Blog” in footer.
8. **Recent news + “View more”** — Clear content hierarchy; we can add “News” or “Changelog” in footer.
9. **Stories + “View all”** — Social proof; we can add “Use cases” or “Stories” later.
10. **Latest research + “View all”** — We can link to gomarai.com/research or blog.
11. **OpenAI for business** — Section for B2B; we can add “For teams” or “Business” in footer.
12. **Get started with ChatGPT / Download** — Single CTA at bottom; we can add “Download app” in footer.
13. **Section headings** — Recent news, Stories, Latest research, Get started — scannable.
14. **Cards with image + title + category + read time** — We don’t need blog on chat page but can use this pattern for help/settings.
15. **Consistent nav** — Logo, main CTA, secondary links (Learn, Search, Talk, Research, More).
16. **More dropdown** — Keeps nav clean; we use command palette and sidebar.
17. **Footer-style CTA** — “Download” as final action; we can add “Get desktop app” or “API” in footer.
18. **No login required to see value** — Homepage shows product; we show chat immediately.

### ❌ BAD — 15+ things to avoid / fix

1. **Homepage is marketing-heavy** — Long scroll, many sections; our chat page stays chat-first.
2. **Too many imagery cards** — Slows load and distracts; we avoid image-heavy above-the-fold on chat.
3. **Product switcher on homepage** — Can confuse “do I use ChatGPT or API?”; we keep one primary product (MAR Chat).
4. **“Message ChatGPT”** — We say “Message MAR” or “What can I help with?” for our brand.
5. **Multiple products in one nav** — We don’t mix MAR Chat with unrelated products until we have them.
6. **Blog/news as primary content** — We don’t push blog above chat.
7. **No clear “Start chatting” above fold on homepage** — They have “Message ChatGPT”; we put input + CTA first.
8. **Read time on every card** — Nice but not critical for chat; we skip on chat UI.
9. **Stories are B2B case studies** — We can add later without making chat feel enterprise-only.
10. **Download only at bottom** — We can surface “App” in header or settings.
11. **Language/region in help** — We can add in settings/footer (Language, Region).
12. **Heavy use of “OpenAI”** — We use “MAR” consistently.
13. **Research link goes to blog** — We link to our own content or omit until we have it.
14. **No pricing on homepage** — Good; we don’t put pricing on chat page.
15. **Switch to (product)** — We don’t need “Switch to” until we have multiple apps.
16. **More dropdown** — We use command palette instead of duplicating nav.
17. **Footer is minimal on homepage** — We add Terms, Privacy, optional Help, Changelog, Download.

---

## Claude (claude.ai / anthropic.com)

### ✅ GOOD — 15+ things to take / implement

1. **“Think fast, build faster” / “Meet your thinking partner”** — Strong tagline; we have “What can I help with?” and can add a short tagline.
2. **Continue with Google / Email / SSO** — Multiple auth options; we support Google and magic link.
3. **Privacy + consent line** — “By continuing you acknowledge Privacy Policy and agree to product updates.”
4. **Explore plans** — Individual / Team and Enterprise tabs; we can add “Plans” or “For teams” in footer without pushing paywall.
5. **Free tier clearly $0** — “Free for everyone”; we say “Free. No subscriptions.”
6. **Feature bullets** — Chat on web/iOS/Android, Write/edit/create, Analyze text and images, Generate code, Web search, Integrations; we list features in metadata and welcome.
7. **FAQ** — “What is Claude?”, “What to use for?”, “How much?”; we can add FAQ in help or footer.
8. **“No ads. No sponsored content.”** — We explicitly add this in footer or welcome.
9. **“Ask Claude” CTA** — We have “What can I help with?” as equivalent.
10. **Write / Learn / Code / More tabs** — Example prompts by category; we have QuickChats (Code, Write, Learn, etc.).
11. **Download desktop** — macOS, Windows, Windows arm64; we can add “Download app” in footer.
12. **Try on mobile** — Apple, Google Play; we can add “Get iOS/Android app” when we have it.
13. **“Break down problems together”** — Value prop; we can add one short line under welcome.
14. **“Tackle your toughest work”** — We emphasize capability without overclaiming.
15. **“Explore what’s next”** — We can use “Explore” or “Discover” for quick chats.
16. **How you can use Claude** — Learn, Code, Research, Analyze, Create with examples; we have QUICK_CHAT_TOPICS.
17. **Example conversations with artifacts** — We have artifacts; we can show one example in welcome or help.
18. **Pricing transparency** — Free / Pro / Max with price; we stay free and say so clearly.
19. **“Try Claude” on each tier** — Single CTA; we have “What can I help with?” and Send.
20. **Frequently asked questions** — We can add 3–5 FAQs in settings or footer (What is MAR? What can I use it for? Is it free?).

### ❌ BAD — 15+ things to avoid / fix

1. **Sign-up wall before using** — Claude landing pushes sign-in; we allow chat first, then nudge to sign in for history.
2. **Pricing very prominent** — Can feel pushy; we don’t put pricing on chat page.
3. **Multiple product names** — “Claude” vs “Cowork” can confuse; we use “MAR” only.
4. **Landing is auth-first** — We are chat-first; auth is optional for first use.
5. **“Continue with Google” above the fold** — We show input and quick chats first.
6. **Long plan comparison** — We don’t need Pro/Max comparison on chat.
7. **FAQ as accordion** — We can add short FAQ in one place (e.g. Settings > Help or footer).
8. **Desktop/mobile download before chat** — We don’t require download to chat.
9. **“By continuing... promotional emails”** — We avoid promotional language; we say “product updates” only if we do.
10. **Team and Enterprise tab** — We don’t add until we have team product.
11. **Usage limits fine print** — We say “No limits” or “Generous limits” if true.
12. **Tax disclaimer on pricing** — Not needed when we’re free.
13. **“Try Claude” repeated** — We use “What can I help with?” and “Send.”
14. **Example prompts very long** — Ours are short; we don’t paste long templates in UI.
15. **Artifacts demo on landing** — We show artifacts in chat, not as hero on empty state.
16. **Voice mentioned but not primary** — We don’t mention voice until we support it.
17. **MCP/integrations in plan list** — We have tools; we don’t overlist in pricing-style layout.
18. **“Problem solvers” positioning** — We use “AI assistant” or “thinking partner” to be broader.

---

## Summary: What we implement

- **From all:** Skip to content, “What can I help with?”, Terms + Privacy footer, no sign-up wall, minimal pricing on chat.
- **From ChatGPT:** Quick action labels (Attach, Search, etc.), Chat history label, Cookie preferences link if we use cookies.
- **From OpenAI:** Clear section structure if we add footer links (Research, Download, Business), “View more” pattern for any lists.
- **From Claude:** “No ads. No sponsored content.”, FAQ (3–5 items), Download app + mobile links in footer, short value line (“Break down problems together” style).

See `docs/COMPETITOR_ANALYSIS.md` for this full list; implementation tracked in code and this file.
