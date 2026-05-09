# Mobile App (React Native + Expo)

## Features
- Camera + library photo upload (multi)
- Native GPS via expo-location
- OpenStreetMap layer via Leaflet in WebView
- **Push notifications** (Expo Push) when a report status changes
- **Offline submission queue** (AsyncStorage + expo-file-system)
- **i18n**: English / Albanian / Italian, shared with the web app
- Settings screen: language picker, queue inspector, push token

## Architecture

```
mobile/
  App.tsx              # nav + boot (i18n init, push register, queue flush)
  src/
    screens/           # Home, Report, Map, Success, Settings
    lib/
      api.ts           # REST client (multipart upload)
      i18n.ts          # i18n-js wrapper, persists choice in AsyncStorage
      notifications.ts # expo-notifications wrapper
      queue.ts         # offline queue (FileSystem + AsyncStorage)
      theme.ts
```

## Push notifications

1. App boot calls `registerForPushNotificationsAsync()` -> returns Expo token
2. Token POSTed to `/api/devices` (backend keeps an in-memory list)
3. When a moderator updates a report status:
   - `PATCH /api/reports/:id/status` -> `notifyStatusChange()` ->
     `https://exp.host/--/api/v2/push/send` to all devices
4. App receives the notification, taps -> navigates to Map at the report's coords

> Production: persist devices in Postgres, target by region or by `userId`,
> handle push receipts and invalid tokens.

## Offline queue

- `submitOrQueue(payload)` first checks `expo-network`
- If offline, photos are copied to `FileSystem.documentDirectory/htt-queue/`
  so they survive a process restart, and metadata is stored in AsyncStorage
- `flushQueue()` runs:
  - on app start
  - on `AppState` -> `active` (foreground)
  - on user tap (Settings -> Sync now)
- Failed items keep `attempts` and `lastError` for inspection

## i18n

- Source-of-truth JSONs live in `/locales` at the repo root
- Both web (`frontend/src/lib/i18n.tsx`) and mobile (`src/lib/i18n.ts`) import them
- Switch language: web `LanguageSwitcher` in header, mobile Settings screen
- Persisted in localStorage / AsyncStorage

To add a language:
1. Drop `locales/<code>.json` next to the others
2. Add the code to `SUPPORTED` in both i18n files
3. Add a label under `lang.<code>` in every locale

## EAS build

```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure          # already prepared in eas.json
npm run build:android        # APK preview
npm run build:ios            # iOS internal
```

Profiles in `eas.json`:
- **development** — local API, dev client
- **preview** — internal distribution, prod-like API
- **production** — store-bound, auto increments build number

## Permissions
- iOS: camera, photo library, location-when-in-use
- Android: CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION,
  READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, RECEIVE_BOOT_COMPLETED, VIBRATE
