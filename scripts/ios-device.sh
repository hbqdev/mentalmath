#!/bin/bash
# Runs ON the Mac, inside the logged-in desktop session (started by `mentalmath.sh ios:device`),
# where the login keychain can sign. Builds the debug app, installs it on a connected device and
# launches it. usage: ios-device.sh <device name substring, e.g. iPhone or iPad>
set -o pipefail
want=${1:-iPhone}
cd "$(dirname "$0")/../ios/App" || { echo "EXIT 1"; exit 1; }
xcrun devicectl list devices --json-output /tmp/mm-devices.json >/dev/null 2>&1
udid=$(/usr/bin/python3 - "$want" <<'PY'
import json, sys
want = sys.argv[1].lower()
for d in json.load(open('/tmp/mm-devices.json'))['result']['devices']:
    hw, props = d.get('hardwareProperties', {}), d.get('deviceProperties', {})
    if hw.get('reality') == 'physical' and want in props.get('name', '').lower():
        print(hw.get('udid', '')); break
PY
)
[ -n "$udid" ] || { echo "no connected device matching '$want'"; echo "EXIT 2"; exit 2; }
echo "device $want -> $udid"
xcodebuild -project App.xcodeproj -scheme App -configuration Debug -destination "platform=iOS,id=$udid" \
  -derivedDataPath build -allowProvisioningUpdates build 2>&1 | grep -E "error:|errSec|BUILD (SUCCEEDED|FAILED)" | sort -u
[ "${PIPESTATUS[0]}" = 0 ] || { echo "EXIT 3"; exit 3; }
xcrun devicectl device install app --device "$udid" build/Build/Products/Debug-iphoneos/App.app 2>&1 | grep -iE "installed|error" | head -3
xcrun devicectl device process launch --device "$udid" dev.hbq.mentalmath 2>&1 | grep -iE "launched|error|locked" | head -3
echo "EXIT 0"
