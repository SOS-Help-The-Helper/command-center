#!/bin/bash
# Cost aggregator for Clawdbot sessions
# Outputs JSON with costs by date and provider

SESSION_DIR="$HOME/.clawdbot/agents/main/sessions"

cat "$SESSION_DIR"/*.jsonl 2>/dev/null | \
python3 -c '
import sys
import json
from collections import defaultdict

costs_by_date = defaultdict(float)
costs_by_provider = defaultdict(float)
total_tokens = defaultdict(int)

for line in sys.stdin:
    try:
        data = json.loads(line)
        
        # Check for nested usage in message
        usage = None
        model = data.get("model", "")
        timestamp = data.get("timestamp", "")
        
        if data.get("type") == "message" and "message" in data:
            msg = data["message"]
            if "usage" in msg:
                usage = msg["usage"]
                model = msg.get("model", model)
        elif "usage" in data:
            usage = data["usage"]
        
        if not usage or "cost" not in usage:
            continue
            
        cost = usage["cost"].get("total", 0)
        if cost == 0:
            continue
        
        # Extract date
        date = timestamp[:10] if timestamp else "unknown"
        costs_by_date[date] += cost
        
        # Provider detection
        model_lower = model.lower()
        if "claude" in model_lower or "anthropic" in model_lower:
            provider = "anthropic"
        elif "gpt" in model_lower or "openai" in model_lower:
            provider = "openai"
        elif "gemini" in model_lower or "google" in model_lower:
            provider = "google"
        else:
            provider = "other"
        
        costs_by_provider[provider] += cost
        
        # Token counts
        total_tokens["input"] += usage.get("input", 0)
        total_tokens["output"] += usage.get("output", 0)
        total_tokens["cacheRead"] += usage.get("cacheRead", 0)
        total_tokens["cacheWrite"] += usage.get("cacheWrite", 0)
    except Exception as e:
        continue

result = {
    "byDate": {k: round(v, 2) for k, v in sorted(costs_by_date.items(), reverse=True)[:30]},
    "byProvider": {k: round(v, 2) for k, v in costs_by_provider.items()},
    "tokens": dict(total_tokens),
    "total": round(sum(costs_by_date.values()), 2),
    "today": round(costs_by_date.get("2026-02-01", 0), 2)
}
print(json.dumps(result, indent=2))
'
