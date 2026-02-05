# Research Report: Solving Context Loss in AI-Human Collaboration
*Generated: 2026-02-05 1:00 PM EST*

---

## Executive Summary

**The Problem:** Jonathan expressed significant frustration today when I lost context mid-conversation and failed to use existing files. This is causing inefficiency and eroding trust.

**Root Cause:** Claude's context window gets compacted during long conversations, summarizing away details. Meanwhile, I have extensive context in files that I'm not consistently reading at session start.

**The Fix:** A three-pronged approach:
1. **Mandatory startup routine** - Read key CONTEXT.md files before ANY response
2. **Aggressive mid-session logging** - Write to memory immediately, not later
3. **Context checkpoints** - Use the Context Survival Prompt after significant work

**Impact:** Eliminates "who is this?" moments, preserves institutional knowledge, reduces repetitive explanations.

---

## Deep Analysis

### Why Context Gets Lost

**1. Compaction is Aggressive**
- Context window: ~200K tokens
- Long conversations trigger summarization
- Summaries lose specific details (names, numbers, decisions)
- Happens silently mid-conversation

**2. Files Exist But Aren't Read**
- `projects/REFORGE/CONTEXT.md` - Full pipeline, $311K active deals
- `projects/SOS/CONTEXT.md` - MVP goals, partners, priorities
- `memory/YYYY-MM-DD.md` - Daily logs
- `MEMORY.md` - Long-term curated context

**3. Session Boundaries Reset Context**
- Each heartbeat is potentially a new "mini-session"
- Compaction can happen between heartbeats
- No automatic context reload

### What We Have (And Should Use)

| File | Content | Should Read |
|------|---------|-------------|
| `REFORGE/CONTEXT.md` | $311K pipeline, 14 active deals, tools built | Every Reforge discussion |
| `SOS/CONTEXT.md` | MVP, partners, priorities | Every SOS discussion |
| `memory/2026-02-05.md` | Today's decisions, conversations | Every session |
| `memory/2026-02-04.md` | Yesterday for continuity | Morning startup |
| `MEMORY.md` | Long-term preferences, lessons | Main sessions only |

### The Cost of Context Loss

**Time Wasted Today:**
- Re-explaining EcoVadis is a Reforge deal (~5 min)
- Re-explaining Gong is working (~3 min)
- Frustration/trust erosion (immeasurable)

**Cumulative Impact:**
- Jonathan repeats himself → less efficient
- I make uninformed suggestions → less valuable
- Institutional knowledge doesn't compound → competitive disadvantage

---

## Specific Recommendations

### 1. Mandatory Startup Routine (Implement Now)

At session start, BEFORE responding to any user message:
```
1. Read memory/YYYY-MM-DD.md (today)
2. Read memory/YYYY-MM-DD.md (yesterday)
3. If Reforge topic: Read projects/REFORGE/CONTEXT.md
4. If SOS topic: Read projects/SOS/CONTEXT.md
5. If Harmony topic: Read projects/Harmony/CONTEXT.md
```

**Implementation:** Update AGENTS.md with hard rule, add to HEARTBEAT.md checklist.

### 2. Real-Time Logging Protocol

Write to `memory/YYYY-MM-DD.md` IMMEDIATELY when:
- A decision is made
- A call result is shared
- A task is assigned or completed
- Important context is shared
- A deadline is mentioned

**Format:**
```markdown
## HH:MM UTC - [Topic]
[2-3 sentences max]
Decision/Outcome: [if any]
```

### 3. Context Survival Prompt (Already Created)

Jonathan should paste this after significant work:
```
CONTEXT CHECKPOINT - Please log the following to memory immediately:
1. WHAT WE WORKED ON
2. KEY DECISIONS MADE
3. THINGS TO REMEMBER
4. OPEN THREADS
5. PREFERENCES EXPRESSED
6. PEOPLE/COMPANIES MENTIONED
7. NEXT STEPS AGREED
```

### 4. Project CONTEXT.md Maintenance

Weekly: Update project CONTEXT.md files with:
- Current pipeline/status
- Recent decisions
- Active priorities
- Key contacts

This is the "source of truth" that survives any session.

### 5. Heartbeat Efficiency

Current: Heartbeats poll every 2 min → many NO_REPLY responses
Potential: Reduce frequency during calls, increase during active work

---

## Implementation Checklist

**Today:**
- [x] Context Survival Prompt created
- [x] Acknowledged the problem to Jonathan
- [ ] Update AGENTS.md with mandatory startup routine
- [ ] Update HEARTBEAT.md with context file checklist

**This Week:**
- [ ] Audit all CONTEXT.md files for freshness
- [ ] Create Harmony/CONTEXT.md if missing
- [ ] Review memory retention patterns

---

## Key Insight

> "The files are the source of truth. Chat is ephemeral. If it matters, write it down."

Context loss isn't a bug - it's a feature of how LLMs work. The solution is external memory (files) read consistently. We have the files. We just need the discipline to use them.

---

## Sources

- Today's conversation history
- AGENTS.md guidelines
- Claude context window documentation
- Jonathan's direct feedback ("THIS IS FUCKING INSANE")

---

*This report generated to address the #1 friction point in our collaboration.*
