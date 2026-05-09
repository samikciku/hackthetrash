# 📱 HackTheTrash Mobile App

React Native (Expo) app companion for the HackTheTrash web platform.
Same backend API, native camera + GPS, OpenStreetMap layer.

## ✨ Features

- 📸 Camera capture or gallery upload (multi-photo)
- 📍 GPS auto-detect (high accuracy)
- 🗺️ Interactive OpenStreetMap layer (Leaflet via WebView)
- 🏷️ Tags, severity, optional anonymous mode
- 🎯 Auto-fly to your fresh pin after submission
- 🔄 Polls the server every 30s so the OSM layer stays fresh

## 📂 Structure

```
mobile/
├── App.tsx                    # navigation entry
├── app.json                   # Expo config (permissions, icons)
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx     # landing
│   │   ├── ReportScreen.tsx   # camera + GPS + form
│   │   ├── MapScreen.tsx      # OSM map (Leaflet WebView)
│   │   └── SuccessScreen.tsx  # confirmation
│   └── lib/
│       ├── api.ts             # fetch + multipart upload
│       └── theme.ts           # colors / status palette
└── assets/                    # icons, splash
```

## 🚀 Getting Started

### Prereqs
- Node 18+
- Expo CLI: `npm install -g expo-cli` (or use npx)
- iOS Simulator (macOS) or Android Studio emulator, or the **Expo Go** app on your phone

### Install
```bash
cd mobile
npm install
```

### Run
```bash
npm run start          # opens Expo dev tools
npm run ios            # iOS simulator
npm run android        # Android emulator
```

Scan the QR code with Expo Go on your physical device for instant on-device testing.

### Backend URL

Default in `app.json` -> `expo.extra.apiUrl`:
- Android emulator: `http://10.0.2.2:4000` (host loopback)
- iOS simulator:    `http://localhost:4000`
- Physical device:  set to your laptop LAN IP, e.g. `http://192.168.1.42:4000`

Edit `app.json` or override via `expo-constants`.

## 🔐 Permissions

Configured in `app.json`:
- iOS: camera, photo library, location-when-in-use
- Android: CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION

Permissions are requested at runtime when the user taps the relevant button.

## 🗺️ Why WebView + Leaflet for the map?

`react-native-maps` requires Google Maps API keys and doesn't natively support
OSM tiles on iOS. By rendering Leaflet inside a WebView we get:
- Real OpenStreetMap tiles (same as the web app)
- Same popup design (photos + status badge)
- Zero API key requirement
- Easy parity with the web frontend

For higher performance, swap to `react-native-maps` with `UrlTile` for OSM,
or `@maplibre/maplibre-react-native` for a native vector renderer.

## 🏗️ Build for production

```bash
# Install EAS CLI once
npm install -g eas-cli
eas login

# Configure
eas build:configure

# Build .apk for Android
eas build -p android --profile preview

# Build for iOS (requires Apple Developer account)
eas build -p ios --profile preview
```

## 🛣️ Roadmap

- [ ] Offline queue (submit when back online)
- [ ] Push notifications when a nearby report is cleaned
- [ ] Heatmap view
- [ ] In-app login + profile
- [ ] i18n (English / Albanian / Italian)
