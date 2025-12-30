# Discovery Co-Pilot: Step-by-Step Guide

> **Your Memory Refresher** - This document explains exactly how the app works, from start to finish.

---

## Table of Contents

1. [What Is This App?](#what-is-this-app)
2. [The Complete User Journey](#the-complete-user-journey)
3. [Database Tables Explained](#database-tables-explained)
4. [AI Agents: The Brains](#ai-agents-the-brains)
5. [API Routes: The Plumbing](#api-routes-the-plumbing)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Key Files Quick Reference](#key-files-quick-reference)

---

## What Is This App?

**Discovery Co-Pilot** is an AI-powered interview platform built on **Teresa Torres' Continuous Discovery** methodology.

### Core Philosophy
```
"Expert + AI Co-Pilot"
- AI raises the floor for beginners
- AI accelerates experts  
- Humans ALWAYS validate everything
- Stories over opinions (no "Do you like X?" questions)
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + Tailwind + shadcn/ui |
| AI Framework | **Mastra** (5 specialized agents) |
| LLM Provider | OpenRouter (multi-model) |
| Database | Supabase (PostgreSQL + Realtime) |
| Tree Visualization | React Flow |

---

## The Complete User Journey

### Step 1: Create a Project

**What happens:**
- User fills out project details (name, research goals, target audience, desired outcome)
- Desired outcome becomes the ROOT of the Opportunity Solution Tree

**Database:**
```
projects table:
├── id: unique identifier
├── user_id: who owns this
├── name: "Improve Checkout Experience"
├── research_goals: "Understand pain points..."
├── target_audience: "E-commerce users 25-45"
├── desired_outcome: "Users complete checkout faster" (OST root!)
└── model: "anthropic/claude-sonnet-4" (which AI to use)
```

**Files involved:**
- `/src/app/dashboard/projects/new/page.tsx` - Create project form
- `/src/app/dashboard/projects/[id]/page.tsx` - Project detail

---

### Step 2: Generate Interview Template

**What happens:**
1. User clicks "Generate Template"
2. **Planner Agent** creates a story-based interview rubric
3. Human reviews and approves the template

**The AI does:**
- Creates "Tell me about the last time..." questions (story-based)
- Adds follow-up probes for each question
- Includes vague-answer redirects
- Estimates time for each section

**Database:**
```
templates table:
├── id: unique identifier
├── project_id: links to project
├── name: "Interview Rubric v1"
├── rubric: {
│     introduction: "Welcome script...",
│     topics: [
│       {
│         name: "Checkout Experience",
│         questions: [
│           {
│             question: "Tell me about the last time you abandoned a cart...",
│             followUps: ["What happened next?", "How did that feel?"],
│             probes: ["Can you be more specific?"]
│           }
│         ]
│       }
│     ],
│     closing: "Thank you script..."
│   }
├── status: "draft" | "approved"
└── is_active: true (only one active per project)
```

**API Route:** `POST /api/templates`
```typescript
// 1. Get project context
// 2. Call Planner Agent with prompt
// 3. Parse JSON rubric from response
// 4. Save to templates table
```

---

### Step 3: Create Interview Link

**What happens:**
1. User clicks "Create Interview"
2. System generates a unique `access_token` (e.g., `abc123xyz`)
3. Interview link created: `/i/abc123xyz`
4. User shares this link with participant

**Database:**
```
interviews table:
├── id: unique identifier
├── project_id: links to project
├── template_id: which rubric to use
├── access_token: "abc123xyz" (UNIQUE - this is the magic link)
├── participant_name: null (filled when they start)
├── status: "pending" → "active" → "completed"
├── started_at: timestamp
└── completed_at: timestamp
```

**API Route:** `POST /api/interviews`
```typescript
// 1. Generate unique token with nanoid(12)
// 2. Create interview record
// 3. Return interview link: /i/{token}
```

---

### Step 4: Conduct the Interview

**What happens:**
1. Participant opens `/i/abc123xyz`
2. Enters their name → interview status changes to "active"
3. **Interviewer Agent** conducts the conversation
4. Each message is saved in real-time to Supabase
5. Supabase Realtime syncs messages to the UI

**The AI does:**
- Follows the rubric but stays conversational
- Never accepts vague answers ("I usually...") - redirects to specific stories
- Tracks emotional moments
- Ends with `[INTERVIEW_COMPLETE]` marker after ~25-30 exchanges

**Database:**
```
messages table:
├── id: unique identifier
├── interview_id: links to interview
├── role: "assistant" | "user"
├── content: "Tell me about the last time..."
└── created_at: timestamp
```

**API Route:** `POST /api/chat`
```typescript
// 1. Validate access_token
// 2. Get rubric from template
// 3. Build conversation history
// 4. Call Interviewer Agent
// 5. Clean response (remove internal notes)
// 6. Check for [INTERVIEW_COMPLETE] marker
// 7. Save message to database
// 8. If complete, update interview status
```

**Key Code Pattern:**
```typescript
// The interviewer agent looks for this marker
const isComplete = assistantMessage.includes('[INTERVIEW_COMPLETE]');

// Remove it before saving (it's internal)
assistantMessage = assistantMessage.replace(/\s*\[INTERVIEW_COMPLETE\]\s*/g, '');

// Update status if complete
if (isComplete) {
  await supabase
    .from("interviews")
    .update({ status: "completed" });
}
```

---

### Step 5: Generate Interview Snapshot

**What happens:**
1. User clicks "Generate Snapshot" on completed interview
2. **Synthesizer Agent** analyzes the transcript
3. Creates structured output following Teresa Torres format
4. Human validates (approve/reject)

**The AI creates:**
```
snapshot = {
  experience_map: [
    { step: 1, action: "Started searching", feeling: "overwhelmed" },
    { step: 2, action: "Found 3 options", feeling: "confused" },
    { step: 3, action: "Asked colleague", feeling: "relieved" }
  ],
  quote_reel: [
    { quote: "I just wanted something that works", context: "...", emotion: "frustration" }
  ],
  facts: {
    role: "Product Manager",
    tools: ["Jira", "Figma"],
    frequency: "Weekly checkout attempts"
  },
  blind_spots: [
    { observation: "Didn't explore pricing concerns", suggestion: "Ask about budget", severity: "medium" }
  ]
}
```

**Database:**
```
snapshots table:
├── id: unique identifier
├── interview_id: links to interview (UNIQUE - one snapshot per interview)
├── experience_map: JSONB
├── quote_reel: JSONB
├── facts: JSONB
├── blind_spots: JSONB
├── status: "pending" | "approved" | "rejected"
├── human_notes: "Reviewer's notes..."
├── validated_at: timestamp
└── validated_by: user_id
```

**API Route:** `POST /api/synthesis`
```typescript
// 1. Fetch interview with messages
// 2. Build transcript from messages
// 3. Call Synthesizer Agent with structured output schema (Zod)
// 4. Save snapshot to database with status: "pending"
```

---

### Step 6: Map Opportunities to OST

**What happens:**
1. User clicks "Extract Opportunities" on approved snapshot
2. **Mapper Agent** analyzes the snapshot
3. Suggests opportunities with parent/child relationships
4. Checks for duplicates with existing opportunities
5. Human approves/rejects each suggestion

**The AI does:**
- Extracts pain points, unmet needs, workarounds
- Suggests where each opportunity fits in the tree
- Detects potential duplicates
- Links evidence quotes to opportunities

**Database:**
```
opportunities table:
├── id: unique identifier
├── project_id: links to project
├── parent_id: links to parent opportunity (tree structure!)
├── title: "Login Issues"
├── description: "Users struggle with login flow"
├── type: "outcome" | "opportunity" | "solution"
├── evidence_count: 3 (how many interviews mention this)
├── status: "suggested" | "approved" | "rejected"
└── position: { x: 100, y: 200 } (for React Flow)

evidence table:
├── id: unique identifier
├── opportunity_id: links to opportunity
├── snapshot_id: links to snapshot
├── interview_id: links to interview
├── quote: "I couldn't figure out how to reset my password"
└── context: "Discussing checkout friction"
```

**API Route:** `POST /api/opportunities`
```typescript
// 1. Fetch approved snapshot
// 2. Fetch existing opportunities (for deduplication)
// 3. Fetch project root outcome
// 4. Call Mapper Agent
// 5. Return suggestions (NOT auto-saved - human must approve)
```

---

### Step 7: View & Manage OST

**What happens:**
1. User views the Opportunity Solution Tree
2. Can drag nodes to reposition
3. Can approve/reject suggested opportunities
4. Can view evidence for each opportunity
5. Can filter by interview to see which opportunities came from where

**React Flow Structure:**
```
Outcome (Root)
├── Opportunity A
│   ├── Sub-opportunity A1
│   └── Sub-opportunity A2
├── Opportunity B
│   └── Solution B1
└── Opportunity C
```

**Files:**
- `/src/app/dashboard/projects/[id]/tree/page.tsx` - Tree page
- `/src/components/tree/OSTCanvas.tsx` - React Flow canvas
- `/src/components/tree/OpportunityNode.tsx` - Custom node component
- `/src/components/tree/EvidencePanel.tsx` - Side panel for evidence

---

## Database Tables Explained

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  projects   │────▶│  templates  │────▶│  interviews │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  snapshots  │◀────│  messages   │
                    └──────┬──────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │opportunities│◀────│  evidence   │
                    └─────────────┘     └─────────────┘
```

| Table | Purpose |
|-------|---------|
| `projects` | Research initiatives with goals and settings |
| `templates` | AI-generated interview rubrics |
| `interviews` | Individual interview sessions |
| `messages` | Chat messages (real-time sync) |
| `snapshots` | Structured analysis of interviews |
| `opportunities` | OST nodes (tree structure via parent_id) |
| `evidence` | Quotes linked to opportunities |

---

## AI Agents: The Brains

All agents are defined in `/src/mastra/agents/` and registered in `/src/mastra/index.ts`.

### 1. Project Generator Agent (`projectGenerator.ts`)
- **Job:** Transform simple descriptions into structured research projects
- **Input:** User's research idea (e.g., "why people cancel subscriptions")
- **Output:** JSON with name, research_goals, target_audience, desired_outcome
- **Key:** Follows Teresa Torres' outcomes-over-outputs principle

### 2. Planner Agent (`planner.ts`)
- **Job:** Generate interview rubrics
- **Input:** Project details (goals, audience, outcome)
- **Output:** JSON rubric with story-based questions

### 3. Interviewer Agent (`interviewer.ts`)
- **Job:** Conduct interviews
- **Input:** Rubric + conversation history + participant message
- **Output:** Next interviewer response
- **Special:** Ends with `[INTERVIEW_COMPLETE]` marker

### 4. Synthesizer Agent (`synthesizer.ts`)
- **Job:** Create Interview Snapshots
- **Input:** Full transcript
- **Output:** Structured JSON (experience_map, quote_reel, facts, blind_spots)

### 5. Mapper Agent (`mapper.ts`)
- **Job:** Extract opportunities for OST
- **Input:** Approved snapshot + existing opportunities
- **Output:** Suggested opportunities with relationships

---

## API Routes: The Plumbing

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/templates` | GET, POST, PATCH, DELETE | Template CRUD + AI generation |
| `/api/interviews` | GET, POST, PATCH, DELETE | Interview CRUD + token generation |
| `/api/chat` | POST | Live interview with AI |
| `/api/synthesis` | GET, POST, PATCH | Snapshot generation + validation |
| `/api/opportunities` | GET, POST, PUT, PATCH, DELETE | OST CRUD + AI mapping |

---

## Data Flow Diagrams

### Interview Flow
```
Participant visits /i/{token}
         │
         ▼
   ┌─────────────┐
   │ Lookup token│──────▶ Not found? Show error
   └─────────────┘
         │ Found
         ▼
   ┌─────────────┐
   │ Enter name  │
   │ Click Start │
   └─────────────┘
         │
         ▼
   ┌─────────────┐     ┌─────────────┐
   │ POST /chat  │────▶│ Interviewer │
   │ isStart=true│     │   Agent     │
   └─────────────┘     └─────────────┘
         │                    │
         ▼                    ▼
   ┌─────────────┐     ┌─────────────┐
   │ Save message│     │ Generate    │
   │ to Supabase │     │ opening msg │
   └─────────────┘     └─────────────┘
         │
         ▼
   ┌─────────────────────────────────┐
   │        LOOP: Chat Exchange       │
   │                                  │
   │  User message → POST /chat       │
   │       ↓                          │
   │  Interviewer Agent responds      │
   │       ↓                          │
   │  Save both messages              │
   │       ↓                          │
   │  Check for [INTERVIEW_COMPLETE]  │
   └─────────────────────────────────┘
         │
         ▼ (complete marker found)
   ┌─────────────┐
   │ Update      │
   │ status =    │
   │ "completed" │
   └─────────────┘
```

### Snapshot Generation Flow
```
Completed Interview
         │
         ▼
   ┌─────────────────┐
   │ POST /synthesis │
   │ {interviewId}   │
   └─────────────────┘
         │
         ▼
   ┌─────────────────┐
   │ Fetch messages  │
   │ Build transcript│
   └─────────────────┘
         │
         ▼
   ┌─────────────────┐
   │ Synthesizer     │
   │ Agent +         │
   │ Zod Schema      │
   └─────────────────┘
         │
         ▼
   ┌─────────────────┐
   │ Save snapshot   │
   │ status="pending"│
   └─────────────────┘
         │
         ▼
   ┌─────────────────┐
   │ Human validates │
   │ PATCH /synthesis│
   │ status="approved│
   └─────────────────┘
```

---

## Key Files Quick Reference

### Pages
| Path | Purpose |
|------|---------|
| `/src/app/dashboard/page.tsx` | Projects list |
| `/src/app/dashboard/docs/` | In-app documentation (hamburger menu, sidebar, search) |
| `/src/app/dashboard/projects/[id]/page.tsx` | Project detail |
| `/src/app/dashboard/projects/[id]/templates/page.tsx` | Manage templates |
| `/src/app/dashboard/projects/[id]/interviews/page.tsx` | Interviews list |
| `/src/app/dashboard/projects/[id]/interviews/[interviewId]/page.tsx` | Transcript view |
| `/src/app/dashboard/projects/[id]/interviews/[interviewId]/snapshot/page.tsx` | Snapshot view |
| `/src/app/dashboard/projects/[id]/tree/page.tsx` | OST visualization (stable canvas) |
| `/src/app/i/[token]/page.tsx` | **Public interview page** |

### API Routes
| Path | Purpose |
|------|---------|
| `/src/app/api/templates/route.ts` | Template CRUD |
| `/src/app/api/interviews/route.ts` | Interview CRUD |
| `/src/app/api/chat/route.ts` | Live interview |
| `/src/app/api/synthesis/route.ts` | Snapshot generation |
| `/src/app/api/opportunities/route.ts` | OST management |

### AI Agents
| Path | Purpose |
|------|---------|
| `/src/mastra/agents/projectGenerator.ts` | Generate project structure from descriptions |
| `/src/mastra/agents/planner.ts` | Generate rubrics |
| `/src/mastra/agents/interviewer.ts` | Conduct interviews |
| `/src/mastra/agents/synthesizer.ts` | Create snapshots |
| `/src/mastra/agents/mapper.ts` | Map opportunities |
| `/src/mastra/index.ts` | Register all 5 agents |

### Components
| Path | Purpose |
|------|---------|
| `/src/components/snapshot/` | ExperienceMap, QuoteReel, FactsPanel, ValidationUI |
| `/src/components/tree/` | OSTCanvas, OpportunityNode, EvidencePanel |

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenRouter (for AI)
OPENROUTER_API_KEY=sk-or-v1-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Quick Mental Model

1. **Projects** contain research initiatives
2. **Templates** are AI-generated interview scripts
3. **Interviews** are individual sessions (accessed via `/i/{token}`)
4. **Messages** are the conversation (synced in real-time)
5. **Snapshots** are structured summaries (human-validated)
6. **Opportunities** form the OST (tree via `parent_id`)
7. **Evidence** links quotes to opportunities

Every step involves:
- AI does the heavy lifting
- Human validates/approves
- Nothing is auto-committed

