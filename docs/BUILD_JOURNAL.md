# Discovery Co-Pilot: Build Journal

> **Development Log** - Track what was built, decisions made, and next steps.

---

## Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | Discovery Co-Pilot |
| **Purpose** | AI-powered interview platform using Teresa Torres' Continuous Discovery methodology |
| **Started** | 2024 |
| **Status** | MVP Complete, Testing Pending |

---

## Architecture Decisions

### Why Mastra?
- Provides structured AI agent framework
- Easy agent registration and management
- Works well with Next.js 15 server components
- Supports multiple LLM providers via OpenRouter

### Why Supabase?
- PostgreSQL for complex relational data (OST tree structure)
- Real-time subscriptions for live chat
- Built-in auth with RLS policies
- Easy migrations

### Why React Flow?
- Perfect for tree visualization
- Supports drag-and-drop node positioning
- Custom node components
- Built-in minimap and controls

### Why Teresa Torres Methodology?
- Story-based questions get richer insights than opinion-based
- Immediate synthesis (15-min workflow) prevents data pileup
- OST structure helps prioritize opportunities
- Human-in-the-loop ensures quality

---

## Build Progress

### Phase 1: Foundation ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Next.js 15 Setup | ✅ | TypeScript, Tailwind, shadcn/ui |
| Supabase Schema | ✅ | All 8 tables created |
| Auth Flow | ✅ | Login, signup, middleware |
| Mastra Setup | ✅ | 4 agents registered |
| Dashboard Layout | ✅ | Responsive design |

### Phase 2: Template Generation ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Planner Agent | ✅ | Generates story-based rubrics |
| Templates API | ✅ | CRUD + AI generation |
| Templates Page | ✅ | Generate, preview, edit, approve |
| Template Activation | ✅ | Only one active per project |

### Phase 3: Interview System ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Interviewer Agent | ✅ | Teresa Torres methodology |
| Interviews API | ✅ | CRUD + token generation |
| Public Interview Page | ✅ | `/i/[token]` |
| Chat API | ✅ | Real-time with Supabase |
| Auto-completion | ✅ | `[INTERVIEW_COMPLETE]` marker |
| Message Cleanup | ✅ | Removes internal notes |

### Phase 4: Synthesis ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Synthesizer Agent | ✅ | Structured output with Zod |
| Synthesis API | ✅ | POST, GET, PATCH |
| Snapshot Components | ✅ | ExperienceMap, QuoteReel, FactsPanel, BlindSpotAlert |
| Validation UI | ✅ | Approve/Reject flow |

### Phase 5: OST Mapping ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Mapper Agent | ✅ | Extracts opportunities |
| Opportunities API | ✅ | Full CRUD + evidence |
| OSTCanvas | ✅ | React Flow visualization |
| OpportunityNode | ✅ | Custom node component |
| EvidencePanel | ✅ | Side panel for quotes |
| Interview Filtering | ✅ | Filter OST by interview |

### Phase 6: Testing ⏳

| Component | Status | Notes |
|-----------|--------|-------|
| End-to-End Test | ⏳ | Full flow not tested yet |
| Database Password | ⏳ | Need to update .env.local |

---

## Key Technical Details

### Interview Token System
```typescript
// Generate unique token
const accessToken = nanoid(12);

// Interview link
const interviewLink = `${baseUrl}/i/${accessToken}`;
```

### Interview Completion Detection
```typescript
// Agent ends interview with marker
"Thank you! [INTERVIEW_COMPLETE]"

// API detects and removes it
const isComplete = response.includes('[INTERVIEW_COMPLETE]');
response = response.replace('[INTERVIEW_COMPLETE]', '');

// Update status
if (isComplete) {
  await supabase.from("interviews").update({ status: "completed" });
}
```

### Message Cleanup
```typescript
// Remove internal notes from AI response
response = response.replace(/\*\[[\s\S]*?\]\*\s*/g, '');
response = response.replace(/\[(?:Internal|Mental note|Note).*?\]/gi, '');
```

### OST Tree Structure
```sql
-- Parent-child via self-reference
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES opportunities,  -- Tree structure!
  ...
);
```

---

## Pending Tasks

### High Priority
- [ ] End-to-end test: Create project → Interview → Snapshot → OST
- [ ] Fix DATABASE_URL in `.env.local`

### Medium Priority
- [ ] Study Links feature (single shareable link for multiple interviews)
- [ ] Cross-interview pattern recognition
- [ ] Export to PDF/Slack

### Low Priority
- [ ] Voice transcription (Web Speech API)
- [ ] Real-time coaching (Wingman mode)
- [ ] Assumption testing layer

---

## Database Migrations

### Migration 001: Initial Schema
- Created all 8 tables
- Added RLS policies
- Enabled Realtime for messages
- Added triggers for evidence_count

### Migration 002: Fix Schema Integrity
- Fixed foreign key references
- Added missing indexes

### Migration 003: Add user_id to Tables
- Ensured proper user ownership

### Migration 004: Security Fixes
- Updated RLS policies for public interview access

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/templates` | GET | List templates for project |
| `/api/templates` | POST | Generate new template with AI |
| `/api/templates` | PATCH | Update/approve template |
| `/api/templates` | DELETE | Remove template |
| `/api/interviews` | GET | List interviews for project |
| `/api/interviews` | POST | Create interview + generate token |
| `/api/interviews` | PATCH | Update status/name |
| `/api/interviews` | DELETE | Remove interview |
| `/api/chat` | POST | Send message + get AI response |
| `/api/synthesis` | GET | Fetch existing snapshot |
| `/api/synthesis` | POST | Generate new snapshot |
| `/api/synthesis` | PATCH | Validate snapshot |
| `/api/opportunities` | GET | List opportunities for project |
| `/api/opportunities` | POST | Generate suggestions from snapshot |
| `/api/opportunities` | PUT | Create/update opportunity |
| `/api/opportunities` | PATCH | Add evidence to opportunity |
| `/api/opportunities` | DELETE | Remove opportunity |

---

## Lessons Learned

### 1. Agent Response Cleanup is Critical
AI sometimes includes internal thinking in responses. Must clean before saving:
```typescript
// Bad: "[Mental note: probe deeper] That sounds frustrating..."
// Good: "That sounds frustrating..."
```

### 2. Structured Output with Zod
Using Zod schemas for agent output ensures consistent structure:
```typescript
const response = await synthesizer.generate(prompt, {
  output: interviewSnapshotSchema,
});
const snapshot = response.object; // Guaranteed to match schema
```

### 3. Real-time Requires Careful Message Handling
- Optimistic updates for instant feedback
- Dedupe messages from both API response and Realtime subscription
- Handle temp message replacement

### 4. Tree Filtering is Complex
Filtering OST by interview requires:
1. Find opportunities with evidence from selected interviews
2. Include entire parent chain to root
3. Always show root outcome node

---

## Feature Ideas for V2

1. **Study Links**
   - Single shareable link for project
   - Multiple people use same link
   - Quota and expiration controls

2. **Cross-Interview Patterns**
   - After 5+ interviews, detect patterns
   - Show opportunity frequency across interviews
   - Segment analysis

3. **Wingman Mode**
   - Human conducts interview
   - AI provides real-time coaching
   - Bias detection
   - "Dig deeper" nudges

4. **Narrative Generation**
   - Storyteller agent
   - Generate Slack updates
   - Create stakeholder decks

5. **Export Options**
   - PDF Interview Snapshots
   - OST as image
   - Evidence report

---

## Session Notes

### Session: Initial Build
- Set up Next.js 15 with TypeScript
- Configured Supabase with all tables
- Built 4 Mastra agents
- Created complete dashboard

### Session: Interview Flow
- Built public interview page `/i/[token]`
- Implemented real-time chat with Supabase
- Added auto-completion detection
- Fixed message cleanup issues

### Session: Synthesis & OST
- Built snapshot generation with Zod schemas
- Created React Flow OST canvas
- Implemented evidence linking
- Added interview filtering

---

## Quick Commands

```bash
# Start development
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# Add shadcn component
npx shadcn@latest add [component-name]
```

---

## Contact & Resources

- **Teresa Torres Methodology**: [Continuous Discovery Habits](https://www.producttalk.org/)
- **Mastra AI Framework**: [Mastra Docs](https://mastra.ai)
- **React Flow**: [React Flow Docs](https://reactflow.dev)
- **Supabase**: [Supabase Docs](https://supabase.com/docs)

