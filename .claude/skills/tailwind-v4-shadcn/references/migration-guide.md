# Migration Guide: Hardcoded Colors → CSS Variables

## Overview

This guide helps you migrate from hardcoded Tailwind colors (`bg-blue-600`) to semantic CSS variables (`bg-primary`).

**Benefits:**
- Automatic dark mode support
- Consistent color usage
- Single source of truth
- Easy theme customization
- Better accessibility

---

## Semantic Color Mapping

| Hardcoded Color | CSS Variable | Use Case |
|----------------|--------------|----------|
| `bg-red-*` / `text-red-*` | `bg-destructive` / `text-destructive` | Critical issues, errors, delete actions |
| `bg-green-*` / `text-green-*` | `bg-success` / `text-success` | Success states, positive metrics |
| `bg-yellow-*` / `text-yellow-*` | `bg-warning` / `text-warning` | Warnings, moderate issues |
| `bg-blue-*` / `text-blue-*` | `bg-info` or `bg-primary` | Info boxes, primary actions |
| `bg-gray-*` / `text-gray-*` | `bg-muted` / `text-muted-foreground` | Backgrounds, secondary text |
| `bg-purple-*` | `bg-info` | Remove - use blue instead |
| `bg-orange-*` | `bg-warning` | Remove - use yellow instead |
| `bg-emerald-*` | `bg-success` | Remove - use green instead |

---

## Migration Patterns

### Pattern 1: Solid Backgrounds

❌ **Before:**
```tsx
<div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
```

✅ **After:**
```tsx
<div className="bg-info/10 text-info">
```

**Note:** `/10` creates 10% opacity

---

### Pattern 2: Borders

❌ **Before:**
```tsx
<div className="border-2 border-green-200 dark:border-green-800">
```

✅ **After:**
```tsx
<div className="border-2 border-success/30">
```

---

### Pattern 3: Text Colors

❌ **Before:**
```tsx
<span className="text-red-600 dark:text-red-400">
```

✅ **After:**
```tsx
<span className="text-destructive">
```

---

### Pattern 4: Icons

❌ **Before:**
```tsx
<AlertCircle className="text-yellow-500" />
```

✅ **After:**
```tsx
<AlertCircle className="text-warning" />
```

---

### Pattern 5: Gradients

❌ **Before:**
```tsx
<div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
```

✅ **After:**
```tsx
<div className="bg-gradient-to-r from-success/10 to-success/20">
```

---

## Step-by-Step Migration

### Step 1: Add Semantic Colors to CSS

```css
/* src/index.css */
:root {
  /* Add these if not already present */
  --destructive: hsl(0 84.2% 60.2%);
  --destructive-foreground: hsl(210 40% 98%);
  --success: hsl(142.1 76.2% 36.3%);
  --success-foreground: hsl(210 40% 98%);
  --warning: hsl(38 92% 50%);
  --warning-foreground: hsl(222.2 47.4% 11.2%);
  --info: hsl(221.2 83.2% 53.3%);
  --info-foreground: hsl(210 40% 98%);
}

.dark {
  --destructive: hsl(0 62.8% 30.6%);
  --destructive-foreground: hsl(210 40% 98%);
  --success: hsl(142.1 70.6% 45.3%);
  --success-foreground: hsl(222.2 47.4% 11.2%);
  --warning: hsl(38 92% 55%);
  --warning-foreground: hsl(222.2 47.4% 11.2%);
  --info: hsl(217.2 91.2% 59.8%);
  --info-foreground: hsl(222.2 47.4% 11.2%);
}

@theme inline {
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
}
```

### Step 2: Find Hardcoded Colors

```bash
# Search for background colors
grep -r "bg-\(red\|yellow\|blue\|green\|purple\|orange\|pink\|emerald\)-[0-9]" src/

# Search for text colors
grep -r "text-\(red\|yellow\|blue\|green\|purple\|orange\|pink\|emerald\)-[0-9]" src/

# Search for border colors
grep -r "border-\(red\|yellow\|blue\|green\|purple\|orange\|pink\|emerald\)-[0-9]" src/
```
