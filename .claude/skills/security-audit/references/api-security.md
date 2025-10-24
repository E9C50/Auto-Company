# API Security

Security considerations specific to API endpoints.

## Input Validation

### Schema Validation

```typescript
import { z } from 'zod';

// Define strict schemas
const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['user', 'admin']).default('user')
}).strict(); // Reject unknown properties

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message
        }))
      });
    }
    
    req.body = result.data; // Use validated data
    next();
  };
}

// Usage
app.post('/users', validate(CreateUserSchema), createUser);
```

### Input Sanitization

```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Sanitize HTML input
function sanitizeHTML(input: string): string {
  return purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

// Sanitize for SQL (use parameterized queries instead)
function sanitizeSQL(input: string): string {
  // DON'T DO THIS - use parameterized queries
  // This is just to show what NOT to do
  return input.replace(/['";\\]/g, '');
}

// Sanitize filename
function sanitizeFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}
```

### Content-Type Validation

```typescript
function requireJSON(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers['content-type'];
  
  if (!contentType?.includes('application/json')) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: 'Content-Type must be application/json'
    });
  }
  
  next();
}

// Apply to all API routes
app.use('/api', requireJSON);
```

---

## Rate Limiting

### Basic Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 900
  },
  skipSuccessfulRequests: true
});

// Expensive operations
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Export rate limit exceeded',
    retryAfter: 3600
  }
});

// Apply
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/export', exportLimiter);
```

### Redis-Based Rate Limiting

```typescript
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });

const rateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

### Per-User Rate Limiting

```typescript
const userLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req) => {
    // Rate limit by user ID, fall back to IP
    return req.user?.id || req.ip;
  }
});
```

---

## CORS Configuration

### Secure CORS Setup

```typescript
import cors from 'cors';

// Production CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.example.com',
      'https://admin.example.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

### CORS Security Checklist

| Setting | Insecure | Secure |
|---------|----------|--------|
| origin | `'*'` | Explicit allowlist |
| credentials | `true` with `origin: '*'` | `true` only with specific origins |
| methods | All methods | Only required methods |
| allowedHeaders | `'*'` | Specific headers |

---

## Security Headers

### Helmet Configuration

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  originAgentCluster: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
}));
```

### Manual Headers

```typescript
app.use((req, res, next) => {
  // Prevent caching of sensitive data
  if (req.path.startsWith('/api/')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }
  
  // API-specific headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0' // Disabled, use CSP instead
  });
  
  next();
});
```

---

## Error Handling

### Secure Error Responses

```typescript
// Custom error class
class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
