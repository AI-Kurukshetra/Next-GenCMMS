# AssetOps Mobile (Flutter)

Technician-focused mobile app starter for iOS/Android with:

- Work order access and updates
- QR / barcode scanning entry flow
- Basic offline mode with queued sync
- Supabase login (required)

## Run

```bash
cd mobile
flutter pub get
flutter run
```

## Supabase (optional but recommended)

This app requires Supabase configuration to sign in.
Run with Dart defines:

```bash
flutter run \
  --dart-define=SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## What is implemented now

- **Mobile App Interface**: login + work order list + detail update flow
- **QR Code & Barcode Scanning**: scan screen with result handling hook
- **Basic Mobile Offline Mode**:
  - local SQLite cache
  - offline status/notes updates
  - sync queue + reconnect sync
