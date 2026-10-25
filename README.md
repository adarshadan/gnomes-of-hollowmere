# Gnomes of Hollowmere

A 3D fantasy board game. Race your gnome from the Burrow to the Summit Hearth on square 100, past vine ladders, monster lairs and magic relics. Every board is generated fresh, and the whole game is about 1 MB.

**Play in your browser:** https://adarshadan.github.io/gnomes-of-hollowmere/

On a phone or tablet, open that link and choose **Install app** (or **Add to Home Screen**) to get an icon, a full-screen game and offline play. Opening it from this secure link also enables **shake your phone to roll**.

## Downloads

The latest apps are on the [Releases page](../../releases/latest):

| File | For |
|---|---|
| `…-Windows-Setup.exe` | Windows 10 and 11: installs the game with a Start menu shortcut |
| `…-Windows-Portable.exe` | Windows 10 and 11: runs without installing |
| `…-Windows.msi` | Windows: installer for managed PCs |
| `…-Android.apk` | Android phones and tablets (allow "Install unknown apps" when asked) |
| `…-Standalone.html` | Any device: open in a browser, works offline |

## How it is built

| Folder | What it holds |
|---|---|
| `game/` | The game itself: one HTML file (three.js for 3D, Web Audio for music) |
| `tools/build-www.mjs` | Builds the offline bundle: inlines three.js and the fonts, adds the installable web app files |
| `www/icons/`, `build/` | App icon, Android launcher icons and splash screen |
| `src-tauri/` | Windows app (Tauri), a small native window around the game |
| `capacitor.config.json`, `tools/android-setup.sh` | Android app (Capacitor) |
| `.github/workflows/build.yml` | Builds everything on each push to `main`, publishes the web app and creates a release |

To release a new version, replace `game/gnomes-of-hollowmere.html` with the new game file and push. The version number is read from the game's `game-version` tag.

## Credits

Made by **Adarsha Dan** and **Akash Dan**, in collaboration with **Claude Opus 5.5**.

Third-party components: [three.js](https://threejs.org) (MIT licence), the typefaces IM Fell English SC and Alegreya Sans (SIL Open Font Licence, see `tools/fonts`), Tauri and Capacitor (MIT / Apache 2.0).
