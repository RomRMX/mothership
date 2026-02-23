
import re
import json
import os

html_file = '/Users/rmxhq/Documents/Antigravity Projects/mothership/apps/rmxtube/watch-history.html'
output_file = '/Users/rmxhq/Documents/Antigravity Projects/mothership/apps/rmxtube/public/assets/watch-history.json'

# Regex to match theWatched entries
# Watched&nbsp;<a href="https://www.youtube.com/watch?v=VIDEO_ID">TITLE</a><br><a href="https://www.youtube.com/channel/CHANNEL_ID">CHANNEL</a><br>TIMESTAMP<br>
pattern = re.compile(r'Watched\s+<a href="https?://(?:www|music)\.youtube\.com/watch\?v=([^"]+)">([^<]+)</a><br>(?:<a href="[^"]+">([^<]+)</a><br>)?(.*?)(?=<br>|</div>)', re.DOTALL)

history = []

if os.path.exists(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
        matches = pattern.finditer(content)
        for match in matches:
            video_id = match.group(1)
            title = match.group(2).strip()
            channel = match.group(3).strip() if match.group(3) else "Unknown"
            timestamp = match.group(4).strip()
            
            history.append({
                "id": video_id,
                "title": title,
                "channel": channel,
                "timestamp": timestamp
            })

# Sort by timestamp (approximate since it's a string, but the HTML is usually chronologically ordered)
# The HTML is usually newest first.

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(history, f, indent=2)

print(f"Successfully parsed {len(history)} items to {output_file}")
