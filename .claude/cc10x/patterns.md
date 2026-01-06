# Project Patterns - Discovery Copilot

## Architecture Patterns

### Supabase + RLS
- **Pattern**: RLS enforces authorization at database level
- **Public routes**: Use service role key to bypass RLS when needed
- **Authenticated routes**: Use regular client (respects RLS)
- **Gotcha**: Anonymous participants can't modify data without service role

### API Route Structure
```typescript
// Public endpoint pattern
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // 1. Rate limiting
  // 2. Validate input (zod)
  // 3. Use service client for RLS bypass
  // 4. Validate token/access
  // 5. Perform operation
}
```

### Protected endpoint pattern
```typescript
import { getAuthenticatedUser, verifyProjectOwnership } from "@/lib/supabase/server";

export async function POST(req: Request) {
  // 1. Auth check
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  // 2. Authorization check
  const { authorized } = await verifyProjectOwnership(projectId, user.id);
  if (!authorized) return 403;

  // 3. Perform operation
}
```

## Code Conventions

### File naming
- API routes: `src/app/api/[resource]/route.ts`
- Pages: `src/app/[route]/page.tsx`
- Components: `src/components/[category]/ComponentName.tsx`

### Validation
- Use Zod for API input validation
- Schema naming: `createXSchema`, `updateXSchema`

## File Structure
```
src/
├── app/
│   ├── api/           # API routes
│   ├── dashboard/     # Authenticated pages
│   ├── i/[token]/     # Public interview page
│   └── join/[shareToken]/ # Shared interview link
├── components/
│   ├── kanban/        # Kanban board components
│   ├── snapshot/      # Interview snapshot components
│   └── tree/          # OST tree components
├── lib/
│   ├── supabase/      # Supabase clients
│   └── rate-limit.ts  # Rate limiting utils
└── mastra/
    └── agents/        # AI agents
```

## Common Gotchas

### RLS and Anonymous Users
- **Issue**: Client-side Supabase operations fail silently for anonymous users
- **Solution**: Use server-side API with service role key
- **Check**: Look for `createClient()` vs `createServiceClient()`

### Middleware Public Routes
- **Pattern**: Add public API routes to `isPublicApiRoute` check in middleware
- **Location**: `src/lib/supabase/middleware.ts:48-51`

### Interview Flow
- **Token types**: `access_token` (per interview), `share_token` (per template)
- **Status flow**: `pending` → `active` → `completed`
- **Status update**: Must happen server-side (RLS)

## Testing Patterns

### API Testing
```bash
# Test with curl
curl -X POST https://interview-ost.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"interviewId":"...","token":"...","message":"..."}'
```

### Vercel CLI
```bash
# Check env vars
vercel env ls

# Check deployment
vercel inspect [url]

# Deploy to production
vercel --prod
```

## Error Handling

### Current Pattern (needs improvement)
- Many handlers log errors but don't inform user
- Pattern: `if (error) console.error(error)` - **BAD**
- Better: Return error response or retry

### Recommended Pattern
```typescript
if (error) {
  console.error("Context:", error);
  return NextResponse.json({ error: "User-friendly message" }, { status: 500 });
}
```

## AI Agent Patterns

### Interviewer Agent
- ONE question at a time (critical)
- Keep questions under 20 words
- Probe story arc as separate follow-ups
- Use `[INTERVIEW_COMPLETE]` marker to end

### Model Selection
- Default: `openai/gpt-4o-mini`
- Can be overridden per project via `runtimeContext`
