# Command Center Upgrade Plan

## Current State
- Static JSON file (`data/tasks.json`)
- Single page view
- No persistence to DB
- No user/team support

## Target State
- Tasks as decision traces in Supabase
- Multi-project drill-down views
- Grunt's dark ops aesthetic
- Multi-user support for Victoria + team

---

## Architecture

### Tasks ARE Decision Traces
Every task creation/update/completion is a decision:
```
decision_type: "task_created" | "task_updated" | "task_completed" | "task_delegated"
reasoning: "Why this task? What's it blocking?"
entity_ids: [project_id, assignee_id]
```

### New Tables (extend context_graph_schema)

```sql
-- Tasks table (linked to decision_traces)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id),
    
    -- Hierarchy
    project_id UUID,  -- References entity (project)
    parent_task_id UUID REFERENCES tasks(id),  -- For subtasks
    
    -- Core
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',  -- pending, in_progress, blocked, done
    priority TEXT DEFAULT 'P2',     -- P0, P1, P2, P3
    
    -- Assignment
    assignee_id UUID REFERENCES actors(id),
    delegated_by UUID REFERENCES actors(id),
    
    -- Timing
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Context graph link
    created_decision_id UUID REFERENCES decision_traces(id),
    completed_decision_id UUID REFERENCES decision_traces(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Projects as entities
-- project_type: 'sos', 'reforge', 'harmony', 'grunt', 'command_center'
-- Each project has: strategy, ops, metrics sub-views
```

### URL Structure
```
/                           → All projects overview
/p/sos                      → SOS project
/p/sos/strategy             → SOS strategy view
/p/sos/tasks                → SOS tasks
/p/sos/metrics              → SOS metrics
/p/reforge                  → Reforge project
/p/reforge/pipeline         → Reforge pipeline view
```

---

## UI Design (Grunt Aesthetic)

### Colors
```css
:root {
    --bg: #0a0f0a;
    --card-bg: #141f14;
    --card-border: #1e2e1e;
    --text: #ffffff;
    --text-secondary: #8a9a8a;
    --text-dim: #5a6a5a;
    --green: #2d5a2d;
    --green-light: #4a8c4a;
    --green-bright: #5cb85c;
    --green-glow: rgba(92, 184, 92, 0.3);
    --red: #8b3a3a;
    --red-light: #a85454;
    --gold: #d4a530;
    --blue: #4a90d4;
}
```

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  ⚡ COMMAND CENTER                      [Victoria] [Switch] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   SOS   │ │ REFORGE │ │ HARMONY │ │  GRUNT  │           │
│  │  3 P0   │ │  2 P1   │ │  1 P2   │ │  1 P0   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  ALL TASKS                                    [+] [Filter]  │
│  ─────────────────────────────────────────────────────────  │
│  ○ P0  Run context graph migration          [GRUNT] [Henry] │
│  ○ P0  Implement swipe → trace              [GRUNT] [Henry] │
│  ○ P1  Follow up Fox Local                [REFORGE] [Jonathan]│
│  ○ P1  Qualify leads in Grunt            [REFORGE] [Jonathan]│
│  ○ P1  Set Helene channel                    [SOS] [Henry] │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Project Drill-Down
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back    REFORGE                              $311K pipe  │
├─────────────────────────────────────────────────────────────┤
│  [Strategy] [Pipeline] [Tasks] [Metrics]                    │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  PIPELINE                                                   │
│  ─────────────────────────────────────────────────────────  │
│  Neo Financial    $60K   IA+Research    Pricing sent        │
│  EvenUp           $50K   IA             In pilot            │
│  Fox Local        $27K   IA+R+Build     Budget 2-4 weeks    │
│  ...                                                        │
│                                                             │
│  ═══════════════════════════════════════════════════════   │
│  TASKS                                                      │
│  ─────────────────────────────────────────────────────────  │
│  ○ P1  Qualify leads in Grunt                    [Jonathan] │
│  ○ P1  Follow up: Fox, DreamHost, EvenUp         [Jonathan] │
│  ○ P1  Re-engage iRobot, WSFS                    [Jonathan] │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: DB Schema + API (Today)
1. Add tasks table to context_graph_schema.sql
2. Create Supabase edge function for tasks CRUD
3. Seed with current tasks

### Phase 2: New UI (Tomorrow)
1. Rebuild index.html with Grunt aesthetic
2. All projects overview
3. Project drill-down views
4. Task list with filters

### Phase 3: Team Support (This Week)
1. Add Victoria as actor
2. Task delegation flow
3. Decision trace on task create/complete

---

## Team Onboarding

### Victoria's Access
```sql
INSERT INTO actors (org_id, type, name, email) VALUES
    ('sos-internal', 'human', 'Victoria', 'victoria@...');
```

### Permissions Model
- **Admin** (Jonathan): All projects, all actions
- **Team** (Victoria): Assigned tasks, limited projects
- **AI** (Henry): Execute tasks, log decisions
