#!/usr/bin/env python3
"""Parse HubSpot exports and extract decision-relevant signals."""

import csv
import json
from datetime import datetime, timedelta
from pathlib import Path
import re

HUBSPOT_DIR = Path("/home/clawdbot/clawd/projects/REFORGE/context/hubspot")
OUTPUT_DIR = Path("/home/clawdbot/clawd/projects/command-center/data")

def parse_date(date_str):
    """Parse various HubSpot date formats."""
    if not date_str or date_str.strip() == '':
        return None
    
    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None

def days_ago(date_str):
    """Return days since date, or None if invalid."""
    dt = parse_date(date_str)
    if dt:
        return (datetime.now() - dt).days
    return None

def days_until(date_str):
    """Return days until date, or None if invalid."""
    dt = parse_date(date_str)
    if dt:
        return (dt - datetime.now()).days
    return None

def parse_contacts():
    """Parse contacts CSV and extract signals."""
    contacts_file = HUBSPOT_DIR / "all-contacts.csv"
    
    contacts = []
    decisions = []
    
    with open(contacts_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            email = row.get('Email', '').strip()
            if not email:
                continue
            
            first_name = row.get('First Name', '').strip()
            last_name = row.get('Last Name', '').strip()
            company = row.get('Associated Company', '') or row.get('Company Name', '')
            job_title = row.get('Job Title', '')
            
            contact = {
                'id': row.get('Record ID', ''),
                'email': email,
                'name': f"{first_name} {last_name}".strip(),
                'first_name': first_name,
                'last_name': last_name,
                'company': company,
                'job_title': job_title,
                'lifecycle_stage': row.get('Lifecycle Stage', ''),
                'lead_status': row.get('Lead Status', ''),
                'contact_owner': row.get('Contact owner', ''),
                'contact_priority': row.get('Contact priority', ''),
                'account_priority': row.get('Account Priority', ''),
                'last_activity_date': row.get('Last Activity Date', ''),
                'last_contacted': row.get('Last Contacted', ''),
                'last_engagement_date': row.get('Last Engagement Date', ''),
                'times_contacted': row.get('Number of times contacted', ''),
                'contact_unworked': row.get('Contact unworked', ''),
                'emails_opened': row.get('Marketing emails opened', ''),
                'emails_clicked': row.get('Marketing emails clicked', ''),
                'emails_replied': row.get('Marketing emails replied', ''),
                'last_email_open': row.get('Last marketing email open date', ''),
                'last_email_click': row.get('Last marketing email click date', ''),
                'last_email_reply': row.get('Last marketing email reply date', ''),
                'sales_email_opened': row.get('Recent Sales Email Opened Date', ''),
                'sales_email_clicked': row.get('Recent Sales Email Clicked Date', ''),
                'sales_email_replied': row.get('Recent Sales Email Replied Date', ''),
                'koala_intent_signal': row.get('Koala Most Recent IA Intent Signal', ''),
                'koala_intent_timestamp': row.get('Koala Most Recent Intent Timestamp', ''),
                'exactbuyer_intent_score': row.get('ExactBuyer Intent Score', ''),
                'exactbuyer_engagement_score': row.get('ExactBuyer Engagement Score', ''),
                'intent_signals_active': row.get('Intent Signals active', ''),
                'pricing_page_visit': row.get('Visited Pricing Page Date', ''),
                'in_trial': row.get('In Trial', ''),
                'trial_end_date': row.get('Latest Individual Trial End Date', ''),
                'trial_outcome': row.get('Most Recent Trial Outcome', ''),
                'renewal_date': row.get('Renewal Date', ''),
                'subscription_expires': row.get('Subscription Expires At', ''),
                'subscription_status': row.get('Subscription Production Status', ''),
                'last_meeting_booked': row.get('Date of last meeting booked in meetings tool', ''),
                'meeting_source': row.get('Source of last booking in meetings tool', ''),
                'zoom_registrations': row.get('Total number of Zoom webinar registrations', ''),
                'zoom_attended': row.get('Total number of Zoom webinars attended', ''),
                'in_sequence': row.get('Currently in Sequence', ''),
                'last_sequence': row.get('Last sequence enrolled', ''),
                'sequence_ended': row.get('Last sequence ended date', ''),
                'activity_l7': row.get('Activity Count (last 7 days)', ''),
                'activity_l28': row.get('Activity Count (Last 28 days)', ''),
                'content_activity_l7': row.get('Content Activity Count (Last 7 days)', ''),
                'content_activity_l28': row.get('Content Activity Count (Last 28 days)', ''),
                'num_deals': row.get('Number of Associated Deals', ''),
                'num_open_deals': row.get('Number Open Deals (Contact)', ''),
                'deal_ids': row.get('Associated Deal IDs', ''),
                'linkedin': row.get('LinkedIn URL', '') or row.get('LinkedIn', ''),
                'phone': row.get('Phone Number', '') or row.get('Mobile Phone Number', ''),
                'hubspot_score': row.get('HubSpot Score', ''),
                'products_of_interest': row.get('Products of Interest', ''),
                'saas_products': row.get('SaaS Products', ''),
            }
            
            contacts.append(contact)
            
            contact_label = f"{contact['name']} ({contact['company']})" if contact['company'] else contact['name'] or email
            
            # Decision: Pricing page visit, no follow-up
            pricing_days = days_ago(contact['pricing_page_visit'])
            last_contact_days = days_ago(contact['last_contacted'])
            if pricing_days is not None and pricing_days <= 7:
                if last_contact_days is None or last_contact_days > pricing_days:
                    decisions.append({
                        'type': 'pricing_visit_no_followup',
                        'priority': 'high' if pricing_days <= 2 else 'medium',
                        'contact_id': contact['id'],
                        'contact': contact_label,
                        'email': email,
                        'company': company,
                        'signal': f"Visited pricing page {pricing_days} day(s) ago",
                        'question': f"Follow up with {contact_label}?",
                        'options': ['Call now', 'Send email', 'Wait and monitor', 'Not a fit'],
                        'context': {'pricing_visit': contact['pricing_page_visit'], 'last_contacted': contact['last_contacted'], 'job_title': job_title}
                    })
            
            # Decision: Trial expiring soon
            trial_days = days_until(contact['trial_end_date'])
            if trial_days is not None and 0 <= trial_days <= 7:
                activity = contact.get('content_activity_l7', '0') or '0'
                try:
                    activity_num = int(float(activity))
                except:
                    activity_num = 0
                decisions.append({
                    'type': 'trial_expiring',
                    'priority': 'high' if trial_days <= 3 else 'medium',
                    'contact_id': contact['id'],
                    'contact': contact_label,
                    'email': email,
                    'company': company,
                    'signal': f"Trial ends in {trial_days} day(s), {activity_num} content views last 7 days",
                    'question': f"Trial ending for {contact_label} - next step?",
                    'options': ['Push for conversion', 'Extend trial', 'Let expire', 'Different contact'],
                    'context': {'trial_end': contact['trial_end_date'], 'activity_l7': activity}
                })
            
            # Decision: Email engagement spike, no reply
            email_open_days = days_ago(contact['last_email_open'])
            email_reply_days = days_ago(contact['last_email_reply'])
            emails_opened = contact.get('emails_opened', '0') or '0'
            try:
                opens = int(float(emails_opened))
            except:
                opens = 0
            
            if email_open_days is not None and email_open_days <= 3 and opens >= 3:
                if email_reply_days is None or email_reply_days > 14:
                    decisions.append({
                        'type': 'email_engagement_no_reply',
                        'priority': 'medium',
                        'contact_id': contact['id'],
                        'contact': contact_label,
                        'email': email,
                        'company': company,
                        'signal': f"Opened {opens} emails, last open {email_open_days} day(s) ago, no reply",
                        'question': f"{contact_label} engaging with emails but not replying - try different approach?",
                        'options': ['Call', 'Different message angle', 'Try different contact', 'Keep nurturing'],
                        'context': {'emails_opened': opens, 'last_open': contact['last_email_open'], 'last_reply': contact['last_email_reply']}
                    })
            
            # Decision: Contact unworked
            if contact.get('contact_unworked', '').lower() == 'true':
                priority = contact.get('contact_priority', '') or contact.get('account_priority', '')
                if priority and 'high' in priority.lower():
                    decisions.append({
                        'type': 'unworked_high_priority',
                        'priority': 'high',
                        'contact_id': contact['id'],
                        'contact': contact_label,
                        'email': email,
                        'company': company,
                        'signal': f"High priority contact marked as unworked",
                        'question': f"{contact_label} is high priority but unworked - assign?",
                        'options': ['Work now', 'Schedule for later', 'Reassign', 'Deprioritize'],
                        'context': {'priority': priority, 'lifecycle_stage': contact['lifecycle_stage']}
                    })
            
            # Decision: Sequence ended, no engagement
            seq_end_days = days_ago(contact['sequence_ended'])
            if seq_end_days is not None and 3 <= seq_end_days <= 14:
                if email_reply_days is None or email_reply_days > seq_end_days:
                    decisions.append({
                        'type': 'sequence_ended_no_response',
                        'priority': 'low',
                        'contact_id': contact['id'],
                        'contact': contact_label,
                        'email': email,
                        'company': company,
                        'signal': f"Sequence '{contact['last_sequence']}' ended {seq_end_days} days ago, no response",
                        'question': f"{contact_label} finished sequence without responding - next?",
                        'options': ['Manual outreach', 'Different sequence', 'Nurture list', 'Close out'],
                        'context': {'sequence': contact['last_sequence'], 'sequence_ended': contact['sequence_ended']}
                    })
            
            # Decision: Stalled (no activity in 14+ days on active deal)
            activity_days = days_ago(contact['last_activity_date'])
            num_open_deals = contact.get('num_open_deals', '0') or '0'
            try:
                open_deals = int(float(num_open_deals))
            except:
                open_deals = 0
            
            if open_deals > 0 and activity_days is not None and activity_days >= 14:
                decisions.append({
                    'type': 'stalled_deal',
                    'priority': 'high' if activity_days >= 21 else 'medium',
                    'contact_id': contact['id'],
                    'contact': contact_label,
                    'email': email,
                    'company': company,
                    'signal': f"Has {open_deals} open deal(s), no activity in {activity_days} days",
                    'question': f"{contact_label} has gone quiet on active deal - re-engage?",
                    'options': ['Re-engage now', 'Try different contact', 'Deprioritize', 'Close lost'],
                    'context': {'last_activity': contact['last_activity_date'], 'open_deals': open_deals, 'deal_ids': contact['deal_ids']}
                })
            
            # Decision: Renewal coming up
            renewal_days = days_until(contact['renewal_date'])
            if renewal_days is not None and 0 <= renewal_days <= 30:
                decisions.append({
                    'type': 'renewal_approaching',
                    'priority': 'high' if renewal_days <= 14 else 'medium',
                    'contact_id': contact['id'],
                    'contact': contact_label,
                    'email': email,
                    'company': company,
                    'signal': f"Renewal in {renewal_days} days",
                    'question': f"{contact_label} renewal coming up - proactive check-in?",
                    'options': ['Schedule renewal call', 'Send check-in email', 'Review usage first', 'Wait for them'],
                    'context': {'renewal_date': contact['renewal_date'], 'last_contacted': contact['last_contacted'], 'activity_l28': contact['activity_l28']}
                })
            
            # Decision: Intent signal detected
            if contact.get('koala_intent_signal') or contact.get('intent_signals_active'):
                intent_days = days_ago(contact['koala_intent_timestamp'])
                if intent_days is not None and intent_days <= 7:
                    decisions.append({
                        'type': 'intent_signal',
                        'priority': 'high',
                        'contact_id': contact['id'],
                        'contact': contact_label,
                        'email': email,
                        'company': company,
                        'signal': f"Intent signal: {contact['koala_intent_signal']} ({intent_days} days ago)",
                        'question': f"{contact_label} showing intent - capitalize?",
                        'options': ['Immediate outreach', 'Research first', 'Add to sequence', 'Monitor'],
                        'context': {'intent_signal': contact['koala_intent_signal'], 'intent_timestamp': contact['koala_intent_timestamp']}
                    })
            
            # Decision: Meeting booked but potential no-show pattern
            zoom_reg = contact.get('zoom_registrations', '0') or '0'
            zoom_att = contact.get('zoom_attended', '0') or '0'
            try:
                registrations = int(float(zoom_reg))
                attended = int(float(zoom_att))
            except:
                registrations = 0
                attended = 0
            
            if registrations > attended and registrations >= 2:
                no_show_rate = (registrations - attended) / registrations
                if no_show_rate >= 0.5:
                    decisions.append({
                        'type': 'no_show_pattern',
                        'priority': 'medium',
                        'contact_id': contact['id'],
                        'contact': contact_label,
                        'email': email,
                        'company': company,
                        'signal': f"Registered {registrations}x, attended {attended}x ({int(no_show_rate*100)}% no-show rate)",
                        'question': f"{contact_label} has pattern of not showing up - different approach?",
                        'options': ['Call instead of meeting', 'Send reminder sequence', 'Try different time', 'Deprioritize'],
                        'context': {'registrations': registrations, 'attended': attended, 'last_meeting': contact['last_meeting_booked']}
                    })
    
    return contacts, decisions

def parse_deals():
    """Parse deals CSV."""
    deals_file = HUBSPOT_DIR / "deals_export_2026-02-02.csv"
    
    deals = []
    
    with open(deals_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            deal = {
                'id': row.get('Record ID', ''),
                'name': row.get('Deal Name', ''),
                'amount': row.get('Amount', ''),
                'stage': row.get('Deal Stage', ''),
                'close_date': row.get('Close Date', ''),
                'company': row.get('Associated Company', ''),
                'owner': row.get('Deal owner', ''),
                'create_date': row.get('Create Date', ''),
                'saas_products': row.get('SaaS Products', ''),
                'pricing_plan': row.get('Pricing Plan', ''),
                'is_closed_won': row.get('Is Closed Won', ''),
                'trial_enabled': row.get('R4T Trial Enabled', ''),
                'renewal_date': row.get('Renewal Date', ''),
                'expected_renewal': row.get('Expected Renewal Amount', ''),
                'company_ids': row.get('Associated Company IDs', ''),
            }
            deals.append(deal)
    
    return deals

def main():
    print("Parsing HubSpot exports...")
    
    contacts, decisions = parse_contacts()
    deals = parse_deals()
    
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    decisions.sort(key=lambda x: (priority_order.get(x['priority'], 3), x['type']))
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(OUTPUT_DIR / 'hubspot-contacts.json', 'w') as f:
        json.dump(contacts, f, indent=2, default=str)
    
    with open(OUTPUT_DIR / 'hubspot-deals.json', 'w') as f:
        json.dump(deals, f, indent=2, default=str)
    
    with open(OUTPUT_DIR / 'decisions-queue.json', 'w') as f:
        json.dump(decisions, f, indent=2, default=str)
    
    print(f"\nParsed {len(contacts)} contacts")
    print(f"Parsed {len(deals)} deals")
    print(f"\nGenerated {len(decisions)} decisions:")
    
    by_type = {}
    by_priority = {'high': 0, 'medium': 0, 'low': 0}
    for d in decisions:
        by_type[d['type']] = by_type.get(d['type'], 0) + 1
        by_priority[d['priority']] = by_priority.get(d['priority'], 0) + 1
    
    print(f"\nBy priority:")
    for p, count in by_priority.items():
        print(f"  {p}: {count}")
    
    print(f"\nBy type:")
    for t, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"  {t}: {count}")
    
    print(f"\nTop 10 decisions:")
    for d in decisions[:10]:
        print(f"  [{d['priority'].upper()}] {d['type']}: {d['question']}")

if __name__ == '__main__':
    main()
