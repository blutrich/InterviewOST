# Discovery Co-Pilot - Development Guide

AI-powered interview platform using Teresa Torres' Continuous Discovery methodology.

## Project Status

### Completed ✅

| Component | Description |
|-----------|-------------|
| **Next.js 15 Setup** | TypeScript, Tailwind, shadcn/ui |
| **Supabase Schema** | All tables: projects, templates, interviews, messages, snapshots, opportunities, evidence |
| **Auth Flow** | Login, signup, callback, middleware |
| **Mastra Agents** | Planner, Interviewer, Synthesizer, Mapper |
| **Dashboard** | Layout, projects list, project detail page |
| **Public Interview** | `/i/[token]` - participant interview UI |
| **Chat API** | `/api/chat` - live interview with AI |
| **Synthesis API** | `/api/synthesis` - generate Interview Snapshots |
| **Opportunities API** | `/api/opportunities` - OST management |
| **Snapshot Components** | ExperienceMap, QuoteReel, FactsPanel, BlindSpotAlert, ValidationUI |
| **OST Visualization** | React Flow canvas with OpportunityNode, EvidencePanel |
| **Database Migration** | All tables created with RLS policies via Supabase MCP |
| **Templates API** | `/api/templates` - CRUD + Planner agent generation |
| **Templates Page** | `/projects/[id]/templates` - generate, preview, edit, approve rubrics |
| **Interviews API** | `/api/interviews` - CRUD + access token generation |
| **Interviews Page** | `/projects/[id]/interviews` - list, create, copy links |
| **Interview Detail** | `/projects/[id]/interviews/[interviewId]` - transcript view with message bubbles |
| **Mark Complete** | Button to mark interview as completed from detail page |

### Pending ⏳

| Task | Priority | Description |
|------|----------|-------------|
| **End-to-End Test** | HIGH | Test full flow: create project → interview → snapshot → OST |
| **Fix DATABASE_URL** | MEDIUM | Update `.env.local` with actual PostgreSQL password |

---

## Setup Instructions

### 1. Run Database Migration

**Option A: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/qyfinqhyspzhjlsygide/sql/new
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Click "Run"

**Option B: Supabase MCP (after restart)**
```bash
# Restart Claude Code to load Supabase MCP, then:
# Use MCP to execute the migration SQL
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Create Test Account

1. Visit http://localhost:3000
2. Click "Sign Up"
3. Create account with email/password

---

## Key Files Reference

### API Routes
- `/src/app/api/chat/route.ts` - Interview chat endpoint
- `/src/app/api/synthesis/route.ts` - Snapshot generation
- `/src/app/api/opportunities/route.ts` - OST CRUD

### Mastra Agents
- `/src/mastra/agents/planner.ts` - Generates story-based rubrics
- `/src/mastra/agents/interviewer.ts` - Conducts interviews (Teresa Torres method)
- `/src/mastra/agents/synthesizer.ts` - Creates Interview Snapshots
- `/src/mastra/agents/mapper.ts` - Suggests OST placements

### Pages
- `/src/app/(dashboard)/page.tsx` - Projects list
- `/src/app/(dashboard)/projects/[id]/page.tsx` - Project detail
- `/src/app/(dashboard)/projects/[id]/templates/page.tsx` - Templates management
- `/src/app/(dashboard)/projects/[id]/interviews/page.tsx` - Interviews list
- `/src/app/(dashboard)/projects/[id]/interviews/[interviewId]/page.tsx` - Interview detail/transcript
- `/src/app/(dashboard)/projects/[id]/interviews/[interviewId]/snapshot/page.tsx` - Interview Snapshot
- `/src/app/(dashboard)/projects/[id]/tree/page.tsx` - OST visualization
- `/src/app/i/[token]/page.tsx` - Public interview page

### API Routes
- `/src/app/api/chat/route.ts` - Interview chat endpoint
- `/src/app/api/synthesis/route.ts` - Snapshot generation
- `/src/app/api/opportunities/route.ts` - OST CRUD
- `/src/app/api/templates/route.ts` - Templates CRUD + AI generation
- `/src/app/api/interviews/route.ts` - Interviews CRUD

### Components
- `/src/components/snapshot/` - Snapshot visualization components
- `/src/components/tree/` - OST React Flow components

---

## Pages Built ✅

### 1. Templates Page (`/projects/[id]/templates`)
- List existing templates with status badges
- "Generate New Template" button → calls Planner agent
- Edit rubric JSON in modal
- Approve/activate template
- Preview story-based questions with follow-ups and probes

### 2. Interviews Page (`/projects/[id]/interviews`)
- List all interviews (with status badges)
- "Create Interview" → generates access_token, creates link
- Copy interview link button
- View interview status (pending, active, completed)
- Link to snapshot for completed interviews
- Stats cards showing total, completed, active, pending

### 3. Interview Detail (`/projects/[id]/interviews/[interviewId]`)
- Full transcript view with chat bubbles
- Message bubbles styled by role (interviewer vs participant)
- Timestamps on each message
- "Mark as Completed" button for active interviews
- Link to generate/view snapshot
- Duration calculation

---

## User Flow

```
1. CREATE PROJECT
   └─→ Set name, research goals, target audience, desired outcome (OST root)

2. GENERATE TEMPLATE (Planner Agent)
   └─→ AI creates story-based interview rubric
   └─→ Human reviews and approves

3. CREATE INTERVIEW
   └─→ System generates unique access_token
   └─→ Share link: /i/{token}

4. CONDUCT INTERVIEW (Interviewer Agent)
   └─→ Participant clicks link, enters name
   └─→ AI conducts story-based interview
   └─→ Messages saved in real-time

5. MARK COMPLETE
   └─→ Researcher marks interview as completed

6. GENERATE SNAPSHOT (Synthesizer Agent)
   └─→ AI creates: Experience Map, Quote Reel, Facts, Blind Spots
   └─→ Human validates (approve/reject)

7. MAP OPPORTUNITIES (Mapper Agent)
   └─→ AI suggests opportunities from snapshot
   └─→ Human structures OST (approve/move/merge)

8. VIEW OST
   └─→ React Flow visualization
   └─→ Evidence linked to opportunities
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qyfinqhyspzhjlsygide.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Commands

```bash
# Development
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# Add shadcn component
npx shadcn@latest add [component-name]
```

---

## Teresa Torres Framework Alignment

### Core Philosophy: "Expert + AI Co-Pilot"

This app follows Teresa Torres' Continuous Discovery methodology with an "Expert + AI" model:
- **AI raises the floor** for beginners and accelerates experts
- **Humans validate all insights** - never auto-commit
- **Stories over opinions** - always ask about specific past behavior
- **Trees over lists** - structure opportunities hierarchically

### Framework Checklist ✅

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Force story-based questions | ✅ | Planner agent creates "Tell me about the last time..." |
| Separate facts from synthesis | ✅ | Facts Panel vs Experience Map in Snapshots |
| Visualize as Tree, not List | ✅ | OST with React Flow canvas |
| Human approval for insights | ✅ | Approve/Reject on snapshots & opportunities |

### The Four Phases We Implement

```
Phase 2: INTERVIEW (AI-Conducted)
├── Story-based questions from Planner agent
├── Interviewer agent excavates specific past behaviors
└── "Better Than Nothing" mode with strict guardrails

Phase 3: IMMEDIATE SYNTHESIS (15-min workflow)
├── Experience Map (timeline of customer story)
├── Quote Reel (3-5 emotional quotes)
├── Facts (context, not interpretation)
└── Blind Spot Detector (what did we miss?)

Phase 4: OPPORTUNITY MAPPING
├── OST hierarchy: Outcome → Opportunities → Solutions
├── Parent/Child relationships
├── Deduplication (Mapper checks existing tree)
└── Human-in-the-loop validation

Phase 5: FUTURE (v2 Roadmap)
├── Cross-interview pattern recognition
├── Segment analysis
├── Opportunity sizing (count across interviews)
└── Narrative generation for stakeholders
```

### Multiple Interviews → Same OST

All interviews in a project feed into **one shared Opportunity Tree**:

```
Project: "Improve Checkout"
│
└── OST (Root: "Users complete checkout faster")
     │
     ├── Opportunity A ← evidence from Interview 1, 3, 7
     ├── Opportunity B ← evidence from Interview 2, 5
     └── Opportunity C ← evidence from Interview 1, 2, 4, 6, 8, 9, 10
          └── Solution 1
```

- **Evidence accumulates** - Popular pain points get more mentions
- **Patterns emerge** - See which problems affect many users
- **Duplicates handled** - Mapper agent suggests merging vs. creating new

### What We Don't Implement (Yet)

| Feature | Status | Notes |
|---------|--------|-------|
| Assumption Tests (Layer 4) | ❌ | Framework has 4 layers, we have 3 |
| "Opportunity Test" validation | ❌ | No check if items are solutions in disguise |
| Minimum 3 solutions per opportunity | ❌ | Not enforced |
| Real-time interview coaching | ❌ | AI interviews, no human wingman mode |

### Overall Alignment: ~85%

Core flow is correct. Main gaps are experimentation layer and cross-interview insights.

---

## Quick Fixes Needed

1. **Fix DATABASE_URL** in `.env.local` - Replace `[YOUR-PASSWORD]` with your actual Supabase database password

---

## Next Steps

- [x] Run database migration
- [x] Build `/projects/[id]/templates` page
- [x] Build `/projects/[id]/interviews` page
- [x] Build `/projects/[id]/interviews/[id]` page
- [ ] Test complete flow end-to-end
- [ ] Get Supabase database password for Mastra storage
