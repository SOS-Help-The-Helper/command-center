#!/usr/bin/env python3
"""Command Center server with decision logging API."""

import http.server
import socketserver
import json
import os
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs

PORT = 8080
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / 'data'
MEMORY_DIR = Path.home() / 'clawd' / 'memory'

class CommandCenterHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/api/decision':
            self.handle_decision()
        elif self.path == '/api/task':
            self.handle_task()
        else:
            self.send_response(404)
            self.end_headers()
    
    def handle_decision(self):
        """Log a decision and update memory."""
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            decision = json.loads(body)
            
            # Load existing decision log
            log_file = DATA_DIR / 'decision-log.json'
            if log_file.exists():
                with open(log_file) as f:
                    log = json.load(f)
            else:
                log = []
            
            # Add new decision
            decision['logged_at'] = datetime.utcnow().isoformat() + 'Z'
            log.append(decision)
            
            # Save
            with open(log_file, 'w') as f:
                json.dump(log, f, indent=2)
            
            # Also append to daily memory file
            today = datetime.now().strftime('%Y-%m-%d')
            memory_file = MEMORY_DIR / f'{today}.md'
            
            with open(memory_file, 'a') as f:
                f.write(f"\n### Decision: {decision.get('company', 'Unknown')} - {decision.get('type', 'unknown')}\n")
                f.write(f"- **Action:** {decision.get('action', '-')}\n")
                f.write(f"- **Context:** {decision.get('question', '-')}\n")
                f.write(f"- **Time:** {decision['logged_at']}\n")
            
            # Update tasks if relevant
            self.update_tasks_from_decision(decision)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'logged': len(log)}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def update_tasks_from_decision(self, decision):
        """Create or update tasks based on decision."""
        tasks_file = DATA_DIR / 'tasks.json'
        
        if tasks_file.exists():
            with open(tasks_file) as f:
                tasks = json.load(f)
        else:
            tasks = {'tasks': []}
        
        action = decision.get('action', '').lower()
        company = decision.get('company', 'Unknown')
        
        # Map decisions to tasks
        if 'call' in action or 'outreach' in action or 're-engage' in action:
            tasks['tasks'].append({
                'id': f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'title': f"Follow up with {company}",
                'status': 'pending',
                'priority': 'high',
                'source': 'decision',
                'created': datetime.utcnow().isoformat() + 'Z',
                'context': decision.get('question', '')
            })
        elif 'close' in action or 'lost' in action:
            tasks['tasks'].append({
                'id': f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'title': f"Update HubSpot: Close {company} as lost",
                'status': 'pending',
                'priority': 'medium',
                'source': 'decision',
                'created': datetime.utcnow().isoformat() + 'Z'
            })
        
        with open(tasks_file, 'w') as f:
            json.dump(tasks, f, indent=2)
    
    def handle_task(self):
        """Add or update a task."""
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            task = json.loads(body)
            
            tasks_file = DATA_DIR / 'tasks.json'
            if tasks_file.exists():
                with open(tasks_file) as f:
                    data = json.load(f)
            else:
                data = {'tasks': []}
            
            task['id'] = task.get('id') or f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            task['created'] = task.get('created') or datetime.utcnow().isoformat() + 'Z'
            
            # Check if update or new
            existing = next((i for i, t in enumerate(data['tasks']) if t['id'] == task['id']), None)
            if existing is not None:
                data['tasks'][existing] = task
            else:
                data['tasks'].append(task)
            
            with open(tasks_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok', 'task_id': task['id']}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    
    with socketserver.TCPServer(("", PORT), CommandCenterHandler) as httpd:
        print(f"🚀 Command Center running at http://localhost:{PORT}")
        print(f"   Decision Queue: http://localhost:{PORT}/app/")
        print(f"   API: POST /api/decision, /api/task")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()


if __name__ == '__main__':
    main()
