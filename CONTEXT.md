# Command Center - Project Context

## What It Is
Unified command center for Jonathan's three workstreams: SOS, Reforge, and Harmony Strategy.
- **Task Tracking**: Full visibility across all projects with priority sorting
- **Decision Queue**: Pipeline decisions for Reforge (321 decisions, sorted by urgency)
- **Intel Agents**: Proactive monitoring via cron jobs
- **Metrics Dashboard**: Quota tracking, pipeline health, milestone progress

## Current State (2026-02-03)
- **UI**: Live at `localhost:8080/app/`
- **89 tasks** across all projects
- **12 urgent** items needing immediate attention
- **25 grants** in SOS pipeline
- **$320K** Reforge pipeline active

## Architecture

### Views
1. **Command Center** (`/app/index.html`) - Full task dashboard
2. **Decision Queue** (`/app/decision-queue.html`) - Pipeline triage UI
3. **Server** (`server.py`) - HTTP server + API for decision logging

### Data Structure
```
/data/
  tasks.json             - All tasks (89 items, 6 projects)
  decisions-queue.json   - Pipeline decisions (321 items)
  decision-log.json      - User decision history
  hubspot-*.json         - CRM data (5,514 contacts, 307 deals)
  grants.json            - Grant opportunities (25 items)
  *-signals.json         - Intel from monitoring agents
```

## Projects Tracked

### 🆘 SOS (P0)
- **June 2026**: $275K milestone deadline
- **MVP**: 75% complete
- **Partners**: 1 active (Aid Arena), 5 pending
- **Grants**: 25 in pipeline, March 3 EDA deadline

Key Categories:
- Product Development (10 tasks)
- Grant Pipeline (10 tasks)
- Partnership Outreach (8 tasks)
- Demo Preparation (6 tasks)
- Technical Milestones (5 tasks)

### 🚀 Reforge (P1)
- **Q1 Quota**: $150K ARR, 75 meetings
- **Current**: $50.1K ARR (33%), 12 meetings (16%)
- **Pipeline**: $320K active, $245K at risk

Key Categories:
- Urgent Deals (5 tasks)
- Meeting Prep (2 tasks)
- Stalled Reengagement (4 tasks)
- Closed Lost Revival (4 tasks)
- Prospecting (3 tasks)

### 🎯 Harmony (P2)
- **Revenue**: $45K active retainers
- **At Risk**: $15K (DI Global critical)
- **Outstanding**: $8.5K invoices

Key Categories:
- Critical/At-Risk (2 tasks)
- Active Delivery (5 tasks)
- Follow-ups (2 tasks)
- Upsell Opportunities (3 tasks)

### 🧠 Context Graph Foundation (P0)
Infrastructure powering all three products - decision traces, embeddings, similarity search.

## Decision Queue Logic (per Jonathan)
1. **High value ($10K+) + NO meeting** = needs decision NOW (bleeding)
2. High value + has meeting = has momentum
3. Lower value + no meeting
4. Lower value + has meeting

## Intel Agents (Cron)
| Agent | Schedule | Focus |
|-------|----------|-------|
| Reforge | 9am, 12pm, 5pm EST M-F | Pipeline, competitors, signals |
| SOS | 10am, 6pm EST daily | Grants, partners, competitors |
| Harmony | 11am EST M-F | Client health, risks |
| Morning Brief | 9am EST daily | Daily summary |

## Files That Matter
```
/app/index.html          - Command Center UI
/app/decision-queue.html - Decision Queue UI
/data/tasks.json         - Task database
/data/grants.json        - Grant opportunities
/intel/*.json            - Signal files from agents
/server.py               - HTTP server
```

## Urgent Items Right Now
1. **EvenUp** - $50K pilot, 105 days stalled (Reforge)
2. **DI Global (Orly)** - 13 weeks overdue, refund pending (Harmony)
3. **Muse Group** - $15K, 61 days in contracting (Reforge)
4. **EDA Grant** - March 3 deadline (SOS)
5. **Aid Arena** - Blocked on channel setup (SOS)

## Next Steps
- [ ] Start Command Center server: `python3 server.py`
- [ ] Review urgent tasks in UI
- [ ] Process stalled deals in Decision Queue
- [ ] Submit EDA grant application before March 3
