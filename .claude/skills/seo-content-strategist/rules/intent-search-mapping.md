---
title: Search Intent Mapping
impact: MEDIUM-HIGH
tags: search-intent, user-intent, content-alignment, serp-analysis, journey-mapping
---

## Search Intent Mapping

**Impact: MEDIUM-HIGH**

Search intent is why someone searches, not what they type. Ranking #1 for a keyword with wrong intent means high bounce rates and no conversions. Match intent perfectly, and lower-authority pages beat stronger competitors.

### Intent Classification Framework

| Intent Type | User Goal | Content Match | Example Query |
|-------------|-----------|---------------|---------------|
| **Informational** | Learn something | Blog posts, guides, tutorials | "what is secrets management" |
| **Navigational** | Find specific site/page | Brand pages, product pages | "infisical login" |
| **Commercial** | Research before buying | Comparisons, reviews, lists | "best secrets management tools" |
| **Transactional** | Complete an action | Product, pricing, signup pages | "infisical pricing" |

### Intent Signals in Keywords

| Signal | Intent | Example |
|--------|--------|---------|
| **what, why, how** | Informational | "how to rotate api keys" |
| **[brand name]** | Navigational | "hashicorp vault docs" |
| **best, top, vs, review** | Commercial | "vault vs aws secrets manager" |
| **buy, pricing, demo, trial** | Transactional | "secrets management pricing" |
| **[location]** | Local (often commercial) | "security consultants near me" |
| **[year]** | Informational/Commercial | "best ci/cd tools 2024" |

### SERP-Based Intent Analysis

The SERP tells you what Google thinks the intent is:

```
Search: "secrets management"

SERP Analysis:
├── Position 1-3: Comprehensive guides (Informational)
├── Position 4-6: Tool pages/comparisons (Commercial)
├── People Also Ask: "What is...", "Why is..." (Informational)
├── SERP Features: No shopping, no local pack
└── Conclusion: Primarily informational, some commercial

Content strategy: Long-form educational guide, not product page
```

### Good Intent Matching

```
Query: "kubernetes secrets vs configmaps"
Intent: Informational (seeking to understand difference)
SERP: All educational articles explaining the comparison

Good match:
┌────────────────────────────────────────────────────┐
│ Title: Kubernetes Secrets vs ConfigMaps:          │
│        When to Use Each                           │
├────────────────────────────────────────────────────┤
│ Content:                                          │
│ - What are Secrets vs ConfigMaps (definitions)    │
│ - Key differences table                           │
│ - When to use Secrets (with examples)             │
│ - When to use ConfigMaps (with examples)          │
│ - Security considerations                         │
│ - Code examples for both                          │
└────────────────────────────────────────────────────┘

✓ Educational, explains concepts
✓ Comparison format matches query
✓ No hard sell, no pricing push
```

### Bad Intent Mismatch

```
Query: "kubernetes secrets vs configmaps"
Intent: Informational

Bad match:
┌────────────────────────────────────────────────────┐
│ Title: Try Our Kubernetes Secrets Platform        │
├────────────────────────────────────────────────────┤
│ Content:                                          │
│ - Why you need better secrets management          │
│ - Our product features                            │
│ - Pricing plans                                   │
│ - Customer testimonials                           │
│ - Sign up CTA                                     │
└────────────────────────────────────────────────────┘

✗ Product page for informational query
✗ Doesn't answer the comparison question
✗ User will bounce immediately
✗ Google will demote this result
```

### Intent Evolution Through Funnel

```
Awareness → Consideration → Decision

┌─────────────────────────────────────────────────────────────┐
│ AWARENESS (Informational)                                   │
│ "what is secrets management"                                │
│ → Educational blog post, pillar page                        │
├─────────────────────────────────────────────────────────────┤
│ CONSIDERATION (Commercial Investigation)                    │
│ "best secrets management tools"                             │
│ "vault vs aws secrets manager"                              │
│ → Comparison posts, buyer's guides, reviews                 │
├─────────────────────────────────────────────────────────────┤
│ DECISION (Transactional)                                    │
│ "infisical pricing"                                         │
│ "infisical free trial"                                      │
│ → Pricing page, signup page, demo page                      │
└─────────────────────────────────────────────────────────────┘
```

### Content Type by Intent

| Intent | Primary Content Types | CTA Approach |
