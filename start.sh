#!/bin/bash
# Open three terminal tabs and start all dev services

# Start Astro dev server
osascript -e 'tell application "Terminal" to do script "cd ~/Documents/photo-portfolio-template && npm run dev"'

# Start Sanity Studio
osascript -e 'tell application "Terminal" to do script "cd ~/Documents/photo-portfolio-template/studio && npm run dev"'

# Start Claude Code
osascript -e 'tell application "Terminal" to do script "cd ~/Documents/photo-portfolio-template && claude"'

echo "All services starting — check Terminal windows"
