# Building the Android APK from GitHub

This project is pre-configured with **Capacitor** (`capacitor.config.json`) and an automated **GitHub Actions** workflow (`.github/workflows/build-apk.yml`) so you can build an installable Android `.apk` directly on GitHub without installing Android Studio locally.

## 1. Automatic Build via GitHub Actions

1. Push this repository to GitHub (`main` or `master` branch).
2. Open your repository on GitHub and click the **Actions** tab.
3. Select the **Build Android APK** workflow:
   - It runs automatically on every push to `main` / `master`.
   - You can also click **Run workflow** manually and pick either `debug` (installable immediately on Android devices) or `release`.
4. Once the workflow finishes, scroll down to **Artifacts** and download **`sticky-notes-puzzle-debug`** (or **`release`**), unzip it, and install the `.apk` on your Android device.

## 2. Optional: Signed Release APKs & GitHub Releases

To produce a signed release APK automatically (for sharing or Play Store distribution), add these 4 repository secrets under **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64`: Base64-encoded `.jks` / `.keystore` file (`base64 -w 0 release.keystore`)
- `ANDROID_KEYSTORE_PASSWORD`: Your keystore password
- `ANDROID_KEY_ALIAS`: Your key alias
- `ANDROID_KEY_PASSWORD`: Your key password

Whenever you push a version tag (for example `git tag v1.0.0 && git push origin v1.0.0`), GitHub Actions automatically builds the release APK and attaches it to a GitHub Release.

## 3. Optional: Local Android Build

If you have Android Studio / Java 21 / Android SDK installed locally:

```bash
npm install
npm run android:prepare
npm run android:apk
```

The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
