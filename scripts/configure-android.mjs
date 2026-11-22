import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const androidDir = path.join(rootDir, 'android');
const appDir = path.join(androidDir, 'app');
const resDir = path.join(appDir, 'src', 'main', 'res');
const manifestPath = path.join(appDir, 'src', 'main', 'AndroidManifest.xml');
const buildGradlePath = path.join(appDir, 'build.gradle');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

if (!fs.existsSync(androidDir)) {
  console.error('Android project folder not found. Run "npx cap add android" first.');
  process.exit(1);
}

// 1. Configure portrait orientation & hardware acceleration in AndroidManifest.xml
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android:screenOrientation=')) {
    manifest = manifest.replace(
      /<activity([^>]*android:name="\.MainActivity"[^>]*)>/,
      '<activity$1\n            android:screenOrientation="portrait">'
    );
  }
  fs.writeFileSync(manifestPath, manifest, 'utf8');
}

// 2. Inject crisp Adaptive Vector Launcher Icon matching our Sticky Notes Puzzle game icon
const drawableDir = path.join(resDir, 'drawable');
const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
fs.mkdirSync(drawableDir, { recursive: true });
fs.mkdirSync(anydpiDir, { recursive: true });

const iconBgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0F172A"
        android:pathData="M0,0h108v108h-108z" />
</vector>
`;

const iconFgXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="128"
    android:viewportHeight="128">
    <!-- Coral Back Note -->
    <group android:translateX="24" android:translateY="32" android:rotation="-11">
        <path
            android:fillColor="#FB7185"
            android:pathData="M6,0h36c3.3,0 6,2.7 6,6v36c0,3.3 -2.7,6 -6,6h-36c-3.3,0 -6,-2.7 -6,-6v-36c0,-3.3 2.7,-6 6,-6z" />
    </group>
    <!-- Sky Back Note -->
    <group android:translateX="56" android:translateY="24" android:rotation="10">
        <path
            android:fillColor="#38BDF8"
            android:pathData="M6,0h36c3.3,0 6,2.7 6,6v36c0,3.3 -2.7,6 -6,6h-36c-3.3,0 -6,-2.7 -6,-6v-36c0,-3.3 2.7,-6 6,-6z" />
    </group>
    <!-- Hero Canary Note -->
    <group android:translateX="32" android:translateY="34" android:rotation="-2">
        <path
            android:fillColor="#FDE047"
            android:pathData="M8,0h48c4.4,0 8,3.6 8,8v38l-16,16h-40c-4.4,0 -8,-3.6 -8,-8v-46c0,-4.4 3.6,-8 8,-8z" />
        <path
            android:fillColor="#EAB308"
            android:pathData="M48,62v-13c0,-1.7 1.3,-3 3,-3h13z" />
        <!-- Bold Arrow -->
        <path
            android:strokeColor="#3F2104"
            android:strokeWidth="6.5"
            android:strokeLineCap="round"
            android:strokeLineJoin="round"
            android:pathData="M16,33h29M33,22l13,11l-13,11" />
    </group>
</vector>
`;

const adaptiveLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_sticky_bg" />
    <foreground android:drawable="@drawable/ic_sticky_fg" />
</adaptive-icon>
`;

fs.writeFileSync(path.join(drawableDir, 'ic_sticky_bg.xml'), iconBgXml, 'utf8');
fs.writeFileSync(path.join(drawableDir, 'ic_sticky_fg.xml'), iconFgXml, 'utf8');
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveLauncherXml, 'utf8');
fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveLauncherXml, 'utf8');

// 3. Sync versionName / versionCode & optional release signing config in app/build.gradle
if (fs.existsSync(buildGradlePath)) {
  let gradle = fs.readFileSync(buildGradlePath, 'utf8');
  const versionName = pkg.version || '1.0.0';
  const versionCode = Number(process.env.GITHUB_RUN_NUMBER || 1);

  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

  // Inject env-var-driven release signing when keystore secrets are configured in GitHub Actions
  if (!gradle.includes('SIGNING_KEYSTORE_PATH') && gradle.includes('buildTypes {')) {
    const signingBlock = `    signingConfigs {
        release {
            if (System.getenv("SIGNING_KEYSTORE_PATH")) {
                storeFile file(System.getenv("SIGNING_KEYSTORE_PATH"))
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {`;
    gradle = gradle.replace('    buildTypes {', signingBlock);
    gradle = gradle.replace(
      /release\s*\{([\s\S]*?)minifyEnabled/,
      `release {$1if (System.getenv("SIGNING_KEYSTORE_PATH")) {\n                signingConfig signingConfigs.release\n            }\n            minifyEnabled`
    );
  }

  fs.writeFileSync(buildGradlePath, gradle, 'utf8');
}

console.log('Configured Android project for Sticky Notes Puzzle.');
