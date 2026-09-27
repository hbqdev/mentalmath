#!/usr/bin/env bash
# Sync the MentalMath repo and the current Claude Code session to another
# machine, then print the command that resumes the session there.
#
# Run this on the machine you have just been working on, right after you
# exit Claude Code:
#
#   scripts/sync-session.sh              # push to nightfuryx
#   scripts/sync-session.sh nightfury    # push back the other way
#
# Environment overrides:
#   SESSION_ID   transcript to sync (default: newest one for this project)
#   REPO         repo path, same on both machines (default: ~/dev/MentalMath)
set -euo pipefail

HOST="${1:-nightfuryx}"
REPO="${REPO:-$HOME/dev/MentalMath}"
CLAUDE_DIR="$HOME/.claude"
PROJECT_KEY="$(printf '%s' "$REPO" | tr '/' '-')"   # /home/x/dev/MentalMath -> -home-x-dev-MentalMath
PROJECT_DIR="$CLAUDE_DIR/projects/$PROJECT_KEY"

if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "No Claude project directory at $PROJECT_DIR" >&2
  exit 1
fi

# Newest transcript for this project unless one was given.
if [[ -z "${SESSION_ID:-}" ]]; then
  newest="$(ls -t "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -1 || true)"
  if [[ -z "$newest" ]]; then
    echo "No session transcript found in $PROJECT_DIR" >&2
    exit 1
  fi
  SESSION_ID="$(basename "$newest" .jsonl)"
fi
TRANSCRIPT="$PROJECT_DIR/$SESSION_ID.jsonl"

echo "==> Target: $HOST"
echo "==> Session: $SESSION_ID"

# Guard: never overwrite a session that ran more recently on the other side.
local_mtime="$(stat -c %Y "$TRANSCRIPT")"
remote_mtime="$(ssh "$HOST" "stat -c %Y '$TRANSCRIPT' 2>/dev/null || echo 0")"
if (( remote_mtime > local_mtime )); then
  echo "The session transcript on $HOST is newer than this one." >&2
  echo "Run this script on $HOST instead, pointing it at $(hostname)." >&2
  exit 1
fi

# 1. Repo: mirror the working tree minus build outputs. --delete keeps the
#    remote identical, so files removed here disappear there too.
echo "==> Syncing repo"
rsync -az --delete --info=stats1 \
  --exclude node_modules --exclude dist --exclude .playwright-mcp \
  "$REPO/" "$HOST:$REPO/" | grep -E 'Number of (regular )?files transferred|Total transferred' || true

# 2. Claude session: transcript, tool results, memory, undo history.
echo "==> Syncing Claude session"
ssh "$HOST" "mkdir -p '$CLAUDE_DIR/projects' '$CLAUDE_DIR/session-env' '$CLAUDE_DIR/file-history'"
rsync -az "$PROJECT_DIR/" "$HOST:$PROJECT_DIR/"
for sub in session-env file-history; do
  if [[ -d "$CLAUDE_DIR/$sub/$SESSION_ID" ]]; then
    rsync -az "$CLAUDE_DIR/$sub/$SESSION_ID" "$HOST:$CLAUDE_DIR/$sub/"
  fi
done

# 3. Dependencies: reinstall on the remote only when the lockfile changed.
echo "==> Checking dependencies on $HOST"
ssh "$HOST" "cd '$REPO' && if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then npm ci --no-audit --no-fund >/dev/null && echo 'npm ci done'; else echo 'node_modules up to date'; fi"

cat <<EOF

Done. Resume on $HOST with:

  ssh -t $HOST "bash -lc 'cd $REPO && claude --resume $SESSION_ID'"

(bash -lc so ~/.local/bin, where claude lives on $HOST, is on PATH.)

EOF
