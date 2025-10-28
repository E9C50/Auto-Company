# websh: A Shell for the Web

## Vision

A shell where URLs are paths and the DOM is your filesystem. You navigate to a URL, and commands operate on the cached page content—instantly, locally, no refetching.

```
websh> cd https://news.ycombinator.com
websh> ls                    # list links
websh> grep "AI" | head 5    # filter
websh> cat .title            # CSS selector extraction
websh> follow 3              # navigate to 3rd link
```

The web becomes a computing environment you explore with familiar commands.

---

## Design Principles

1. **Fetch once, operate locally** — `cd` fetches and caches; all other commands work on cache
2. **Flat cache structure** — URLs become flat filenames (slashes → dashes)
3. **You ARE the shell** — Claude embodies websh, maintaining session state
4. **Composable primitives** — small commands that pipe together
5. **Familiar UX** — Unix-like commands adapted for web semantics

---

## Directory Structure

### Skill files (in this directory)

```
prose/skills/websh/
├── SKILL.md              # Activation triggers, command routing
├── PLAN.md               # This file
├── shell.md              # Core shell semantics (you ARE websh)
├── commands.md           # Command reference (ls, cat, grep, etc.)
├── state/
│   └── cache.md          # Cache management and format
└── help.md               # User help and examples
```

### User state (in working directory)

```
.websh/
├── session.md            # Current session state (pwd, history)
├── cache/
│   ├── {url-slug}.html       # Raw HTML
│   ├── {url-slug}.parsed.md  # Iterative extraction (by haiku)
│   └── index.md              # URL → slug mapping, fetch times
├── history.md            # Command history
└── bookmarks.md          # Saved locations
```

### Cache filename convention

URLs flatten to readable slugs:
- `https://news.ycombinator.com` → `news-ycombinator-com`
- `https://x.com/deepfates/status/123` → `x-com-deepfates-status-123`
- `https://techcrunch.com/2024/06/25/article-name/` → `techcrunch-com-2024-06-25-article-name`

Each cached URL gets two files:
- `{slug}.html` — raw HTML
- `{slug}.parsed.md` — iterative extraction

The `index.md` maps full URLs to slugs and tracks fetch/extraction status.

---

## Core Commands

| Command | Description | Operates On |
|---------|-------------|-------------|
| `cd <url>` | Navigate to URL, fetch & extract (async) | Network → Cache → Haiku extraction |
| `pwd` | Show current URL | Session |
| `ls [selector]` | List links or elements | Cache |
| `cat <selector>` | Extract text content | Cache |
| `grep <pattern>` | Filter by text/regex | Cache |
| `head <n>` / `tail <n>` | Slice results | Pipe |
| `follow <n\|text>` | Navigate to nth link or matching text | Cache → Network |
| `back` | Go to previous URL | Session history |
| `refresh` | Re-fetch current URL | Network → Cache |
| `stat` | Show page metadata (title, links count, etc.) | Cache |
| `save <path>` | Save current page to file | Cache → Filesystem |
| `history` | Show navigation history | Session |
| `bookmarks` | List saved locations | User state |
| `bookmark [name]` | Save current URL | User state |

### Planned extensions

| Command | Description |
|---------|-------------|
| `diff <url1> <url2>` | Compare two pages |
| `watch <url>` | Poll for changes |
| `form <selector>` | Interact with forms |
| `click <selector>` | Simulate click (JS-heavy sites) |
| `mount <api> <path>` | Mount API as virtual directory |

---

## The `cd` Flow: Fetch + Extract

When the user runs `cd <url>`, websh performs a two-phase operation:

### Phase 1: Fetch (synchronous)

```
cd https://news.ycombinator.com
   │
   ├─→ WebFetch the URL
   ├─→ Save raw HTML to .websh/cache/{hash}.html
   ├─→ Update index.json with URL → hash mapping
   └─→ Update session.md with new pwd
```

The user sees: `fetching... done`

### Phase 2: Extract (async haiku subagent, iterative)

Immediately after fetch, spawn a background haiku agent that **loops** to build up a rich markdown extraction:

```
Task({
  description: "websh: iterative page extraction",
  prompt: "<extraction prompt - see below>",
  subagent_type: "general-purpose",
  model: "haiku",
  run_in_background: true
})
```

The haiku agent runs an **iterative intelligent parse**:

```
loop until **extraction is thorough**:
  1. Read the raw .html
  2. Read current .parsed.md (if exists)
  3. Identify what's missing or could be richer
  4. Append/update the .parsed.md with new findings
  5. Repeat until diminishing returns
```

Each pass focuses on different aspects:
- **Pass 1**: Basic structure (title, main headings, link inventory)
- **Pass 2**: Content extraction (article text, comments, key quotes)
- **Pass 3**: Metadata and context (author, date, related links, site structure)
- **Pass 4+**: Edge cases, missed content, cleanup

**Output: `.websh/cache/{hash}.parsed.md`**

```markdown
# https://news.ycombinator.com

Fetched: 2026-01-24T10:30:00Z
Extraction: 3 passes

## Summary

Hacker News front page. Tech news aggregator with user-submitted links
and discussions. 30 stories visible, mix of Show HN, technical articles,
and industry news.

## Links

| # | Title | Points | Comments |
|---|-------|--------|----------|
| 0 | Show HN: I built a tool for... | 142 | 87 |
| 1 | The State of AI in 2026 | 891 | 432 |
| 2 | Why Rust is eating the world | 234 | 156 |
...

## Navigation

- [new](/newest) - Newest submissions
- [past](/front) - Past front pages
- [comments](/newcomments) - Recent comments
- [ask](/ask) - Ask HN
- [show](/show) - Show HN
- [jobs](/jobs) - Jobs

## Content Patterns

This is a link aggregator. Each story has:
- Title (class: .titleline)
- Points and submitter (class: .score, .hnuser)
- Comment count (links to /item?id=...)
- Domain in parentheses

## Raw Text Snippets

### Top Stories
1. "Show HN: I built a tool for..." - 142 points, 87 comments
2. "The State of AI in 2026" - 891 points, 432 comments
...

## Forms

- Search: input[name=q] at /hn.algolia.com
- Login: /login (username, password)

## Notes

- No images on front page (text-only design)
- Mobile-friendly, minimal CSS
- Stories refresh frequently
```

**User experience:**

```
news.ycombinator.com> cd https://example.com

fetching... done
extracting... (pass 1)

example.com> ls

# Shows what's available so far
# Agent continues extracting in background
# Subsequent commands get richer data as passes complete
```

### Why iterative?

- **Progressive richness**: First pass gives basics fast, later passes add depth
- **Intelligent focus**: Haiku decides what to extract based on page type
- **Human-readable output**: Markdown is inspectable, debuggable, useful
- **Graceful degradation**: Commands work after pass 1, improve with more passes
- **Site-aware**: Haiku recognizes patterns (HN stories, tweets, blog posts) and adapts

### Why haiku?

- **Fast**: Each pass completes quickly
- **Cheap**: Multiple passes still economical
- **Parallel**: Doesn't block user commands
- **Smart**: Adapts extraction strategy to content type

---

## State Management

### Session state (`session.md`)

Tracks the current shell session:

```markdown
# websh session

pwd: https://news.ycombinator.com
started: 2026-01-24T10:30:00Z
