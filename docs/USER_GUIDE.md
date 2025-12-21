# Discovery Co-Pilot User Guide

> Build, interview, and discover insights with Discovery Co-Pilot.

Get started building research projects, conducting AI-powered interviews, and mapping opportunities. Start your journey with walkthroughs, best practices, and deep dives into every part of the platform.

---

## Table of Contents

- [Getting Started](#getting-started)
  - [Quick Start](#quick-start)
  - [Interview Guide](#interview-guide)
  - [Question Library](#question-library)
  - [Project Templates](#project-templates)
  - [Teresa Torres Methodology](#teresa-torres-methodology)
  - [Glossary](#glossary)
- [Account & Access](#account--access)
  - [Creating Your Account](#creating-your-account)
  - [Managing Projects](#managing-projects)
  - [Team Collaboration](#team-collaboration)
- [Building Your Research](#building-your-research)
  - [Using the AI Agents](#using-the-ai-agents)
  - [Creating Templates](#creating-templates)
  - [Managing Interviews](#managing-interviews)
  - [Working with Snapshots](#working-with-snapshots)
  - [Building Your OST](#building-your-ost)
  - [Managing Evidence](#managing-evidence)
- [Setting Up Your Project](#setting-up-your-project)
  - [Project Configuration](#project-configuration)
  - [Interview Access Links](#interview-access-links)
  - [Participant Experience](#participant-experience)
  - [Data Privacy](#data-privacy)
- [Analysis & Insights](#analysis--insights)
  - [Experience Maps](#experience-maps)
  - [Quote Reels](#quote-reels)
  - [Blind Spot Detection](#blind-spot-detection)
  - [Cross-Interview Patterns](#cross-interview-patterns)
- [Integrations](#integrations)
  - [Supabase Database](#supabase-database)
  - [OpenRouter AI](#openrouter-ai)
  - [Export Options](#export-options)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
  - [FAQ](#faq)
  - [Getting Help](#getting-help)

---

# Getting Started

## Quick Start

Jump right in and run your first Discovery Co-Pilot interview in under 10 minutes.

### Step 1: Create Your Account

1. Visit the app at `http://localhost:3000`
2. Click **Sign Up**
3. Enter your email and password
4. Verify your email if required

### Step 2: Create Your First Project

1. From the dashboard, click **New Project**
2. Fill in the project details:
   - **Name**: Give your research initiative a clear name
   - **Research Goals**: What do you want to learn?
   - **Target Audience**: Who are you interviewing?
   - **Desired Outcome**: What's the business goal? (This becomes your OST root)

### Step 3: Generate an Interview Template

1. Go to your project → **Templates** tab
2. Click **Generate New Template**
3. The AI Planner will create a story-based interview rubric
4. Review the questions and click **Approve**

### Step 4: Create & Share an Interview Link

1. Go to your project → **Interviews** tab
2. Click **Create Interview**
3. Copy the generated link (e.g., `/i/abc123xyz`)
4. Share with your participant

### Step 5: Review Results

1. After the interview completes, click **Generate Snapshot**
2. Review the Experience Map, Quote Reel, and Facts
3. Click **Approve** to validate
4. Extract opportunities to your OST

---

## Interview Guide

Master the art of AI-powered story excavation.

### The Story-Based Approach

Discovery Co-Pilot uses Teresa Torres' methodology where every question focuses on **specific past behaviors**, not opinions or hypotheticals.

| ❌ Bad Questions | ✅ Good Questions |
|-----------------|-------------------|
| "Do you like our checkout?" | "Tell me about the last time you abandoned a cart" |
| "Would you use feature X?" | "Walk me through a recent frustrating experience" |
| "What do you think about..." | "Describe a time when..." |

### How the AI Interviewer Works

The AI Interviewer agent:
1. **Opens warmly** - Builds rapport and explains the purpose
2. **Follows the rubric** - Uses your approved template
3. **Digs for stories** - Never accepts vague answers
4. **Probes emotions** - "How did that make you feel?"
5. **Tracks coverage** - Ensures all topics are explored
6. **Closes gracefully** - Thanks participant after ~25 exchanges

### Handling Vague Answers

When participants give generalizations like "I usually..." or "I typically...", the AI automatically redirects:

- *"That's helpful context. Can you walk me through the most recent time this happened?"*
- *"I'd love to hear about a specific instance. What comes to mind?"*
- *"Let's zoom in on one example. When was the last time?"*

---

## Question Library

Pre-built story-based questions you can use in your templates.

### Discovery Questions

| Category | Question |
|----------|----------|
| **Problem Discovery** | "Tell me about the last time you struggled with [problem area]" |
| **Workflow** | "Walk me through how you typically handle [task]" |
| **Decision Making** | "Describe a recent time you had to choose between [options]" |
| **Pain Points** | "Tell me about a frustrating experience with [area]" |
| **Workarounds** | "What workarounds have you created to deal with [problem]?" |

### Follow-Up Probes

| Type | Examples |
|------|----------|
| **Timeline** | "What happened next?" / "And then?" |
| **Emotion** | "How did that make you feel?" / "What was going through your mind?" |
| **Specificity** | "Can you give me a specific example?" / "When exactly was this?" |
| **Context** | "Where were you when this happened?" / "Who else was involved?" |
| **Outcome** | "How did it turn out?" / "What did you end up doing?" |

### Closing Questions

- "Is there anything else you'd like to share?"
- "What haven't I asked about that I should have?"
- "Any final thoughts on [topic]?"

---

## Project Templates

Start with pre-configured research templates for common use cases.

### E-commerce Research
- **Goals**: Understand checkout friction, cart abandonment
- **Audience**: Online shoppers
- **Key Topics**: Payment flow, shipping expectations, trust signals

### SaaS Onboarding
- **Goals**: Identify onboarding blockers, activation barriers
- **Audience**: New users in first 30 days
- **Key Topics**: First-run experience, feature discovery, aha moments

### Product-Market Fit
- **Goals**: Validate problem-solution fit
- **Audience**: Target customer segment
- **Key Topics**: Current solutions, switching triggers, willingness to pay

### Customer Churn
- **Goals**: Understand why users leave
- **Audience**: Churned or at-risk customers
- **Key Topics**: Unmet expectations, competitive alternatives, last straw moments

---

## Teresa Torres Methodology

The framework behind Discovery Co-Pilot.

### Core Principles

1. **Stories Over Opinions**
   - Focus on what people *actually did*, not what they *might do*
   - Past behavior predicts future behavior better than stated preferences

2. **Immediate Synthesis**
   - Process each interview within 15 minutes
   - Never let interview data pile up
   - Fresh insights are more actionable

3. **Trees Over Lists**
   - Structure opportunities hierarchically
   - Parent-child relationships reveal root causes
   - OST (Opportunity Solution Tree) prevents flat backlogs

4. **Human-in-the-Loop**
   - AI augments, never replaces, human judgment
   - Every insight requires explicit approval
   - Researchers maintain full control

### The Four Outputs

| Output | Purpose |
|--------|---------|
| **Experience Map** | Timeline of the user's story (actions + feelings) |
| **Quote Reel** | 3-5 most emotionally resonant quotes |
| **Facts** | Objective data (role, tools, frequency) |
| **Blind Spots** | What we missed that we should have explored |

### Learn More

- 📖 [Continuous Discovery Habits](https://www.producttalk.org/book/) by Teresa Torres
- 🎥 [Product Talk Resources](https://www.producttalk.org/)

---

## Glossary

Key terms used throughout Discovery Co-Pilot.

| Term | Definition |
|------|------------|
| **OST** | Opportunity Solution Tree - hierarchical visualization of opportunities |
| **Snapshot** | Structured summary of an interview (Experience Map + Quotes + Facts + Blind Spots) |
| **Template** | AI-generated interview rubric with story-based questions |
| **Rubric** | The structured script the AI follows during interviews |
| **Evidence** | Direct quotes linked to specific opportunities |
| **Story Excavation** | Technique of digging into specific past experiences |
| **Blind Spots** | Topics mentioned but not fully explored |
| **Desired Outcome** | The root node of your OST (business goal) |
| **Access Token** | Unique identifier for interview links (`/i/{token}`) |

---

# Account & Access

## Creating Your Account

Set up your Discovery Co-Pilot account.

### Sign Up Process

1. Navigate to the login page
2. Click "Sign Up"
3. Enter your details:
   - Email address
   - Password (minimum 8 characters)
4. Submit and verify your email

### Authentication

Discovery Co-Pilot uses Supabase Auth which supports:
- Email/password login
- Password reset via email
- Session management

---

## Managing Projects

Organize your research initiatives.

### Project Structure

```
Your Account
└── Projects (unlimited)
    ├── Templates (multiple per project)
    ├── Interviews (multiple per project)
    │   ├── Messages (conversation)
    │   └── Snapshot (one per interview)
    └── OST (one tree per project)
        ├── Opportunities
        └── Evidence
```

### Project Settings

| Setting | Description |
|---------|-------------|
| **Name** | Project title visible in dashboard |
| **Research Goals** | Guides AI template generation |
| **Target Audience** | Who you're interviewing |
| **Desired Outcome** | Root of your OST |
| **AI Model** | Which LLM to use (default: Claude Sonnet 4) |
| **Max Duration** | Target interview length in minutes |
| **Tone** | Professional, casual, friendly |

---

## Team Collaboration

*Coming in V2*

Future features planned:
- Invite team members to projects
- Role-based access (viewer, editor, admin)
- Shared workspaces
- Comment threads on snapshots

---

# Building Your Research

## Using the AI Agents

Discovery Co-Pilot includes four specialized AI agents.

### Planner Agent

**Purpose**: Generate interview templates

**When It's Used**: When you click "Generate New Template"

**What It Does**:
- Analyzes your project goals
- Creates story-based questions
- Adds follow-up probes
- Includes vague-answer redirects
- Estimates time per section

**Customization**:
- Edit the generated rubric before approving
- Add/remove questions
- Adjust introduction and closing scripts

---

### Interviewer Agent

**Purpose**: Conduct AI-powered interviews

**When It's Used**: When participants use the `/i/{token}` link

**What It Does**:
- Follows the approved template
- Maintains conversational tone
- Digs deeper on vague answers
- Tracks emotional moments
- Ends after ~25 meaningful exchanges

**Behavior Rules**:
- Never asks leading questions
- Always pursues specific stories
- Acknowledges emotions
- Stays warm and curious

---

### Synthesizer Agent

**Purpose**: Create Interview Snapshots

**When It's Used**: When you click "Generate Snapshot"

**What It Does**:
- Analyzes full transcript
- Extracts timeline (Experience Map)
- Identifies emotional quotes (Quote Reel)
- Separates facts from interpretation
- Detects blind spots

**Output Format**:
```json
{
  "experience_map": [...],
  "quote_reel": [...],
  "facts": {...},
  "blind_spots": [...]
}
```

---

### Mapper Agent

**Purpose**: Extract opportunities for OST

**When It's Used**: When you click "Extract Opportunities"

**What It Does**:
- Identifies pain points, unmet needs, workarounds
- Suggests parent-child relationships
- Checks for duplicates with existing opportunities
- Links evidence quotes

**Human Approval Required**: All suggestions need explicit approval before adding to OST.

---

## Creating Templates

Build your interview script.

### Generate with AI

1. Go to **Project → Templates**
2. Click **Generate New Template**
3. Wait for AI to create rubric (10-30 seconds)
4. Review the generated content

### Template Structure

```json
{
  "introduction": "Welcome script...",
  "topics": [
    {
      "name": "Topic Name",
      "questions": [
        {
          "question": "Tell me about...",
          "followUps": ["What happened next?"],
          "probes": ["Can you be specific?"],
          "estimatedMinutes": 3
        }
      ]
    }
  ],
  "closing": "Thank you script..."
}
```

### Edit & Approve

1. Click **Edit** to modify the rubric
2. Add, remove, or reorder questions
3. Click **Save Changes**
4. Click **Approve** to mark as ready
5. Click **Activate** to use for new interviews

### Best Practices

- ✅ Keep questions open-ended
- ✅ Start with broad topics, then narrow
- ✅ Include emotional probes
- ❌ Avoid yes/no questions
- ❌ Don't ask about hypotheticals

---

## Managing Interviews

Create and track interview sessions.

### Create an Interview

1. Go to **Project → Interviews**
2. Click **Create Interview**
3. (Optional) Add participant name
4. Copy the generated link

### Interview States

| Status | Description |
|--------|-------------|
| **Pending** | Link created, not yet started |
| **Active** | Participant has started |
| **Completed** | Interview finished |
| **Abandoned** | Started but not completed |

### Interview Link

Each interview gets a unique access token:
```
https://yourapp.com/i/abc123xyz
           └── domain   └── token
```

### View Transcript

1. Click on any interview
2. See full message history
3. Messages are color-coded by role
4. Timestamps show conversation flow

### Mark as Complete

If the AI doesn't auto-complete:
1. Open the interview detail
2. Click **Mark as Completed**
3. Interview status updates to "completed"

---

## Working with Snapshots

Transform transcripts into structured insights.

### Generate a Snapshot

1. Interview must be **completed**
2. Go to **Interview → Snapshot** tab
3. Click **Generate Snapshot**
4. Wait for AI analysis (15-30 seconds)

### Review Components

#### Experience Map
- Timeline of participant's story
- Each step has: Action + Feeling
- Chronological order

#### Quote Reel
- 3-5 most impactful quotes
- Each includes: Quote + Context + Emotion
- Direct text from interview

#### Facts Panel
- Objective information extracted
- Role, tools used, frequency
- No interpretation, just data

#### Blind Spots
- Topics mentioned but not explored
- Suggestions for follow-up
- Severity: low / medium / high

### Validate the Snapshot

1. Review each component
2. Add notes if needed
3. Click **Approve** or **Reject**
4. Only approved snapshots can feed the OST

---

## Building Your OST

Create your Opportunity Solution Tree.

### What is an OST?

A hierarchical tree structure:
```
Desired Outcome (Root)
├── Opportunity A
│   ├── Sub-opportunity A1
│   └── Sub-opportunity A2
├── Opportunity B
│   └── Solution B1
└── Opportunity C
```

### Add Opportunities

**From Snapshot**:
1. Open an approved snapshot
2. Click **Extract Opportunities**
3. Review AI suggestions
4. Approve/reject each one

**Manually**:
1. Go to **Project → Tree**
2. Click **Add Opportunity**
3. Fill in title and description
4. Select parent node

### Node Types

| Type | Purpose | Color |
|------|---------|-------|
| **Outcome** | Business goal (root) | Purple |
| **Opportunity** | User need/problem | Amber |
| **Unmet Need** | Desire not fulfilled | Amber |
| **Workaround** | Hacky solution user created | Blue |
| **Solution** | Possible fix | Green |

### Organize the Tree

- **Drag nodes** to reposition
- **Connect nodes** to change parent
- **Delete nodes** with confirmation
- **View evidence** in side panel

### Filter by Interview

- Use interview selector
- See which opportunities came from which interview
- Track evidence distribution

---

## Managing Evidence

Link quotes to opportunities.

### What is Evidence?

Direct quotes from interviews that support an opportunity:
```
Opportunity: "Login Issues"
Evidence: 
  - "I couldn't figure out how to reset my password" - Interview #3
  - "The login page kept refreshing on mobile" - Interview #7
```

### Add Evidence

1. Select an opportunity in the OST
2. Click **View Evidence**
3. Click **Add Evidence**
4. Select interview and quote
5. Add context if needed

### Evidence Count

Each opportunity shows:
- Number of evidence pieces
- Helps prioritize (more evidence = bigger problem)

---

# Setting Up Your Project

## Project Configuration

Customize your research settings.

### AI Model Selection

Choose which LLM powers your agents:

| Model | Best For |
|-------|----------|
| Claude Sonnet 4 (Default) | Balanced quality and speed |
| Claude Opus | Highest quality, slower |
| GPT-4o | Alternative provider |

### Interview Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Max Duration | 15 min | Target interview length |
| Tone | Professional | Interviewer personality |
| Auto-complete | Enabled | End after ~25 exchanges |

---

## Interview Access Links

Manage participant access.

### Current System

- Each interview has a **unique link**
- One link = one interview = one participant
- Links are reusable (participant can return)

### Link Security

- Tokens are randomly generated (nanoid)
- No login required for participants
- Links can be invalidated by deleting the interview

### Future: Study Links

*Coming Soon*

- Single link for entire project
- Multiple participants use same link
- Quota control (max interviews)
- Expiration date

---

## Participant Experience

What participants see.

### Welcome Screen

1. Participant opens link
2. Sees welcome message
3. Enters name (optional)
4. Clicks **Start Interview**

### Chat Interface

- Clean, distraction-free design
- Messages appear in real-time
- Typing indicator during AI response
- Mobile-friendly

### Completion

When interview ends:
- Thank you message displayed
- "You can safely close this page"
- No further action needed

---

## Data Privacy

Protect participant information.

### Data Storage

- All data stored in Supabase
- PostgreSQL database
- Row Level Security (RLS) enabled

### Access Control

| Who | Can Access |
|-----|------------|
| Project Owner | Everything |
| Participants | Only their interview (via token) |
| Public | Nothing |

### Data Deletion

- Delete interview = deletes messages + snapshot
- Delete project = deletes all related data
- Cascading deletes configured

---

# Analysis & Insights

## Experience Maps

Visualize the participant's journey.

### What It Shows

A timeline of events:
1. Step 1: Action + Feeling
2. Step 2: Action + Feeling
3. Step 3: Action + Feeling
...

### How to Use

- Identify emotional low points
- Find decision moments
- Map the journey before/after
- Compare across interviews

---

## Quote Reels

Capture the most powerful moments.

### Selection Criteria

Quotes are selected for:
- Emotional resonance
- Clear illustration of struggle
- Memorable phrasing
- Context richness

### Quote Format

```
"I just wanted something that works, not another tool I have to learn"
└── Context: Discussing software evaluation
└── Emotion: Frustration
```

### Best Uses

- Stakeholder presentations
- Design inspiration
- Problem validation
- Team alignment

---

## Blind Spot Detection

Find what you missed.

### How It Works

The AI notices:
- Topics mentioned but not explored
- Hesitations in responses
- Potential opportunities skipped

### Severity Levels

| Level | Meaning |
|-------|---------|
| **Low** | Minor detail, nice to have |
| **Medium** | Worth following up |
| **High** | Critical gap, affects research quality |

### Taking Action

- Note blind spots for future interviews
- Adjust template questions
- Consider follow-up interview

---

## Cross-Interview Patterns

*Coming in V2*

Future analysis features:
- Pattern detection after 5+ interviews
- Opportunity frequency across interviews
- Segment comparison
- Trend analysis

---

# Integrations

## Supabase Database

Your data backbone.

### What It Provides

- PostgreSQL database
- Real-time subscriptions
- Row Level Security
- Built-in auth

### Tables Used

| Table | Purpose |
|-------|---------|
| profiles | User accounts |
| projects | Research initiatives |
| templates | Interview rubrics |
| interviews | Session records |
| messages | Chat history |
| snapshots | Structured summaries |
| opportunities | OST nodes |
| evidence | Quote links |

---

## OpenRouter AI

Multi-model AI access.

### What It Provides

- Access to multiple LLM providers
- Single API key for all models
- Cost-effective pricing

### Models Available

- Anthropic Claude (Sonnet, Opus)
- OpenAI GPT-4o
- And more...

### Configuration

Set in `.env.local`:
```
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## Export Options

*Coming in V2*

Planned export features:
- PDF Interview Snapshots
- OST as image
- Evidence report
- Slack/email updates

---

# Troubleshooting

## Common Issues

### Interview Link Not Working

**Symptoms**: "Interview not found or has expired"

**Solutions**:
1. Check the link is complete
2. Verify interview exists in dashboard
3. Check interview status (not deleted)

### AI Not Responding

**Symptoms**: Chat hangs, no response

**Solutions**:
1. Check OpenRouter API key in `.env.local`
2. Verify network connection
3. Check browser console for errors

### Snapshot Generation Failed

**Symptoms**: Error when generating snapshot

**Solutions**:
1. Ensure interview is marked "completed"
2. Check transcript has enough messages (min 4)
3. Retry after a few seconds

### OST Not Loading

**Symptoms**: Tree page blank or error

**Solutions**:
1. Refresh the page
2. Check browser console
3. Verify opportunities exist for project

---

## FAQ

### How long are interviews?

Default target is 15 minutes (~25 exchanges). The AI auto-completes after sufficient coverage.

### Can participants pause and resume?

Yes, they can close the browser and return using the same link.

### Is the conversation saved in real-time?

Yes, every message is saved immediately to Supabase.

### Can I edit the AI's questions?

Yes, edit the template rubric before approving it.

### How many interviews per project?

Unlimited.

### Can multiple people use the same link?

Currently, each interview needs its own link. Study Links feature coming soon.

---

## Getting Help

### Resources

- 📖 This User Guide
- 📝 `docs/HOW_IT_WORKS.md` - Technical explanation
- 📓 `docs/BUILD_JOURNAL.md` - Development notes
- 📋 `CLAUDE.md` - Original dev guide

### Debugging

Check browser developer tools:
1. Open DevTools (F12)
2. Check Console for errors
3. Check Network for failed API calls

### Environment Issues

Verify all env vars are set:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
NEXT_PUBLIC_APP_URL=...
```

---

## Quick Reference Card

### Key URLs

| Page | URL |
|------|-----|
| Dashboard | `/dashboard` |
| Project | `/dashboard/projects/[id]` |
| Templates | `/dashboard/projects/[id]/templates` |
| Interviews | `/dashboard/projects/[id]/interviews` |
| Transcript | `/dashboard/projects/[id]/interviews/[id]` |
| Snapshot | `/dashboard/projects/[id]/interviews/[id]/snapshot` |
| OST | `/dashboard/projects/[id]/tree` |
| Public Interview | `/i/[token]` |

### Key Actions

| Action | Location |
|--------|----------|
| Create Project | Dashboard → New Project |
| Generate Template | Project → Templates → Generate |
| Create Interview | Project → Interviews → Create |
| Generate Snapshot | Interview → Snapshot → Generate |
| Extract Opportunities | Snapshot → Extract |
| View OST | Project → Tree |

---

*Built with ❤️ using Teresa Torres' Continuous Discovery methodology*

