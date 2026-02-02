#!/bin/bash
# Activity log generator for command center

cd ~/clawd

# Generate proper JSON array
python3 << 'PYEOF'
import subprocess
import json
from datetime import datetime

# Get git commits
result = subprocess.run(
    ['git', 'log', '--oneline', '--since=7 days ago', '--pretty=format:%H|%ci|%s'],
    capture_output=True, text=True
)

activities = []
for line in result.stdout.strip().split('\n')[:30]:
    if '|' in line:
        parts = line.split('|', 2)
        if len(parts) >= 3:
            hash_id, date, message = parts
            
            # Categorize by keywords
            category = 'other'
            if any(k in message.lower() for k in ['reforge', 'grunt', 'lead', 'prospect']):
                category = 'reforge'
            elif any(k in message.lower() for k in ['sos', 'disaster', 'slack']):
                category = 'sos'
            elif any(k in message.lower() for k in ['cost', 'command', 'heartbeat']):
                category = 'henry'
            elif any(k in message.lower() for k in ['memory', 'decision', 'context']):
                category = 'system'
            
            activities.append({
                'id': hash_id[:7],
                'date': date.strip(),
                'message': message.strip(),
                'category': category
            })

print(json.dumps(activities, indent=2))
PYEOF
