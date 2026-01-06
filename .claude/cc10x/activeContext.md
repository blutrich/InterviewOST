# Active Context - Discovery Copilot

## Current Focus
Production 403 Error Fix + Interviewer Agent Improvements

## Last Updated
2026-01-06

---

## Session Summary (Jan 6, 2026)

### Issues Fixed This Session

#### 1. Production 403 Forbidden Error on `/api/chat`
**Root Cause:** RLS (Row Level Security) blocked anonymous participant operations
- Client-side interview status update (`pending` → `active`) blocked
- Client-side interview INSERT from `/join/[shareToken]` blocked

**Files Changed:**
| File | Change |
|------|--------|
| `src/app/api/chat/route.ts` | Server-side status update + participant name using service role |
| `src/app/api/interviews/join/route.ts` | **NEW** - Public API for shared interview creation |
| `src/app/join/[shareToken]/page.tsx` | Use API instead of direct Supabase insert |
| `src/app/i/[token]/page.tsx` | Pass `participantName` to API, removed failing client-side update |
| `src/lib/supabase/middleware.ts` | Added `/api/interviews/join` to public routes |

#### 2. Interviewer Agent Asking Multiple Questions
**Issue:** Agent was asking compound/broad questions like "Walk me through from preparation to synthesis"

**File Changed:** `src/mastra/agents/interviewer.ts`
**Fix:** Added "ONE QUESTION AT A TIME - CRITICAL" rule:
- Only ONE simple, focused question per response
- Never compound questions
- Keep questions under 20 words
- Probe story arc as SEPARATE follow-up questions

---

## Recent Changes
- `src/app/api/chat/route.ts:39-63` - Server-side status activation
- `src/app/api/interviews/join/route.ts` - NEW file for public interview creation
- `src/app/join/[shareToken]/page.tsx:62-95` - API-based interview creation
- `src/app/i/[token]/page.tsx:145-191` - Simplified handleNameSubmit
- `src/lib/supabase/middleware.ts:48-51` - Added public route
- `src/mastra/agents/interviewer.ts:16-43` - One question at a time rule

## Next Steps
1. Test interview flow end-to-end on production
2. Verify shared interview links (`/join/[shareToken]`) work correctly
3. Monitor for any additional RLS issues

## Active Decisions
| Decision | Choice | Why |
|----------|--------|-----|
| RLS bypass approach | Server-side with service role | Secure - validates token before operations |
| Interview status update | API-side, not client-side | RLS blocks anon updates |
| Shared interview creation | New `/api/interviews/join` endpoint | Keeps `/join` page simple, secure |
| Question style | One simple question at a time | Better participant experience, clearer data |

## Learnings This Session
- **RLS Policy Gap**: Policies allowed SELECT for public but not UPDATE/INSERT for participants
- **Vercel env vars were fine**: Issue was RLS, not missing environment variables
- **Service role key**: Correct pattern for operations that bypass RLS intentionally
- **Compound questions confuse**: Participants respond better to simple, focused questions

## Shared Interview Links Feature
Working flow:
1. Template has `share_token`
2. Share URL: `/join/{shareToken}` - one link for everyone
3. Each participant clicking it → API creates unique interview
4. Redirects to `/i/{accessToken}` for the actual interview

---

## Previous Context

### Error Handling Audit (Dec 26, 2025)
**CRITICAL Issues Found:**
1. `/api/chat/route.ts:166-170` - AI response save failure only logged
2. `/api/chat/route.ts:181-184` - Interview completion failure only logged
3. `/api/templates/route.ts:249-251` - Template deactivation failure only logged
4. `/api/opportunities/route.ts:459-461` - Evidence count RPC failure only logged

### Security Audit (Dec 22, 2025)
- RLS policies properly configured
- No SQL injection (Supabase SDK)
- No XSS (React escaping)
- Middleware protection active

---

## Deployments
- **Latest:** Jan 6, 2026 - `interview-ost.vercel.app`
- **Build:** Passing
- **Status:** Live
