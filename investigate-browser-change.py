#!/usr/bin/env python3
"""Investigate what changed in browser behavior in the last few hours."""

import re
from datetime import datetime

def analyze_log_timeline():
    """Analyze when the HTTPS issue started."""
    print("🕐 Timeline Analysis: When did HTTPS upgrades start?")
    print("=" * 60)
    
    try:
        with open("logs/frontend_error_20250802_184531.log", "r", encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        # Extract all timestamps and categorize requests
        normal_requests = []
        ssl_attempts = []
        
        for line in lines:
            if '[' in line and ']' in line:
                timestamp_match = re.search(r'\[(.*?)\]', line)
                if timestamp_match:
                    timestamp = timestamp_match.group(1)
                    
                    if '\\x16\\x03\\x01' in line:
                        ssl_attempts.append(timestamp)
                    elif 'GET /' in line or 'POST /' in line:
                        normal_requests.append(timestamp)
        
        print(f"Total normal HTTP requests: {len(normal_requests)}")
        print(f"Total SSL handshake attempts: {len(ssl_attempts)}")
        
        if normal_requests:
            print(f"\nFirst normal request: {normal_requests[0]}")
            print(f"Last normal request: {normal_requests[-1]}")
        
        if ssl_attempts:
            print(f"\nFirst SSL attempt: {ssl_attempts[0]}")
            print(f"Last SSL attempt: {ssl_attempts[-1]}")
            
            # Group SSL attempts by time
            ssl_minutes = {}
            for timestamp in ssl_attempts:
                minute = timestamp[:16]  # Get hour:minute
                ssl_minutes[minute] = ssl_minutes.get(minute, 0) + 1
            
            print(f"\nSSL attempts by minute:")
            for minute, count in sorted(ssl_minutes.items()):
                print(f"  {minute}: {count} attempts")
        
        # Look for the transition point
        print(f"\n🔍 Looking for transition point...")
        recent_lines = lines[-50:]  # Last 50 lines
        
        transition_found = False
        for i, line in enumerate(recent_lines):
            if '\\x16\\x03\\x01' in line and i < len(recent_lines) - 1:
                next_line = recent_lines[i + 1]
                if 'GET /' in next_line and '\\x16\\x03\\x01' not in next_line:
                    timestamp_ssl = re.search(r'\[(.*?)\]', line)
                    timestamp_normal = re.search(r'\[(.*?)\]', next_line)
                    if timestamp_ssl and timestamp_normal:
                        print(f"  🎯 TRANSITION FOUND!")
                        print(f"     Last SSL attempt: {timestamp_ssl.group(1)}")
                        print(f"     First normal request after: {timestamp_normal.group(1)}")
                        transition_found = True
                        break
        
        if not transition_found:
            print("  ❓ No clear transition point found in recent logs")
            
    except Exception as e:
        print(f"Error analyzing logs: {e}")

def check_browser_update_triggers():
    """Check what might have triggered browser behavior change."""
    print("\n🔍 Possible Triggers for Browser Behavior Change")
    print("=" * 60)
    
    triggers = [
        {
            "trigger": "Browser Auto-Update",
            "description": "Chrome/Safari auto-updated and enabled new HTTPS policies",
            "check": "Check browser version in Help > About",
            "likelihood": "HIGH"
        },
        {
            "trigger": "macOS Security Update",
            "description": "macOS updated system security policies",
            "check": "System Settings > General > Software Update",
            "likelihood": "MEDIUM"
        },
        {
            "trigger": "Extension Auto-Update",
            "description": "Security extension (HTTPS Everywhere, etc.) auto-updated",
            "check": "Chrome > Extensions > Details > Update history",
            "likelihood": "HIGH"
        },
        {
            "trigger": "HSTS Cache Population",
            "description": "Browser visited an HTTPS site that set HSTS for localhost",
            "check": "chrome://net-internals/#hsts query localhost",
            "likelihood": "VERY HIGH"
        },
        {
            "trigger": "DNS/Network Change",
            "description": "Network configuration changed (VPN, DNS, proxy)",
            "check": "Network settings, VPN status",
            "likelihood": "MEDIUM"
        },
        {
            "trigger": "Browser Flag Change",
            "description": "Browser flags auto-enabled or reset",
            "check": "chrome://flags/ for HTTPS-related flags",
            "likelihood": "MEDIUM"
        }
    ]
    
    for trigger in triggers:
        print(f"[{trigger['likelihood']}] {trigger['trigger']}")
        print(f"  Description: {trigger['description']}")
        print(f"  Check: {trigger['check']}")
        print()

def generate_immediate_diagnostic():
    """Generate immediate diagnostic steps."""
    print("⚡ IMMEDIATE DIAGNOSTIC STEPS")
    print("=" * 40)
    
    steps = [
        "1. Check browser version: Help > About Chrome",
        "2. Check HSTS cache: chrome://net-internals/#hsts",
        "3. Check extensions: chrome://extensions/",
        "4. Check browser flags: chrome://flags/",
        "5. Test in incognito mode (bypasses most changes)",
        "6. Check system updates: System Settings > Software Update"
    ]
    
    for step in steps:
        print(step)
    
    print(f"\n🎯 MOST LIKELY CAUSE:")
    print("Browser auto-updated or extension updated in the last few hours")
    print("and enabled aggressive HTTPS upgrade policies.")
    
    print(f"\n💡 QUICKEST FIX:")
    print("1. Open incognito mode")
    print("2. Test if http://localhost:3000 works in incognito")
    print("3. If it works in incognito, the issue is browser cache/settings")

if __name__ == "__main__":
    print("🚨 URGENT: Browser Behavior Changed Investigation")
    print("Something changed on this computer in the last few hours!")
    print("=" * 70)
    
    analyze_log_timeline()
    check_browser_update_triggers()
    generate_immediate_diagnostic()
    
    print("\n" + "=" * 70)
    print("🔍 The fact that it worked earlier today is KEY evidence")
    print("   that something specific changed on this system!")