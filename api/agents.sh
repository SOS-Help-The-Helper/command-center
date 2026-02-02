#!/bin/bash
RUNS_FILE="$HOME/.clawdbot/subagents/runs.json"
SESSIONS_DIR="$HOME/.clawdbot/agents/main/sessions"

active=0
total=0

if [ -f "$RUNS_FILE" ]; then
    total=$(cat "$RUNS_FILE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo 0)
    active=$(cat "$RUNS_FILE" | jq 'if type == "array" then [.[] | select(.status == "running" or .status == "accepted")] | length else 0 end' 2>/dev/null || echo 0)
fi

recent=$(find "$SESSIONS_DIR" -name "*.jsonl" -mmin -30 2>/dev/null | wc -l | tr -d ' ')

echo "{\"activeAgents\":${active:-0},\"totalRuns\":${total:-0},\"recentSessions\":${recent:-0},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
