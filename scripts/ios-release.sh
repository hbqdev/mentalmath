#!/bin/bash
# Runs ON the Mac, in the desktop session (via mac-gui-run.sh): archives the App Store build and
# uploads it to App Store Connect. Signing is automatic through the App Store Connect API key in
# ~/.appstoreconnect/private_keys/.
# usage: ios-release.sh <key-id> <issuer-id> <team-id>
set -o pipefail
KEY_ID=$1; ISSUER=$2; TEAM=$3
KEY=$HOME/.appstoreconnect/private_keys/AuthKey_$KEY_ID.p8
[ -f "$KEY" ] || { echo "error: no API key at $KEY"; exit 1; }
cd "$HOME/dev/MentalMath/ios/App" || exit 1
OUT=build/release; rm -rf "$OUT"; mkdir -p "$OUT"
AUTH=(-allowProvisioningUpdates -authenticationKeyPath "$KEY" -authenticationKeyID "$KEY_ID" -authenticationKeyIssuerID "$ISSUER")

xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination generic/platform=iOS \
  -archivePath "$OUT/App.xcarchive" DEVELOPMENT_TEAM="$TEAM" "${AUTH[@]}" archive > "$OUT/archive.log" 2>&1
grep -E 'error:|ARCHIVE (SUCCEEDED|FAILED)' "$OUT/archive.log" | sort -u
grep -q 'ARCHIVE SUCCEEDED' "$OUT/archive.log" || exit 1

cat > "$OUT/export.plist" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>upload</string>
<key>teamID</key><string>$TEAM</string>
<key>signingStyle</key><string>automatic</string>
<key>uploadSymbols</key><true/>
<key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
PL
xcodebuild -exportArchive -archivePath "$OUT/App.xcarchive" -exportOptionsPlist "$OUT/export.plist" \
  -exportPath "$OUT" "${AUTH[@]}" > "$OUT/export.log" 2>&1
grep -E 'error|EXPORT (SUCCEEDED|FAILED)|[Uu]pload' "$OUT/export.log" | sort -u
grep -q 'EXPORT SUCCEEDED' "$OUT/export.log"
