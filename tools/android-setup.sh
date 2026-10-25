#!/usr/bin/env bash
# Prepares the Android app project (Capacitor) from www/: creates it if needed, then applies
# the game's icon, splash screen, full-screen theme and version number. Run after build-www.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(grep -o 'name="game-version" content="[0-9]*' game/gnomes-of-hollowmere.html | grep -o '[0-9]*$')
[ -d android ] || npx cap add android
npx cap sync android
RES=android/app/src/main/res
# Launcher icons: our own artwork at every density (drop the default adaptive icon so these are used)
rm -rf "$RES/mipmap-anydpi-v26"
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  cp "build/android/ic_launcher-$d.png" "$RES/mipmap-$d/ic_launcher.png"
  cp "build/android/ic_launcher_round-$d.png" "$RES/mipmap-$d/ic_launcher_round.png"
  rm -f "$RES/mipmap-$d/ic_launcher_foreground.png"
done
# Splash screen
find "$RES" -name 'splash.png' -exec cp build/android/splash.png {} \;
# Full-screen game theme (hides the status bar while playing)
STY="$RES/values/styles.xml"
if ! grep -q 'windowFullscreen' "$STY"; then
  sed -i 's|<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">|&\n        <item name="android:windowFullscreen">true</item>\n        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>|' "$STY"
fi
# Version shown in Android settings and used for updates
GRADLE=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION}/; s/versionName \"[^\"]*\"/versionName \"1.${VERSION}\"/" "$GRADLE"
# Stable signing key, so a newer APK installs over the old one and keeps saved games
mkdir -p "$HOME/.android" && cp build/android/debug.keystore "$HOME/.android/debug.keystore"
echo "Android project ready: version 1.${VERSION}"
