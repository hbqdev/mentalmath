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
#
# iOS (built on a Mac over SSH: MAC_HOST, default tintran@192.168.50.31; project copied to ~/dev/MentalMath there):
#   scripts/mentalmath.sh ios:sync    build the web app, sync ios/, copy the project to the Mac
#   scripts/mentalmath.sh ios:sim     ios:sync, then build, install and launch in the simulator ($IOS_SIM)
#   scripts/mentalmath.sh ios:shot [name]  screenshot the simulator into screenshots/ios/
#   scripts/mentalmath.sh ios:device [iPhone|iPad]  signed build, install and launch on a connected device
#   scripts/mentalmath.sh ios:e2e [iPad|iPhone]     install, then run e2e-ios/ on the device through Appium
#   scripts/mentalmath.sh ios:appium start|stop     the Appium server those tests use (Mac, 127.0.0.1:4723)
#   scripts/mentalmath.sh ios:store-shots           App Store screenshots from the simulators into store/ios/
#   scripts/mentalmath.sh ios:icons   regenerate the iOS icon and splash from assets/
#
# Container (Dockerfile + docker-compose.yml; the systemd service above is unaffected):
#   scripts/mentalmath.sh docker:build   build the image, tagged mentalmath:<version> and mentalmath:latest
#   scripts/mentalmath.sh docker:run     docker compose up -d on $PORT (default 8547)
#   scripts/mentalmath.sh docker:stop    docker compose down
#   scripts/mentalmath.sh android:icons    regenerate launcher icons and splash from assets/
#   scripts/mentalmath.sh play:check | play:upload [track] | play:listing
#                                     Google Play via the service account in ~/.mentalmath
#   scripts/mentalmath.sh release [track]  bump patch, build the signed bundle, upload (default: internal)
#   scripts/mentalmath.sh emu:start | emu:stop | emu:install | emu:shots
#   PHONE_SERIAL=ip:port scripts/mentalmath.sh phone:install | phone:shots   (a paired phone)
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
  if [ -f "$REPO/ios/App/App.xcodeproj/project.pbxproj" ]; then
    sed -i -E "s/MARKETING_VERSION = [^;]+;/MARKETING_VERSION = $v;/; s/CURRENT_PROJECT_VERSION = [^;]+;/CURRENT_PROJECT_VERSION = $code;/" "$REPO/ios/App/App.xcodeproj/project.pbxproj"
    echo "ios version $v ($code)"
  fi
}

# iOS builds run on a Mac over SSH (Xcode only; packages resolve through Swift Package Manager).
MAC_HOST=${MAC_HOST:-tintran@192.168.50.31}
MAC_DIR=${MAC_DIR:-dev/MentalMath}
IOS_SIM=${IOS_SIM:-iPhone 18 Pro}
mac() { ssh -o BatchMode=yes "$MAC_HOST" "$@"; }
cmd_ios_sync() {
  cd "$REPO"; sync_version; npm run build && npx cap sync ios
  mac "mkdir -p ~/$MAC_DIR"
  rsync -a --delete --exclude 'ios/App/build' --exclude 'e2e-ios/node_modules' -R ios node_modules/@capacitor node_modules/@capacitor-community package.json capacitor.config.ts scripts/ios-device.sh scripts/mac-gui-run.sh e2e-ios "$MAC_HOST:$MAC_DIR/"
  echo "synced to $MAC_HOST:~/$MAC_DIR"
}
cmd_ios_sim() {
  cmd_ios_sync
  mac "set -e; cd ~/$MAC_DIR/ios/App
    xcodebuild -project App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=$IOS_SIM' -derivedDataPath build CODE_SIGNING_ALLOWED=NO build 2>&1 | grep -E 'error:|BUILD (SUCCEEDED|FAILED)' | sort -u
    xcrun simctl boot '$IOS_SIM' 2>/dev/null || true; xcrun simctl bootstatus '$IOS_SIM' -b >/dev/null 2>&1
    xcrun simctl terminate '$IOS_SIM' dev.hbq.mentalmath 2>/dev/null || true
    xcrun simctl install '$IOS_SIM' build/Build/Products/Debug-iphonesimulator/App.app
    xcrun simctl launch '$IOS_SIM' dev.hbq.mentalmath"
}
# ios:device [iPhone|iPad]: signed build, install and launch on a cable-connected device. Signing needs
# the login keychain, which SSH sessions cannot open, so the build runs as a one-off launchd job in
# the Mac's logged-in desktop session (removed again afterwards); its log streams back here.
cmd_ios_device() {
  local want=${2:-iPhone}
  cmd_ios_sync >/dev/null
  mac "U=\$(id -u); L=dev.hbq.mentalmath.device-build; P=/tmp/\$L.plist; LOG=/tmp/\$L.log; rm -f \$LOG
    cat > \$P <<PL
<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\"><dict><key>Label</key><string>\$L</string>
<key>ProgramArguments</key><array><string>/bin/bash</string><string>\$HOME/$MAC_DIR/scripts/ios-device.sh</string><string>$want</string></array>
<key>StandardOutPath</key><string>\$LOG</string><key>StandardErrorPath</key><string>\$LOG</string>
<key>RunAtLoad</key><true/></dict></plist>
PL
    launchctl bootout gui/\$U/\$L 2>/dev/null; launchctl bootstrap gui/\$U \$P
    for i in \$(seq 1 600); do grep -q '^EXIT ' \$LOG 2>/dev/null && break; sleep 2; done
    launchctl bootout gui/\$U/\$L 2>/dev/null; rm -f \$P; cat \$LOG; grep -q '^EXIT 0' \$LOG"
}
# ios:appium start|stop: Appium on 127.0.0.1:4723 on the Mac, run as a launchd job in the desktop
# session so it can sign WebDriverAgent with the login keychain. Log: /tmp/dev.hbq.mentalmath.appium.log
cmd_ios_appium() {
  case "${2:-start}" in
    start) mac "U=\$(id -u); L=dev.hbq.mentalmath.appium; P=/tmp/\$L.plist
      curl -s -m 2 http://127.0.0.1:4723/status | grep -q '\"ready\":true' && { echo 'appium already running'; exit 0; }
      cat > \$P <<PL
<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">
<plist version=\"1.0\"><dict><key>Label</key><string>\$L</string>
<key>ProgramArguments</key><array><string>/bin/zsh</string><string>-lc</string><string>exec appium --address 127.0.0.1 --port 4723 --log-level warn</string></array>
<key>StandardOutPath</key><string>/tmp/\$L.log</string><key>StandardErrorPath</key><string>/tmp/\$L.log</string>
<key>RunAtLoad</key><true/></dict></plist>
PL
      launchctl bootout gui/\$U/\$L 2>/dev/null; launchctl bootstrap gui/\$U \$P
      for i in \$(seq 1 60); do curl -s -m 2 http://127.0.0.1:4723/status | grep -q '\"ready\":true' && { echo 'appium ready'; exit 0; }; sleep 1; done
      echo 'appium did not start'; tail -5 /tmp/\$L.log; exit 1" ;;
    stop) mac "launchctl bootout gui/\$(id -u)/dev.hbq.mentalmath.appium 2>/dev/null; rm -f /tmp/dev.hbq.mentalmath.appium.plist; echo 'appium stopped'" ;;
  esac
}
# ios:wda [iPad|iPhone]: build and sign Apple's WebDriverAgent (the helper Appium drives devices
# with) into ~/dev/MentalMath/build-wda on the Mac, in the desktop session so it can sign.
cmd_ios_wda() {
  local want=${2:-iPad}
  mac "UDID=\$(xcrun devicectl list devices --json-output /tmp/mm-wda-devs.json >/dev/null 2>&1; /usr/bin/python3 -c \"import json;print(next(d['hardwareProperties']['udid'] for d in json.load(open('/tmp/mm-wda-devs.json'))['result']['devices'] if d['hardwareProperties'].get('reality')=='physical' and '$want'.lower() in d['deviceProperties']['name'].lower()))\")
    W=\$(dirname \$(find ~/.appium -name WebDriverAgent.xcodeproj -maxdepth 6 | head -1))
    ~/$MAC_DIR/scripts/mac-gui-run.sh \"cd '\$W' && xcodebuild -project WebDriverAgent.xcodeproj -scheme WebDriverAgentRunner -destination id=\$UDID -derivedDataPath ~/$MAC_DIR/build-wda -allowProvisioningUpdates DEVELOPMENT_TEAM=P7G23CKH62 PRODUCT_BUNDLE_IDENTIFIER=dev.hbq.mentalmath.wda CODE_SIGN_STYLE=Automatic build-for-testing > /tmp/mm-wda-build.log 2>&1\" 2400 >/dev/null
    grep -E '^\\*\\* |error:' /tmp/mm-wda-build.log | sort -u | head -8"
}
# ios:e2e [iPad|iPhone]: install the current build on the device, then drive it with e2e-ios/ (Appium).
# SKIP_BUILD=1 reuses the installed app.
cmd_ios_e2e() {
  local want=${2:-iPad}
  cd "$REPO"; npx tsx e2e-ios/make-fixtures.ts >/dev/null
  if [ "${SKIP_BUILD:-}" = 1 ]; then cmd_ios_sync >/dev/null; else cmd_ios_device ios:device "$want" | grep -E 'FAILED|error:|EXIT [1-9]' || true; fi
  mac "ls ~/$MAC_DIR/build-wda/Build/Products/*.xctestrun >/dev/null 2>&1" || cmd_ios_wda ios:wda "$want"
  cmd_ios_appium ios:appium start >/dev/null || { echo 'appium did not start'; return 1; }
  # Quiet by default: the summary and any failures. VERBOSE=1 shows every test.
  mac "zsh -lc 'cd ~/$MAC_DIR/e2e-ios && { [ -d node_modules/webdriverio ] || npm install --silent --no-audit --no-fund; } && IOS_DEVICE=$want npm test --silent 2>&1'" \
    | if [ "${VERBOSE:-}" = 1 ]; then cat; else grep -E '^\s*✖|^ℹ (tests|pass|fail|skipped)|Error:|AssertionError' | grep -v '^✖ iOS app' | awk '!seen[$0]++' | head -30; fi
}
# ios:store-shots: App Store screenshots (iPhone 6.9" and iPad 13") from the simulators into store/ios/
cmd_ios_store_shots() {
  cd "$REPO"; npx tsx e2e-ios/make-fixtures.ts >/dev/null; cmd_ios_sync >/dev/null
  for pair in "iphone:iPhone 18 Pro Max" "ipad:iPad Pro 13-inch (M5)"; do
    local dir=${pair%%:*} sim=${pair#*:}
    mac "rm -rf ~/$MAC_DIR/store-shots/$dir; zsh -lc 'cd ~/$MAC_DIR/e2e-ios && { [ -d node_modules/webdriverio ] || npm install --silent --no-audit --no-fund; } && IOS_SIM=\"$sim\" OUT=~/$MAC_DIR/store-shots/$dir node store-shots.mjs 2>&1 | tail -1'"
    mkdir -p "store/ios/$dir"; rm -f "store/ios/$dir"/*.png
    scp -q "$MAC_HOST:$MAC_DIR/store-shots/$dir/*.png" "store/ios/$dir/"
  done
  mac "xcrun simctl shutdown all 2>/dev/null"; cmd_ios_sync >/dev/null   # restore the Mac copy
}
# ios:shot [name]: screenshot the simulator into screenshots/ios/<name>.png
cmd_ios_shot() {
  local name=${2:-screen}
  mac "mkdir -p ~/$MAC_DIR/shots && xcrun simctl io '$IOS_SIM' screenshot ~/$MAC_DIR/shots/$name.png >/dev/null 2>&1"
  mkdir -p "$REPO/screenshots/ios" && scp -q "$MAC_HOST:$MAC_DIR/shots/$name.png" "$REPO/screenshots/ios/$name.png" && echo "screenshots/ios/$name.png"
}
cmd_ios_icons() { cd "$REPO"; npx @capacitor/assets generate --ios --assetPath assets --iconBackgroundColor '#8b2e2e' --iconBackgroundColorDark '#8b2e2e' --splashBackgroundColor '#f6f1e7' --splashBackgroundColorDark '#0f1720'; }
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
cmd_emu_shots() { android_env; cd "$REPO"; node scripts/android-shots.mjs; }
# A paired phone (adb pair <ip:port> <code>, then adb connect <ip:port>): install and drive it like the emulator.
cmd_phone_install() { android_env; adb -s "${PHONE_SERIAL:?set PHONE_SERIAL=ip:port}" install -r "$REPO/android/app/build/outputs/apk/debug/app-debug.apk"; }
cmd_phone_shots() { android_env; cd "$REPO"; ANDROID_SERIAL="${PHONE_SERIAL:?set PHONE_SERIAL=ip:port}" SHOTS_DIR=screenshots/phone node scripts/android-shots.mjs; }

cmd_play() { cd "$REPO"; node scripts/play.mjs "$@"; }
cmd_docker_build() {
  cd "$REPO"
  local v; v=$(node -p "require('./package.json').version")
  docker build -t "mentalmath:$v" -t mentalmath:latest .
  echo "built mentalmath:$v (also :latest)"
}
cmd_docker_run() { cd "$REPO"; PORT="$PORT" docker compose up -d; echo "container on http://localhost:$PORT/"; }
cmd_docker_stop() { cd "$REPO"; docker compose down; }

cmd_release() { cmd_bump patch; cmd_android_release; cmd_play upload "${2:-internal}"; }

case "${1:-}" in
  play:check) cmd_play check ;;
  play:upload) cmd_play upload "${2:-internal}" ;;
  play:listing) cmd_play listing ;;
  release) cmd_release "$@" ;;
  ios:sync) cmd_ios_sync ;;
  ios:sim) cmd_ios_sim ;;
  ios:shot) cmd_ios_shot "$@" ;;
  ios:device) cmd_ios_device "$@" ;;
  ios:appium) cmd_ios_appium "$@" ;;
  ios:wda) cmd_ios_wda "$@" ;;
  ios:store-shots) cmd_ios_store_shots ;;
  ios:e2e) cmd_ios_e2e "$@" ;;
  ios:icons) cmd_ios_icons ;;
  docker:build) cmd_docker_build ;;
  docker:run) cmd_docker_run ;;
  docker:stop) cmd_docker_stop ;;
  android:sync) cmd_android_sync ;;
  android:debug) cmd_android_debug ;;
  android:release) cmd_android_release ;;
  bump) cmd_bump "$@" ;;
  android:icons) cmd_android_icons ;;
  emu:start) cmd_emu_start ;;
  emu:stop) cmd_emu_stop ;;
  emu:install) cmd_emu_install ;;
  emu:shots) cmd_emu_shots ;;
  phone:install) cmd_phone_install ;;
  phone:shots) cmd_phone_shots ;;
  deploy) cmd_deploy ;;
  update) cmd_update ;;
  install) cmd_install ;;
  uninstall) cmd_uninstall ;;
  start|stop|restart) systemctl --user "$1" "$UNIT"; systemctl --user status "$UNIT" --no-pager | head -5 ;;
  status) systemctl --user status "$UNIT" --no-pager ;;
  logs) shift; journalctl --user -u "$UNIT" -n 100 "$@" ;;
  health) cmd_health ;;
  url) cmd_url ;;
  *) sed -n '2,28p' "$0"; exit 2 ;;
esac
