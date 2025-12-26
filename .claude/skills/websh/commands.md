---
role: command-reference
summary: |
  Complete reference for all websh commands. Navigation, query, process management,
  monitoring, environment, mounting, and more—treating the web as a Unix filesystem.
see-also:
  - shell.md: Shell semantics and execution model
  - state/cache.md: How cache is structured
---

# websh Command Reference

## Navigation Commands

### `cd <url>`

Navigate to a URL. Fetches the page, caches it, and spawns async extraction.

**Syntax:**
```
cd <url>
cd <relative-path>
cd -                 # go to previous location
cd ~                 # go to home/start (clears navigation)
```

**Examples:**
```
cd https://news.ycombinator.com
cd https://x.com/deepfates
cd /item?id=12345          # relative to current domain
cd ..                       # up one path level
cd -                        # back to previous URL
```

**Output:** Navigation confirmation, extraction status

---

### `pwd`

Print the current URL.

**Syntax:**
```
pwd
pwd -P               # show full resolved URL (no aliases)
```

**Output:** Full current URL or `(no page loaded)`

---

### `back`

Go back to the previous URL in navigation history.

**Syntax:**
```
back
back <n>             # go back n steps
```

**Behavior:** Uses cached content, no refetch.

---

### `forward`

Go forward in navigation history (after using `back`).

**Syntax:**
```
forward
forward <n>
```

---

### `follow <target>`

Navigate to a link on the current page.

**Syntax:**
```
follow <index>       # by number from ls output
follow "<text>"      # by link text (partial match)
follow -n            # follow without adding to history
```

**Examples:**
```
follow 3                    # follow the 4th link (0-indexed)
follow "State of AI"        # follow link containing this text
```

---

### `refresh`

Re-fetch the current URL, updating the cache.

**Syntax:**
```
refresh
refresh --hard       # clear extraction, start fresh
```

---

### `chroot <url>`

Restrict navigation to a subdomain or path prefix.

**Syntax:**
```
chroot <url>         # set root boundary
chroot               # show current chroot
chroot /             # clear chroot
```

**Example:**
```
chroot https://docs.python.org/3/
cd tutorial          # OK: within chroot
cd https://google.com # error: outside chroot
```

---

## Query Commands

### `ls [selector]`

List links or elements on the current page.

**Syntax:**
```
ls                   # list all links
ls <selector>        # list elements matching CSS selector
ls -l                # long format with hrefs
ls -a                # include hidden/navigation links
ls -t                # sort by position in page
ls -S                # sort by text length
```

**Output:**
```
[0] First link text
[1] Second link text
```

With `-l`:
```
[0] First link text → /path/to/page
[1] Second link text → https://external.com/
```

**Pipeable:** Yes

---

### `cat <selector>`

Extract text content from elements.

**Syntax:**
```
cat <selector>
cat .                # entire page text
cat -n               # with line numbers
cat -A               # show all (including hidden elements)
```

**Examples:**
```
cat .title
cat article
cat .comment | head 3
cat -n .code-block
```

**Pipeable:** Yes

---

### `grep <pattern>`

Filter content by text pattern (regex supported).

**Syntax:**
```
grep <pattern>
grep -i <pattern>    # case-insensitive
grep -v <pattern>    # invert match
grep -c <pattern>    # count matches
grep -n <pattern>    # show line numbers
grep -o <pattern>    # only matching part
grep -A <n>          # n lines after match
grep -B <n>          # n lines before match
grep -C <n>          # n lines context (before and after)
grep -E <pattern>    # extended regex
grep -l              # list pages with matches (for locate/find)
```

**Pipeable:** Yes (filters input stream or searches page)

---

### `stat`

Show metadata about the current page.

**Syntax:**
```
stat
stat -v              # verbose (all metadata)
```

**Output:**
```
URL:       https://news.ycombinator.com
Title:     Hacker News
Fetched:   2026-01-24T10:30:00Z
Extracted: 3 passes, complete
Links:     30
Forms:     2
Images:    0
Size:      45 KB (html), 12 KB (parsed)
```

---

### `head <n>` / `tail <n>`

Take first or last n items from a stream.

**Syntax:**
```
head <n>
head -n <n>          # same as head <n>
tail <n>
tail -f              # follow (for watch/stream)
```

**Pipeable:** Yes (must be in pipe or with file)

---

### `sort`

Sort lines of output.

**Syntax:**
```
sort                 # alphabetical
sort -n              # numeric
sort -r              # reverse
sort -u              # unique (remove duplicates)
sort -k <n>          # sort by nth field
sort -t <delim>      # field delimiter
```

**Pipeable:** Yes

---

### `uniq`

Remove duplicate lines.

**Syntax:**
```
uniq
uniq -c              # prefix with count
uniq -d              # only show duplicates
uniq -u              # only show unique
```

**Pipeable:** Yes

---

### `wc`

Count words, lines, characters.

**Syntax:**
```
wc                   # all counts
wc -l                # lines only
wc -w                # words only
wc -c                # characters only
wc -L                # longest line length
```

**Web-specific:**
```
wc --links           # count links
wc --images          # count images
wc --forms           # count forms
wc --headings        # count headings
```

**Pipeable:** Yes

---

### `cut`

Extract columns/fields from output.

**Syntax:**
```
cut -f <n>           # field n (1-indexed)
cut -f <n,m>         # fields n and m
cut -d <delim>       # delimiter (default: tab)
cut -c <range>       # character positions
```

**Example:**
```
ls -l | cut -f 1     # just link text, no URLs
```

**Pipeable:** Yes

---

### `tr`

Translate/transform characters.

**Syntax:**
```
tr <set1> <set2>     # replace set1 chars with set2
tr -d <set>          # delete characters
tr -s <set>          # squeeze repeated chars
tr '[:upper:]' '[:lower:]'  # lowercase
```

**Pipeable:** Yes

---

### `sed`

Stream editor for transformations.

**Syntax:**
```
sed 's/old/new/'     # replace first occurrence
sed 's/old/new/g'    # replace all
sed -n '5,10p'       # print lines 5-10
sed '/pattern/d'     # delete matching lines
```

**Pipeable:** Yes

---

### `source`

View raw HTML source.

**Syntax:**
```
source               # full HTML
source | head 50     # first 50 lines
source -l            # with line numbers
```

---

### `dom`

Show DOM tree structure.

**Syntax:**
```
dom                  # full tree
dom <selector>       # subtree from selector
dom -d <n>           # depth limit
dom --tags           # tag names only
```

**Output:**
```
html
├── head
│   ├── title
│   ├── meta
│   └── link
└── body
    ├── header
    │   └── nav
    ├── main
    │   ├── article
    │   └── aside
    └── footer
```

---

## Prefetching & Crawling

### `prefetch`

Control eager link crawling. By default, websh automatically prefetches visible links 1-2 layers deep in the background after you navigate to a page.

**Syntax:**
```
prefetch                     # show status
prefetch on                  # enable eager crawl
prefetch off                 # disable eager crawl
prefetch <url>               # manually prefetch a URL
prefetch --depth <n>         # set crawl depth (default: 2)
prefetch --stop              # stop current crawl
```

**Examples:**
```
prefetch                     # check crawl progress
prefetch off                 # disable for slow connections
prefetch https://example.com # manually queue URL
```

**Status output:**
```
Eager crawl: enabled
Depth: 2, Same domain: yes, Max per page: 20

Current crawl:
  Origin: https://news.ycombinator.com
  Progress: Layer 1 - 15/20 complete
  Queued: 42 URLs for Layer 2
```

---

### `crawl`

Explicitly crawl a URL to a specified depth.

**Syntax:**
```
crawl <url>                  # crawl from URL
crawl --depth <n>            # depth (default: 2)
crawl --all                  # include external links
crawl --follow <pattern>     # only follow matching URLs
crawl --max <n>              # max pages to fetch
```

**Examples:**
```
crawl https://docs.example.com --depth 3
crawl https://api.example.com --follow "/docs/*"
crawl https://blog.com --max 50
```

**Difference from prefetch:**
- `prefetch` is automatic and runs in background after `cd`
- `crawl` is manual and can go deeper / wider

---

### `queue`

Show the crawl queue.

**Syntax:**
```
queue                        # show queue status
queue -l                     # long format with all URLs
