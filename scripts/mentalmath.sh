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
# Android (needs the toolchain from scripts/android-env.sh; keystore in ~/.mentalmath):
#   scripts/mentalmath.sh android:sync     build the web app and copy it into android/
#   scripts/mentalmath.sh android:debug    build android/app/build/outputs/apk/debug/app-debug.apk
#   scripts/mentalmath.sh android:release  build the signed Play bundle into store/ (version from package.json)
#   scripts/mentalmath.sh bump [patch|minor|major]  raise the version in package.json and android/
#   scripts/mentalmath.sh android:icons    regenerate launcher icons and splash from assets/
#   scripts/mentalmath.sh emu:start | emu:stop | emu:install | emu:shots
#                                     boot the headless emulator, install the debug APK,
#                                     take the Android screenshots into screenshots/android/
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

android_env() { . "$REPO/scripts/android-env.sh"; }
cmd_android_sync() { android_env; cd "$REPO"; npm run build; npx cap sync android; }
cmd_android_debug() { cmd_android_sync; cd "$REPO/android" && ./gradlew -q assembleDebug && ls -la app/build/outputs/apk/debug/app-debug.apk; }
# versionName is package.json's version; versionCode = major*10000 + minor*100 + patch (must rise every upload).
sync_version() {
  local v code
  v=$(node -p "require('$REPO/package.json').version")
  code=$(node -p "const [a,b,c]='$v'.split('.').map(Number); a*10000+b*100+c")
  sed -i -E "s/versionCode [0-9]+/versionCode $code/; s/versionName \"[^\"]*\"/versionName \"$v\"/" "$REPO/android/app/build.gradle"
  echo "android version $v ($code)"
}
cmd_android_release() {
  [ -f "$HOME/.mentalmath/keystore.properties" ] || { echo "missing ~/.mentalmath/keystore.properties (upload keystore)" >&2; exit 1; }
  sync_version
  cmd_android_sync; cd "$REPO/android" && ./gradlew -q bundleRelease && mkdir -p "$REPO/store" && cp app/build/outputs/bundle/release/app-release.aab "$REPO/store/mentalmath-$(node -p "require('$REPO/package.json').version")-release.aab" && ls -la "$REPO"/store/*.aab
}
cmd_bump() {
  cd "$REPO"; npm version --no-git-tag-version "${2:-patch}" >/dev/null; sync_version; echo "now $(node -p "require('./package.json').version")"
}
cmd_android_icons() { android_env; cd "$REPO"; npx @capacitor/assets generate --android --assetPath assets --iconBackgroundColor '#8b2e2e' --iconBackgroundColorDark '#8b2e2e' --splashBackgroundColor '#f6f1e7' --splashBackgroundColorDark '#0f1720'; }
cmd_emu_start() {
  android_env
  if adb devices | grep -q emulator-5554; then echo "emulator already running"; return; fi
  mkdir -p "$HOME/.mentalmath"
  setsid nohup sg kvm -c "emulator -avd mentalmath -no-window -gpu swiftshader_indirect -no-audio -no-boot-anim -no-snapshot -port 5554" > "$HOME/.mentalmath/emulator.log" 2>&1 < /dev/null &
  adb wait-for-device
  until [ "$(adb -s emulator-5554 shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 3; done
  echo "emulator booted"
}
cmd_emu_stop() { android_env; adb -s emulator-5554 emu kill 2>/dev/null || true; }
cmd_emu_install() { android_env; adb -s emulator-5554 install -r "$REPO/android/app/build/outputs/apk/debug/app-debug.apk"; }
cmd_emu_shots() { android_env; cd "$REPO"; node --input-type=module -e "$(cat scripts/android-shots.mjs)"; }

case "${1:-}" in
  android:sync) cmd_android_sync ;;
  android:debug) cmd_android_debug ;;
  android:release) cmd_android_release ;;
  bump) cmd_bump "$@" ;;
  android:icons) cmd_android_icons ;;
  emu:start) cmd_emu_start ;;
  emu:stop) cmd_emu_stop ;;
  emu:install) cmd_emu_install ;;
  emu:shots) cmd_emu_shots ;;
  deploy) cmd_deploy ;;
  update) cmd_update ;;
  install) cmd_install ;;
  uninstall) cmd_uninstall ;;
  start|stop|restart) systemctl --user "$1" "$UNIT"; systemctl --user status "$UNIT" --no-pager | head -5 ;;
  status) systemctl --user status "$UNIT" --no-pager ;;
  logs) shift; journalctl --user -u "$UNIT" -n 100 "$@" ;;
  health) cmd_health ;;
  url) cmd_url ;;
  *) sed -n '2,24p' "$0"; exit 2 ;;
esac
