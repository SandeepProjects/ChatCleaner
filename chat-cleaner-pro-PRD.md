# Chat Cleaner Pro — Product Requirements Document (PRD)

> Source app: **AI Chat Cleaner** (https://message-de-clutter.lovable.app)
> Goal: A more polished, faster, more capable clone called **Chat Cleaner Pro**.
> Single-page utility that takes a messy pasted AI conversation (ChatGPT, Claude, Perplexity, Grok) and returns a clean prompt + clean response, copyable and downloadable.

---

## 1. Executive Summary

**What it is:** A free, single-page web utility that takes a messy copy/paste from any major AI chat (ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, etc.) and extracts a clean "Original Prompt" and "Clean Response" pair using an LLM. Output is copyable, downloadable as Markdown, and free of UI artifacts ("You said:", "Copy", "Regenerate", source chips, "Searched X sources", etc.).

**Who it serves:** Content creators, prompt engineers, students, researchers, devs, course authors, and anyone who shares AI chats in docs, blogs, tweets, Notion, or Slack.

**Main business goal:** Become the default "paste → clean → share" tool for AI conversations; drive recurring use and word-of-mouth via shareable clean Markdown.

**Primary conversion goal:** A user pastes a conversation and clicks **Clean & Extract** at least once (activation).

**What needs to be rebuilt:**
- Landing/tool page (single-page app)
- Server endpoint that calls an LLM gateway to extract `{ original_prompt, clean_response, platform }`
- Copy + Markdown download
- Polished design system, SEO metadata, social share image, favicon
- New for Pro: history (local), multi-turn mode, platform auto-detect badge, raw vs rendered toggle, share link, keyboard shortcuts

---

## 2. Website Purpose and Target Audience

- **Purpose:** Remove the friction of cleaning up copied AI chats before sharing or archiving.
- **Target users:**
  - Creators publishing AI prompt/response examples
  - Devs documenting bug repros from ChatGPT/Claude
  - Researchers building prompt datasets
  - Students/teachers sharing study answers
- **User needs:** Fast, accurate extraction; preserved code blocks/lists/tables; one-click copy; portable Markdown; zero account required.
- **Business goals:** High repeat usage, low cost-per-clean, organic SEO traffic on "clean chatgpt copy paste", "extract chatgpt conversation", etc.
- **Primary CTA:** "Clean & Extract"
- **Secondary CTAs:** "Copy", "Download .md", "Try an example"
- **Key conversion points:**
  1. Paste action (engagement)
  2. Clean click (activation)
  3. Copy/Download (value delivered)
  4. Repeat session within 7 days (retention)

---

## 3. Full Sitemap

| Page | Path | Objective | Main sections | Primary CTA | Secondary CTA | Internal links | SEO purpose |
|------|------|-----------|---------------|-------------|---------------|----------------|-------------|
| Home / Tool | `/` | Clean a pasted chat | Hero, Paste card, Result, Examples, How it works, FAQ, Footer | Clean & Extract | Copy, Download | /about, /privacy, /faq | Primary ranking page |
| About | `/about` | Trust + story | Mission, How it works, Tech | Try the tool | — | / | Brand searches |
| FAQ | `/faq` | Answer objections | Q&A list | Try the tool | — | / | Long-tail SEO |
| Privacy | `/privacy` | Legal | Data handling | — | — | / | Trust/compliance |
| Terms | `/terms` | Legal | ToS | — | — | / | Trust/compliance |
| 404 | `*` | Recover | Heading, Go home | Go home | — | / | UX safety |

> v1 can ship `/` + `/privacy` + `/terms` + 404 only; About/FAQ are Phase 2.

---

## 4. User Flows

**4.1 First-time visitor**
Land on `/` → see hero + paste box → click "Try an example" (fills textarea) → click **Clean & Extract** → see Result card with platform badge → click Copy or Download.

**4.2 Homepage → conversion**
Paste → char counter updates → Clean → loading state → Result panels render → Copy/Download → Toast confirms.

**4.3 Mobile flow**
Sticky header → textarea fills viewport width → Clean button is full width and pinned bottom of card → Result stacks vertically; Copy/Download are icon-first.

**4.4 Error flow**
Empty paste → toast "Paste a conversation first" (no API call).
API 402 → toast "AI credits exhausted…" + inline help link.
API 429 → toast "Rate limit reached. Try again shortly."
Network failure → toast "Network error" + Retry button on result area.

**4.5 Success flow**
Result renders → success toast on copy/download → action button shows checkmark for 1.5s → focus moves back to textarea (Pro: ⌘/Ctrl+Enter to re-clean).

**4.6 Returning visitor (Pro)**
Sees last 5 cleans in a collapsible "History" drawer (localStorage) → can re-open any prior result.

---

## 5. Page-by-Page Requirements

### 5.1 Home `/`

**Objective:** Convert a paste into a clean prompt+response.
**User intent:** "I copied an AI chat and I want it cleaned."
**Primary CTA:** Clean & Extract  **Secondary CTAs:** Copy, Download .md, Try example, Clear.

**Sections:**

1. **Hero**
   - Pill badge: "Powered by AI" with Sparkles icon
   - H1: "Clean any AI chat in one click"
   - Subhead: "Paste a messy conversation from ChatGPT, Claude, Perplexity, or Grok — get a clean prompt and response, ready to share."
   - Centered, max-width 768px, vertical padding 64–96px desktop / 40px mobile.
   - Animation: subtle gradient text + fade-up on load (150ms, ease-out).

2. **Paste card**
   - Header row: "Paste conversation" left, "Try example" + "Clear" right (icons + label).
   - Textarea: monospace, min-height 240px desktop / 200px mobile, resize-y.
   - Footer row: live char counter (left), **Clean & Extract** gradient button (right).
   - Hover/focus: card shadow elevates from `--shadow-sm` → `--shadow-elegant`.
   - Disabled state when textarea empty.

3. **Result**
   - Visible only after success.
   - Header: "Result" + platform Badge (ChatGPT / Claude / Perplexity / Grok / Other) + Download .md button.
   - Two stacked cards: **Original Prompt** and **Clean Response** — each has its own header with Copy button and a `<pre>` content area with `whitespace-pre-wrap`, max-height 320/600px, scrollable.
   - Pro additions: toggle "Rendered Markdown ↔ Raw text", "Share link" button (Pro stretch).

4. **Examples row** (new vs. source)
   - 4 chips: "ChatGPT", "Claude", "Perplexity", "Grok" — clicking loads a representative messy paste into textarea.

5. **How it works**
   - 3 steps with icons: Paste → Clean → Copy.

6. **FAQ accordion** (5 entries, see Content Inventory).

7. **Footer**
   - Left: "© Chat Cleaner Pro" + tagline.
   - Right: links Privacy, Terms, About.

**Desktop:** max-width 1024px (`max-w-4xl`), single column, 16px gutter.
**Tablet:** same single column, 24px gutter.
**Mobile:** 16px gutter, full-width cards, Clean button full-width.

**Accessibility:** All buttons have `aria-label`; Textarea has visible label "Paste conversation"; focus rings always visible; color contrast ≥ 4.5:1; live region announces "Cleaning…" and "Result ready".

### 5.2 Privacy `/privacy`
- H1 "Privacy"
- Body explains: no account, pasted text sent only to the AI provider for extraction, not stored server-side, cleared on page reload; localStorage history is local-only.

### 5.3 Terms `/terms`
- H1 "Terms"
- "Use at your own risk; do not paste secrets; AI output may be imperfect; service provided as-is."

### 5.4 404
- H1 "404", subline, "Go home" button.

---

## 6. Design System

**Brand personality:** Calm, technical, premium-utility (think Linear × Raycast × Vercel).
**Visual tone:** Clean, slightly futuristic, minimal chrome, high typography contrast.

**Color palette (OKLCH; map to CSS variables in `src/styles.css`):**

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(0.99 0.005 250)` (#FBFBFD) | `oklch(0.15 0.02 260)` (#0E1117) |
| `--foreground` | `oklch(0.18 0.02 260)` (#15181F) | `oklch(0.96 0.01 250)` (#F2F3F5) |
| `--card` | `oklch(1 0 0)` (#FFFFFF) | `oklch(0.2 0.02 260)` (#171A21) |
| `--muted-foreground` | `oklch(0.55 0.02 260)` (#6B7180) | `oklch(0.7 0.02 260)` (#A1A6B5) |
| `--border` | `oklch(0.92 0.01 260)` (#E6E8EE) | `oklch(0.3 0.02 260)` (#262A33) |
| `--primary` | `oklch(0.58 0.21 275)` (~#5B5BF7 indigo) | same |
| `--primary-glow` | `oklch(0.72 0.18 320)` (~#C56BF5 violet) | same |
| `--accent` | `oklch(0.78 0.16 195)` (~#3FD4D4 teal) | same |
| `--destructive` | `oklch(0.6 0.22 25)` (~#E5484D) | same |
| `--gradient-primary` | `linear-gradient(135deg, var(--primary), var(--primary-glow))` | |
| `--gradient-surface` | `linear-gradient(180deg, var(--background), color-mix(in oklab, var(--primary) 4%, var(--background)))` | |
| `--shadow-sm` | `0 1px 2px color-mix(in oklab, var(--foreground) 8%, transparent)` | |
| `--shadow-elegant` | `0 12px 40px -12px color-mix(in oklab, var(--primary) 25%, transparent)` | |

**Typography**
- Headings: **Geist** (or Inter as fallback), weight 600–700, letter-spacing -0.02em.
- Body: **Inter**, weight 400/500.
- Mono: **JetBrains Mono** (for textarea + result pre).
- Scale: 12 / 14 / 16 / 18 / 24 / 32 / 48 / 64. Line-heights 1.2 (display), 1.5 (body).

**Buttons**
- Sizes: sm 32px / md 40px / lg 48px.
- Variants: `primary` (gradient bg, white text, `--shadow-elegant`), `outline`, `ghost`, `destructive`.
- Radius: 10px.

**Radius scale:** 6 / 10 / 14 / 999.
**Shadow scale:** sm, md, elegant (see above), focus ring `0 0 0 3px color-mix(in oklab, var(--primary) 30%, transparent)`.
**Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 96.
**Container width:** 1024px (`max-w-4xl`) for tool, 768px for legal pages.
**Icons:** `lucide-react`, stroke 1.75, size 16/18.
**Cards:** 1px border, radius 14, subtle inner divider for headers.
**Forms:** 1px border, focus ring as above, 12px padding.
**Animations:** 150–250ms ease-out; fade-up 8px; button press scale 0.98; no parallax.

---

## 7. Component Library

| Component | Purpose | Props | States |
|---|---|---|---|
| `Navbar` (minimal) | Brand + theme toggle | none | default |
| `Footer` | Legal + links | none | default |
| `Hero` | Title/subtitle | `title`, `subtitle`, `badge` | default |
| `Button` | Actions | `variant`, `size`, `disabled`, `loading` | default/hover/active/focus/disabled/loading |
| `Card` | Container | `as`, `padding` | default/hover |
| `Badge` | Platform tag | `variant`, `children` | default |
| `Textarea` | Paste input | `value`, `onChange`, `placeholder` | default/focus/disabled/error |
| `CopyButton` | Copy text | `text` | default/copied |
| `DownloadButton` | Markdown export | `filename`, `markdown` | default |
| `ExamplesRow` | Quick fills | `onPick(example)` | default/hover |
| `HowItWorks` | 3-step explainer | `steps[]` | default |
| `FAQAccordion` | Q&A | `items[]` | collapsed/expanded |
| `Toast` (sonner) | Feedback | — | success/error/info |
| `Loader` | Spinner | `size` | spinning |
| `EmptyState` | Pre-paste hint | — | default |
| `ErrorState` | API failure | `error`, `onRetry` | default |
| `HistoryDrawer` (Pro) | Recent cleans | `items[]` | open/closed/empty |
| `ThemeToggle` | Light/dark | — | light/dark/system |
| `PlatformBadge` | Auto-detect | `platform` | each value |

All components: keyboard navigable, `:focus-visible` ring, ARIA roles, reduced-motion respected.

---

## 8. Functional Requirements

**FR-001: Paste & character counter**
Description: User types/pastes text into the input. A live counter shows character count.
User story: As a user, I see how big my paste is so I know it's within limits.
Acceptance: Counter updates within 16ms; capped at 200,000 chars; over-limit shows red counter and disables Clean.
Priority: Must.  Dependencies: none.  Edges: paste of 1MB text → trim or block with toast.

**FR-002: Clean & Extract**
Description: Calls server function `extractChat({ text })` which calls Lovable AI gateway and returns `{ originalPrompt, cleanResponse, platform }`.
User story: As a user, I click one button to clean my paste.
Acceptance: Button disabled while empty or loading; spinner + "Cleaning…" label; result renders within 10s P95; JSON parse fallback strips code fences.
Priority: Must.  Edges: model returns malformed JSON → retry once with stricter "JSON only" instruction; second failure surfaces toast with raw error.

**FR-003: Platform auto-detect**
Description: Model returns `platform ∈ {ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, Other}`.
Acceptance: Badge displays returned value; unknown values fall back to "Other".
Priority: Must.

**FR-004: Copy buttons**
Description: One-click copy for Original Prompt and Clean Response.
Acceptance: Uses `navigator.clipboard.writeText`; success toast; icon swaps to check for 1.5s.
Priority: Must.

**FR-005: Markdown download**
Description: Downloads `cleaned-chat-<timestamp>.md` containing platform, prompt, response sections.
Acceptance: Blob is `text/markdown;charset=utf-8`; filename uses ISO-like timestamp; works in all evergreen browsers.
Priority: Must.

**FR-006: Examples**
Description: Four example chips populate the textarea with a representative messy paste per platform.
Acceptance: Clicking replaces textarea content and focuses it.
Priority: Should.

**FR-007: Clear textarea**
Description: Trash icon clears the input and the prior result.
Acceptance: Visible only when text length > 0; confirms via toast "Cleared".
Priority: Should.

**FR-008: Error surfaces**
Description: 429 / 402 / network errors render specific toasts.
Acceptance: No silent failures; retries are user-initiated.
Priority: Must.

**FR-009: Keyboard shortcuts (Pro)**
Description: ⌘/Ctrl+Enter triggers Clean; Esc clears focus.
Priority: Should.

**FR-010: Local history (Pro)**
Description: Last 10 cleans stored in localStorage `chat-cleaner-pro/history` as `{ id, ts, platform, originalPrompt, cleanResponse, sourceTextPreview }`.
Acceptance: Drawer lists items newest-first; clicking restores into the Result; "Clear all" button.
Priority: Should.

**FR-011: Theme (Pro)**
Description: Light/dark/system toggle, persisted in localStorage.
Priority: Should.

**FR-012: SEO metadata**
Description: Per-route `<title>`, description, OG image, canonical, JSON-LD `SoftwareApplication`.
Priority: Must.

**FR-013: Analytics (privacy-friendly)**
Description: Page view + `clean_clicked` + `copy_clicked` + `download_clicked` events (e.g., Plausible).
Priority: Should.

**FR-014: Rate limiting (server)**
Description: 20 requests / IP / hour to prevent abuse.
Acceptance: Returns 429 with Retry-After header.
Priority: Should.

**FR-015: Cookie banner**
Description: Not required if no analytics cookies; otherwise minimal banner per region.
Priority: Nice.

---

## 9. Non-Functional Requirements

- **NFR-001 Performance:** LCP < 1.8s on 4G mobile; CLS < 0.05; bundled JS < 180KB gzip for the tool route.
- **NFR-002 Accessibility:** WCAG 2.1 AA; keyboard-only path for paste → clean → copy → download; focus-visible everywhere; reduced-motion respected.
- **NFR-003 SEO:** Per-route title/meta, OG/Twitter cards, sitemap.xml, robots.txt, valid JSON-LD.
- **NFR-004 Security:** No PII storage; server-only API key; CSP; rate-limit; input length cap; sanitize before render (output rendered as text, not HTML).
- **NFR-005 Browser support:** Latest 2 versions of Chrome, Edge, Safari, Firefox; iOS 16+, Android 10+.
- **NFR-006 Mobile responsiveness:** Layout intact 320–1920px.
- **NFR-007 Image optimization:** OG image AVIF/WebP, ≤ 200KB.
- **NFR-008 Error handling:** All async paths have try/catch + user-visible message.
- **NFR-009 Maintainability:** TypeScript strict; ESLint+Prettier; semantic tokens only (no hex in components).
- **NFR-010 Scalability:** Stateless server functions; CDN-cached static assets; AI gateway streaming optional.
- **NFR-011 Deployment:** Single-command deploy; preview URL per PR.

---

## 10. Content Inventory

- **SEO title (home):** "Chat Cleaner Pro — Clean & Extract ChatGPT, Claude, Perplexity, Grok"
- **Meta description:** "Paste any messy AI conversation and instantly get a clean prompt and response. Free, no signup, works with ChatGPT, Claude, Perplexity, and Grok."
- **OG title:** "Clean any AI chat in one click"
- **OG description:** "From messy copy-paste to share-ready Markdown in seconds."
- **H1:** "Clean any AI chat in one click"
- **H2s:** "Paste conversation", "Result", "Examples", "How it works", "FAQ"
- **H3s:** "Original Prompt", "Clean Response", step titles ("Paste", "Clean", "Copy")
- **Button text:** "Clean & Extract", "Copy", "Copied", "Download .md", "Try example", "Clear", "Go home", "Try again"
- **Placeholders:** "Paste here. Example: You said: What's the capital of France? ChatGPT said: The capital of France is Paris…"
- **Validation messages:** "Paste a conversation first", "Too long — max 200,000 characters", "Network error — please retry"
- **Footer:** "© <year> Chat Cleaner Pro. Built for fast, accurate conversation cleanup."
- **Legal links:** Privacy, Terms, About
- **FAQ (5):**
  1. *Does it store my conversation?* — No, content is sent to the AI provider for extraction and not stored.
  2. *Which platforms work?* — ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek, and most others.
  3. *Is it free?* — Yes, with fair-use rate limits.
  4. *Does it support code blocks?* — Yes, Markdown formatting inside fields is preserved.
  5. *Can I download the result?* — Yes, as a `.md` file.
- **Alt text examples:** "Chat Cleaner Pro logo", "Illustration of a clean chat transcript".

---

## 11. Technical Architecture

**Stack (preferred for this clone):**
- **TanStack Start v1** + React 19 + TypeScript (matches source app); Vite 7
- **Tailwind CSS v4** with semantic tokens in `src/styles.css`
- **shadcn/ui** primitives (Button, Card, Textarea, Badge, Accordion, Dialog, Tooltip)
- **lucide-react** icons, **sonner** toasts
- **Zod** validation
- **AI**: Lovable AI Gateway via `createServerFn`, model `google/gemini-2.5-flash` (fast/cheap) with optional fallback to `google/gemini-2.5-pro` on retry
- **Deployment**: Cloudflare Workers (template default) or Vercel
- **Analytics**: Plausible (cookieless)
- *(Alternate: Next.js 15 + App Router + Vercel AI SDK — equivalent capability.)*

**Folder structure:**
```
src/
  routes/
    __root.tsx          # head, shell, providers
    index.tsx           # tool page
    about.tsx
    faq.tsx
    privacy.tsx
    terms.tsx
  lib/
    extract.functions.ts  # createServerFn → AI gateway
    examples.ts           # canned messy pastes per platform
    history.ts            # localStorage helpers (Pro)
  components/
    ui/...                # shadcn primitives
    Hero.tsx
    PasteCard.tsx
    ResultPanels.tsx
    ExamplesRow.tsx
    HowItWorks.tsx
    FAQ.tsx
    Footer.tsx
    ThemeToggle.tsx
    HistoryDrawer.tsx
  styles.css
public/
  favicon.png
  og-image.png
  robots.txt
  sitemap.xml
```

**Routing:** File-based via TanStack Router; per-route `head()` for SEO.

**Component architecture:** Page composes Hero → PasteCard → ResultPanels → ExamplesRow → HowItWorks → FAQ → Footer. State is local React state; result memoized; no global store needed for v1.

**Data structure (result):**
```ts
type CleanResult = {
  originalPrompt: string
  cleanResponse: string
  platform: "ChatGPT" | "Claude" | "Perplexity" | "Grok" | "Gemini" | "DeepSeek" | "Other"
}
```

**API contract (server function):**
- `extractChat({ text: string (1..200000) }) -> CleanResult`
- Errors: 400 invalid input, 402 credits, 429 rate-limited, 500 generic.

**Environment variables (server-only):**
- `LOVABLE_API_KEY` (auto-provisioned)
- Optional: `RATE_LIMIT_PER_HOUR=20`, `PLAUSIBLE_DOMAIN`

**Form handling:** Controlled `<textarea>`; client-side length guard; server-side Zod re-validation.

**Asset management:** SVG/PNG in `public/`; OG image generated once (1200×630).

**SEO implementation:** Per-route `head()` (title/desc/OG/Twitter/canonical), JSON-LD `SoftwareApplication` on `/`, `sitemap.xml`, `robots.txt`.

**Deployment:** Auto deploy on push; preview URL per PR; production custom domain (e.g., `chatcleanerpro.app`).

---

## 12. Implementation Roadmap

**Phase 1 — Foundation (1 day)**
- Init TanStack Start template
- Define design tokens in `src/styles.css` (palette, gradients, shadows, radii)
- Install shadcn primitives needed
- Set up `__root.tsx` head defaults, favicon, fonts
- Acceptance: blank page renders with brand fonts and tokens.

**Phase 2 — Page Build (1–2 days)**
- Hero, PasteCard, ResultPanels, ExamplesRow, HowItWorks, FAQ, Footer
- Responsive layouts at 320/768/1024
- Acceptance: visual parity with mocks; Lighthouse mobile ≥ 90 perf.

**Phase 3 — Functionality (1–2 days)**
- `extractChat` server function + Zod
- Copy + Download buttons
- Examples wiring + Clear + toasts
- Pro: theme toggle, ⌘+Enter, history drawer, rate limiting
- Acceptance: end-to-end clean of ≥ 10 sample pastes succeeds.

**Phase 4 — QA & Launch (1 day)**
- a11y audit (axe), responsive sweep, SEO check, OG image, deploy
- Acceptance: all QA checklist items pass.

---

## 13. QA Checklist

- [ ] Desktop 1440 layout matches spec
- [ ] Tablet 768 layout reflows correctly
- [ ] Mobile 375 cards full-width, buttons reachable
- [ ] Tab order: textarea → Clear → Clean → Copy → Download
- [ ] Focus rings visible on every interactive element
- [ ] All buttons have `aria-label`
- [ ] Color contrast ≥ 4.5:1 in light & dark
- [ ] Empty submit shows toast, no network call
- [ ] 402/429/500 each show correct toast
- [ ] Copy works in Chrome/Safari/Firefox/Edge
- [ ] Download produces valid `.md` with both sections
- [ ] Sample pastes from each of 6 platforms extract correctly
- [ ] LCP < 1.8s on Moto G4-class throttling
- [ ] CLS < 0.05
- [ ] OG image renders in Twitter/Slack preview
- [ ] robots.txt + sitemap.xml present
- [ ] 404 route renders
- [ ] No console errors on initial load
- [ ] Reduced-motion disables fades

---

## 14. Risks, Assumptions, Missing Info

**Assumptions:**
- Lovable AI Gateway is available with sufficient credits in production.
- Users are willing to paste content into a third-party tool (privacy disclosed).
- `gemini-2.5-flash` is accurate enough for extraction; fallback model exists.

**Missing assets:**
- Final logo, OG image, favicon (placeholders described).
- Brand color confirmation (defaults proposed).

**Owner confirmations needed:**
- Domain name & branding ("Chat Cleaner Pro" placeholder).
- Analytics provider & cookie policy.
- Whether to keep server-side anonymous usage logs.

**Technical risks:**
- Model JSON drift → mitigated with retry + fenced-code stripping.
- Very large pastes → capped at 200k chars.
- Worker runtime limits on long requests → set 25s timeout, surface friendly error.

**Design risks:**
- Gradient text + low-contrast subhead can fail a11y; verify contrast in dark mode.

**Legal:**
- Make Privacy + Terms explicit; remind users not to paste secrets.

---

## 15. Developer Handoff Checklist

**Pages:** `/`, `/about`, `/faq`, `/privacy`, `/terms`, 404
**Components:** Hero, PasteCard, ResultPanels, CopyButton, DownloadButton, ExamplesRow, HowItWorks, FAQAccordion, Footer, ThemeToggle, HistoryDrawer, PlatformBadge, Toast, Loader, ErrorState
**Assets:** logo SVG, favicon.png, og-image (1200×630), 4 platform icons
**Content:** all copy from §10
**Integrations:** Lovable AI Gateway, Plausible (optional)
**Env vars:** `LOVABLE_API_KEY`, `RATE_LIMIT_PER_HOUR`, `PLAUSIBLE_DOMAIN`
**Testing:** unit (extract parser fallback), e2e (paste → clean → copy → download), a11y (axe), Lighthouse
**Deliverables:** deployed prod URL, preview URL, README with run/deploy steps, screenshots, Loom walkthrough

---

## 16. Build Prompt (for an AI coding agent)

> Build **Chat Cleaner Pro**, a single-page utility (TanStack Start + React 19 + TS + Tailwind v4 + shadcn/ui) that extracts a clean `{ originalPrompt, cleanResponse, platform }` from any pasted AI chat using a server function calling an OpenAI-compatible AI gateway (`google/gemini-2.5-flash`, JSON mode, with code-fence-stripping fallback).
>
> Implement the full PRD above: design tokens in `src/styles.css` (indigo→violet gradient primary, teal accent, OKLCH), Hero, PasteCard with live char counter and Clean & Extract gradient button, Result with platform Badge + per-card Copy buttons + global Download `.md`, Examples row (ChatGPT/Claude/Perplexity/Grok canned pastes), How it works (3 steps), FAQ accordion (5 items), Footer, 404, Privacy, Terms. Add ⌘/Ctrl+Enter to submit, light/dark theme toggle, localStorage history drawer (last 10), sonner toasts for success/empty/402/429/network errors, Zod input validation, 20 req/IP/hour rate limit on the server function, full per-route SEO (`<title>`, description, OG/Twitter, canonical, JSON-LD `SoftwareApplication`), `robots.txt`, `sitemap.xml`. Meet NFRs: WCAG 2.1 AA, LCP < 1.8s mobile, no hardcoded colors in components, TypeScript strict, ESLint clean. Ship to Cloudflare Workers (or Vercel), provide README + screenshots.
