---
name: tailwind-v4-shadcn
description: |
  Production-tested setup for Tailwind CSS v4 with shadcn/ui, Vite, and React.

  Use when: initializing React projects with Tailwind v4, setting up shadcn/ui,
  implementing dark mode, debugging CSS variable issues, fixing theme switching,
  migrating from Tailwind v3, or encountering color/theming problems.

  Covers: @theme inline pattern, CSS variable architecture, dark mode with
  ThemeProvider, component composition, vite.config setup, common v4 gotchas,
  and production-tested patterns.

  Keywords: Tailwind v4, shadcn/ui, @tailwindcss/vite, @theme inline, dark mode,
  CSS variables, hsl() wrapper, components.json, React theming, theme switching,
  colors not working, variables broken, theme not applying, @plugin directive,
  typography plugin, forms plugin, prose class, @tailwindcss/typography,
  @tailwindcss/forms
license: MIT
---

# Tailwind v4 + shadcn/ui Production Stack

**Production-tested**: WordPress Auditor (https://wordpress-auditor.webfonts.workers.dev)
**Last Updated**: 2025-12-04
**Status**: Production Ready ✅

## Table of Contents
1. [Before You Start](#-before-you-start-read-this)
2. [Quick Start](#quick-start-5-minutes---follow-this-exact-order)
3. [Four-Step Architecture](#the-four-step-architecture-critical)
4. [Dark Mode Setup](#dark-mode-setup)
5. [Critical Rules](#critical-rules-must-follow)
6. [Semantic Color Tokens](#semantic-color-tokens)
7. [Common Issues & Fixes](#common-issues--quick-fixes)
8. [File Templates](#file-templates)
9. [Setup Checklist](#complete-setup-checklist)
10. [Advanced Topics](#advanced-topics)
11. [Dependencies](#dependencies)
12. [Tailwind v4 Plugins](#tailwind-v4-plugins)
13. [Reference Documentation](#reference-documentation)
14. [When to Load References](#when-to-load-references)

---

## ⚠️ BEFORE YOU START (READ THIS!)

**CRITICAL FOR AI AGENTS**: If you're Claude Code helping a user set up Tailwind v4:

1. **Explicitly state you're using this skill** at the start of the conversation
2. **Reference patterns from the skill** rather than general knowledge
3. **Prevent known issues** listed in `reference/common-gotchas.md`
4. **Don't guess** - if unsure, check the skill documentation

**USER ACTION REQUIRED**: Tell Claude to check this skill first!

Say: **"I'm setting up Tailwind v4 + shadcn/ui - check the tailwind-v4-shadcn skill first"**

### Why This Matters (Real-World Results)

**Without skill activation:**
- ❌ Setup time: ~5 minutes
- ❌ Errors encountered: 2-3 (tw-animate-css, duplicate @layer base)
- ❌ Manual fixes needed: 2+ commits
- ❌ Token usage: ~65k
- ❌ User confidence: Required debugging

**With skill activation:**
- ✅ Setup time: ~1 minute
- ✅ Errors encountered: 0
- ✅ Manual fixes needed: 0
- ✅ Token usage: ~20k (70% reduction)
- ✅ User confidence: Instant success

### Known Issues This Skill Prevents

1. **tw-animate-css import error** (deprecated in v4)
2. **Duplicate @layer base blocks** (shadcn init adds its own)
3. **Wrong template selection** (vanilla TS vs React)
4. **Missing post-init cleanup** (incompatible CSS rules)
5. **Wrong plugin syntax** (using @import or require() instead of @plugin directive)

All of these are handled automatically when the skill is active.

---

## Quick Start (5 Minutes - Follow This Exact Order)

### 1. Install Dependencies

```bash
bun add tailwindcss @tailwindcss/vite
# or: npm install tailwindcss @tailwindcss/vite

bun add -d @types/node

# Note: Using pnpm for shadcn init due to known Bun compatibility issues
# (bunx has "Script not found" and postinstall/msw problems)
pnpm dlx shadcn@latest init
```

### 2. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 3. Update components.json

```json
{
  "tailwind": {
    "config": "",              // ← CRITICAL: Empty for v4
    "css": "src/index.css",
    "cssVariables": true
  }
}
```

### 4. Delete tailwind.config.ts

```bash
rm tailwind.config.ts  # v4 doesn't use this file
```

---

## The Four-Step Architecture (CRITICAL)

This pattern is **mandatory** - skipping steps will break your theme.

### Step 1: Define CSS Variables at Root Level

```css
/* src/index.css */
@import "tailwindcss";

:root {
  --background: hsl(0 0% 100%);      /* ← hsl() wrapper required */
  --foreground: hsl(222.2 84% 4.9%);
  --primary: hsl(221.2 83.2% 53.3%);
  /* ... all light mode colors */
}

.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  --primary: hsl(217.2 91.2% 59.8%);
  /* ... all dark mode colors */
}
```

**Critical Rules:**
- ✅ Define at root level (NOT inside `@layer base`)
- ✅ Use `hsl()` wrapper on all color values
- ✅ Use `.dark` for dark mode (NOT `.dark { @theme { } }`)

### Step 2: Map Variables to Tailwind Utilities

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... map ALL CSS variables */
}
```

**Why This Is Required:**
- Generates utility classes (`bg-background`, `text-primary`)
- Without this, `bg-primary` etc. won't exist

### Step 3: Apply Base Styles

```css
@layer base {
  body {
    background-color: var(--background);  /* NO hsl() here */
    color: var(--foreground);
  }
}
```

**Critical Rules:**
- ✅ Reference variables directly: `var(--background)`
- ❌ Never double-wrap: `hsl(var(--background))`

### Step 4: Result - Automatic Dark Mode

```tsx
<div className="bg-background text-foreground">
  {/* No dark: variants needed - theme switches automatically */}
</div>
```

---

## Dark Mode Setup

### 1. Create ThemeProvider

See `reference/dark-mode.md` for full implementation or use template:

```typescript
// Copy from: templates/theme-provider.tsx
```

### 2. Wrap Your App

```typescript
// src/main.tsx
import { ThemeProvider } from '@/components/theme-provider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
```

### 3. Add Theme Toggle

```bash
pnpm dlx shadcn@latest add dropdown-menu
```

See `reference/dark-mode.md` for ModeToggle component code.

---

## Critical Rules (MUST FOLLOW)

### ✅ Always Do:

1. **Wrap color values with `hsl()` in `:root` and `.dark`**
   ```css
   --background: hsl(0 0% 100%);  /* ✅ Correct */
   ```

2. **Use `@theme inline` to map all CSS variables**
   ```css
   @theme inline {
     --color-background: var(--background);
   }
   ```

3. **Set `"tailwind.config": ""` in components.json**
   ```json
   { "tailwind": { "config": "" } }
   ```

4. **Delete `tailwind.config.ts` if it exists**

5. **Use `@tailwindcss/vite` plugin (NOT PostCSS)**

6. **Use `cn()` for conditional classes**
   ```typescript
   import { cn } from "@/lib/utils"
   <div className={cn("base", isActive && "active")} />
   ```

### ❌ Never Do:

1. **Put `:root` or `.dark` inside `@layer base`**
