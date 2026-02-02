# Command Center - Project Context

## What It Is
Pipeline decision queue for Reforge sales. Surfaces decisions that need Jonathan's input, learns from choices to improve recommendations.

## Current State (2026-02-02)
- **UI**: Live at `localhost:8080/app/`
- **Server**: `server.py` - serves UI + API for decision logging
- **321 decisions** queued, sorted by urgency

## Data Sources
| Source | Records | Notes |
|--------|---------|-------|
| HubSpot Contacts | 5,514 | 693 fields each |
| HubSpot Deals | 307 | Jonathan's pipeline |
| Deal Packets | 104 | Google Takeout .docx files |
| Calendar | 886 events | From Takeout ICS |

## Sort Logic (per Jonathan)
1. **High value ($10K+) + NO meeting** = needs decision NOW
2. High value + has meeting = has momentum
3. Lower value + no meeting
4. Lower value + has meeting

## Decision Types
- `stalled_deal` - No activity in 14+ days on active deal
- `pricing_visit_no_followup` - Hit pricing page, no outreach
- `trial_expiring` - Trial ending soon
- `no_show_pattern` - Books meetings but doesn't show
- `sequence_ended_no_response` - Finished sequence, no reply
- `renewal_approaching` - Renewal coming up

## Files
```
/app/index.html          - Main UI
/server.py               - HTTP server + API
/data/
  decisions-queue.json   - All decisions (sorted)
  decision-log.json      - User decisions (for learning)
  hubspot-contacts.json  - Contact data
  hubspot-deals.json     - Deal data  
  deal-packets.json      - Extracted from Takeout docs
  calendar-events.json   - From Takeout ICS
  tasks.json             - Task tracking
/scripts/
  parse-hubspot-exports.py - Generates decisions from HubSpot
```

## Learning System
Every decision logged with:
- Contact/company/deal context
- Signal that triggered it
- Action chosen
- Timestamp

AI recommendations show: "For similar decisions, you chose X 70% of the time"

## Next Steps
- [ ] Integrate scraped emails (folder currently empty)
- [ ] Add Gong call context to decisions
- [ ] Auto-refresh when HubSpot data changes
- [ ] Mobile-friendly UI
- [ ] Push notifications for urgent decisions

## Key Metrics
- **$245K** pipeline at risk (stalled deals)
- **$50K** EvenUp deal = top priority (105 days stalled)
- **13** decisions have upcoming meetings
- **49** decisions have deal packet context
