# AIcrew – Project Brief

## Founder
Brandon Harwood  
Commercial Pilot / Software Builder  
Solo Founder – No dev team  

---

# 1. Vision

AIcrew is an AI-powered aviation training companion designed to simulate intelligent recurrent training sessions for professional pilots.

The long-term goal is to:

- Deliver dynamic AI voice-based training sessions
- Adapt to pilot knowledge level
- Enforce tier-based usage limits
- Allow aircraft-specific training
- Integrate operator-specific SOPs and manuals
- Provide cited training references (FCOM/AOM-based)
- Become a SaaS platform for individual pilots and airlines

This is not a quiz app.  
This is an AI Instructor Engine.

---

# 2. Current Architecture (MVP v0.1)

AIcrew is currently a full-stack web app:

Frontend:
- Vite
- React
- TypeScript

Backend:
- Express
- TypeScript
- Prisma 7.x
- SQLite (dev only)

Auth:
- Custom email + password
- Cookie-based sessions
- Tier stored on user record (Standard currently)

Database models currently implemented:

User (working)
Session (working)
Topic (working)

---

# 3. Core Features Currently Working

✔ Email/password registration  
✔ Login  
✔ Cookie-based authentication  
✔ Tier value returned from /auth/me  
✔ Session creation  
✔ Session end  
✔ Session deletion  
✔ Active session detection  
✔ Tier-based session cap (frontend auto-end logic)  
✔ Topic table  
✔ Topic seed endpoint  
✔ Topic dropdown filtered by aircraft  
✔ Search filter for topics  
✔ Elapsed time tracking  
✔ Server-side enforcement of active session  

The system is stable.

---

# 4. Current Data Models

## Session

- id
- aircraft
- topic
- startedAt
- endedAt
- notes
- rating

No duration column (elapsed is derived).

## Topic

- id
- aircraft
- title
- category
- createdAt

Unique constraint: (aircraft, title)

## User

- id
- email
- passwordHash
- tier (Standard, Pro planned)
- createdAt

---

# 5. Immediate Next Phase (Priority Roadmap)

## Phase 1 – Backend Hardening

1. Enforce tier session caps server-side (not only frontend)
2. Prevent multiple active sessions per user
3. Link sessions to userId
4. Add proper relational integrity
5. Add basic logging
6. Improve error handling

## Phase 2 – AI Session Engine

This is the core product.

Goals:

- When session starts:
  - Create AI training context
  - Load aircraft + topic
  - Use system prompt template
  - Begin structured training flow

- AI session should:
  - Ask knowledge questions
  - Detect weak knowledge
  - Provide correction
  - Offer scenario-based questions
  - Maintain structured flow
  - End with summary + strengths/weaknesses

### AI Integration Plan

- Use OpenAI Realtime Voice Agent
- Session ID linked to AI context
- Store conversation logs (initially JSON)
- Persist knowledge deltas

---

# 6. Medium-Term Goals

## Document-Aware Topics

User uploads FCOM/AOM/POH PDF.

System:
- Extracts text
- Generates categorized topics
- Stores in Topic table
- Adds page references
- Later supports citations

This becomes AIcrew’s core defensibility.

---

# 7. Long-Term Platform Goals

### Individual Users
- Tiered plans (Standard / Pro / Airline)
- Time-limited sessions
- Progress tracking
- Knowledge heatmaps

### Airline Mode
- Company SOP upload
- Custom topic restrictions
- Training tracking dashboard
- Compliance reporting

---

# 8. Constraints

- Solo founder
- Must minimize external paid dependencies
- Prefer self-hosted auth over Auth0
- SQLite for dev only
- Postgres for production
- Clean architecture
- Maintain code clarity

---

# 9. Branching Policy

OpenClaw must:

- Never modify main directly
- Always create feature branches:
  - feature/auth-hardening
  - feature/session-ai-engine
  - feature/topic-generation
- Provide PR-ready commits
- Maintain TypeScript strict mode

---

# 10. Current Technical Gaps

OpenClaw should next:

1. Refactor backend to attach sessions to users
2. Enforce server-side tier cap
3. Add session ownership validation
4. Add structured AI session lifecycle design
5. Design AI conversation state schema
6. Prepare database for storing AI logs
7. Abstract AI provider interface (so provider can change later)
8. Add global React UserContext

---

# 11. AI Session Design Intent

Each session should have:

- Phase 1: Knowledge probing
- Phase 2: Deep dive correction
- Phase 3: Scenario challenge
- Phase 4: Human factors integration
- Phase 5: Debrief summary

This is not random Q&A.

This is structured instructional flow.

---

# 12. Quality Standard

AIcrew must feel:

- Professional
- Aviation-grade
- Structured
- Not like ChatGPT
- Not like a toy
- Like a digital instructor

---

# 13. OpenClaw Execution Expectations

OpenClaw should:

- Read entire repo
- Maintain architecture consistency
- Avoid unnecessary rewrites
- Build incrementally
- Use small feature branches
- Avoid large sweeping refactors
- Comment clearly
- Not introduce heavy frameworks without justification

---

# 14. Current Status

Stable MVP.
Auth working.
Sessions working.
Topics working.
Tier placeholder implemented.

Next big milestone:
AI session engine integration.

---

END OF BRIEF
