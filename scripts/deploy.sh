#!/usr/bin/env bash
# Build the site and publish it through nginx on this host.
#
#   scripts/deploy.sh            build, install the nginx site, copy dist, reload
#   scripts/deploy.sh --no-build publish the existing dist/
#
# Needs sudo for /var/www and /etc/nginx. Idempotent: rerun after every change.
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
site=/var/www/mentalmath
conf=/etc/nginx/sites-available/mentalmath

cd "$repo"
if [ "${1:-}" != "--no-build" ]; then
  npm run build
fi
[ -f dist/index.html ] || { echo "dist/index.html missing; run without --no-build" >&2; exit 1; }

sudo mkdir -p "$site"
sudo rsync -a --delete dist/ "$site"/
sudo chown -R root:root "$site"
sudo find "$site" -type d -exec chmod 755 {} +
sudo find "$site" -type f -exec chmod 644 {} +

sudo install -m 644 deploy/mentalmath.nginx.conf "$conf"
sudo ln -sfn "$conf" /etc/nginx/sites-enabled/mentalmath
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx >/dev/null
sudo systemctl reload nginx

# The reload hands over sockets asynchronously; wait until the new site answers a deep route.
code=000
for _ in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1/read/1")
  [ "$code" = 200 ] && break
  sleep 0.5
done
ip=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "deployed $(git rev-parse --short HEAD) -> http://${ip:-localhost}/  (GET /read/1 -> HTTP $code)"
