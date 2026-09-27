#!/usr/bin/env bash
# Manage the Mental Math deployment on this host.
#
#   scripts/mentalmath.sh deploy     build from the current checkout and publish it (restarts the service)
#   scripts/mentalmath.sh update     git pull, npm install if the lockfile changed, then deploy
#   scripts/mentalmath.sh start | stop | restart | status | logs [-f]
#   scripts/mentalmath.sh install    write and enable the systemd user service (start at boot)
#   scripts/mentalmath.sh uninstall  stop, disable and remove the service (files stay)
#   scripts/mentalmath.sh health     request a page and report the status code
#   scripts/mentalmath.sh url        print the address
#
# Layout: the site is served from $SITE_DIR (a copy of dist/), by scripts/serve.mjs, on $PORT,
# as the systemd --user unit $UNIT. Override PORT, SITE_DIR or HOST in the environment.
set -euo pipefail

REPO=$(cd "$(dirname "$0")/.." && pwd)
PORT=${PORT:-8547}
HOST=${HOST:-0.0.0.0}
SITE_DIR=${SITE_DIR:-$HOME/srv/mentalmath}
UNIT=mentalmath
UNIT_FILE=$HOME/.config/systemd/user/$UNIT.service
NODE=$(command -v node)

lan_ip() { hostname -I 2>/dev/null | awk '{print $1}'; }

cmd_url() { echo "http://$(lan_ip):$PORT/"; }

cmd_install() {
  mkdir -p "$(dirname "$UNIT_FILE")" "$SITE_DIR"
  cat > "$UNIT_FILE" <<UNIT
[Unit]
Description=Mental Math Trainer (static site on port $PORT)
After=network.target

[Service]
ExecStart=$NODE $REPO/scripts/serve.mjs $SITE_DIR $PORT $HOST
Restart=on-failure
RestartSec=2
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
UNIT
  systemctl --user daemon-reload
  systemctl --user enable "$UNIT" >/dev/null
  # user services start at boot only when the user session lingers
  if ! loginctl show-user "$USER" 2>/dev/null | grep -q 'Linger=yes'; then
    sudo loginctl enable-linger "$USER"
  fi
  echo "service installed and enabled at boot: $UNIT_FILE"
}

cmd_uninstall() {
  systemctl --user disable --now "$UNIT" 2>/dev/null || true
  rm -f "$UNIT_FILE"
  systemctl --user daemon-reload
  echo "service removed"
}

cmd_deploy() {
  cd "$REPO"
  npm run build
  mkdir -p "$SITE_DIR"
  rsync -a --delete dist/ "$SITE_DIR"/
  [ -f "$UNIT_FILE" ] || cmd_install
  systemctl --user restart "$UNIT"
  cmd_health
  echo "deployed $(git rev-parse --short HEAD) -> $(cmd_url)"
}

cmd_update() {
  cd "$REPO"
  local before after
  before=$(git rev-parse HEAD)
  git pull --ff-only
  after=$(git rev-parse HEAD)
  if ! git diff --quiet "$before" "$after" -- package-lock.json; then
    npx -y npm@10 install
  fi
  cmd_deploy
}

cmd_health() {
  local code=000
  for _ in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/read/1" || true)
    [ "$code" = 200 ] && break
    sleep 0.5
  done
  echo "health: GET /read/1 -> HTTP $code"
  [ "$code" = 200 ]
}

case "${1:-}" in
  deploy) cmd_deploy ;;
  update) cmd_update ;;
  install) cmd_install ;;
  uninstall) cmd_uninstall ;;
  start|stop|restart) systemctl --user "$1" "$UNIT"; systemctl --user status "$UNIT" --no-pager | head -5 ;;
  status) systemctl --user status "$UNIT" --no-pager ;;
  logs) shift; journalctl --user -u "$UNIT" -n 100 "$@" ;;
  health) cmd_health ;;
  url) cmd_url ;;
  *) sed -n '2,15p' "$0"; exit 2 ;;
esac
