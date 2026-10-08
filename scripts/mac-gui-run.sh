#!/bin/bash
# Runs ON the Mac: executes a shell command inside the logged-in desktop session (launchd gui/<uid>),
# where the login keychain can sign, waits for it and prints its output. Removes the job afterwards.
# usage: mac-gui-run.sh '<command>' [timeout-seconds]
cmd=$1; limit=${2:-1800}
U=$(id -u); L=dev.hbq.mentalmath.gui-run; P=/tmp/$L.plist; LOG=/tmp/$L.log; rm -f "$LOG"
cat > "$P" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>Label</key><string>$L</string>
<key>ProgramArguments</key><array><string>/bin/zsh</string><string>-lc</string><string>{ $(printf '%s' "$cmd" | sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g') ; } ; echo "EXIT \$?"</string></array>
<key>StandardOutPath</key><string>$LOG</string><key>StandardErrorPath</key><string>$LOG</string>
<key>RunAtLoad</key><true/></dict></plist>
PL
launchctl bootout "gui/$U/$L" 2>/dev/null; launchctl bootstrap "gui/$U" "$P"
for _ in $(seq 1 "$limit"); do grep -q '^EXIT ' "$LOG" 2>/dev/null && break; sleep 1; done
launchctl bootout "gui/$U/$L" 2>/dev/null; rm -f "$P"
cat "$LOG"
grep -q '^EXIT 0' "$LOG"
