# Warlock

Warlock is an Android-first mobile character manager for tabletop RPGs, with a current focus on Dungeons and Dragons 2024 5e.

Despite the name, this app is not limited to the Warlock class. The goal is to support any class and eventually any ruleset, including homebrew and UA.

## Project Status

This project is internal and actively in progress.

- Audience: developers and trusted internal users
- Maturity: work-in-progress
- Platform focus: Android
- Runtime: Expo (React Native)

## What Warlock Does Today

Warlock currently provides a full mobile flow for building and running characters at the table:

- Character list management (create, open, rename, delete)
- Character creation wizard (name, race, class, subclass, background, feats, abilities)
- Character sheet tabs for:
    - Overview (HP, rests, resources, combat actions)
    - Skills and saving throws
    - Inventory and custom items
    - Magic (spell slots, spell list, invocations)
    - Reference (class features and progression)
- Local persistence on-device
- Character import/export as JSON

## Vision and Direction

The long-term direction is:

- Support all DnD 2024 classes and features
- Keep the rules/data layer extensible for:
    - alternate rulesets
    - homebrew content
    - Unearthed Arcana
- Continue improving in-session speed and usability on mobile

## Important Repository Note

You will see many files with names ending in \_old.

These are legacy or transitional files kept during ongoing refactors. They are useful for reference history but are generally not the active runtime path.

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm
- Android device or Android emulator

### Install Dependencies

```bash
npm install
```

### Start the App

```bash
npm start
```

From the Expo terminal UI you can usually:

- press a to open Android
- scan the QR code with Expo Go on your Android device

If you want a direct Android run command:

```bash
npm run android
```

## Expo Explained (Beginner-Friendly)

If you are new to mobile development, Expo can feel confusing at first. This section gives you the practical mental model.

### What Expo Is

Expo is a toolkit and runtime around React Native that makes mobile development easier.

Think of it as a developer platform that handles a lot of the painful setup:

- project bootstrapping
- local development server
- app packaging/build tools
- device connection workflows
- common native APIs (file system, sharing, etc.)

Instead of manually wiring low-level Android native config on day one, Expo gives you a smoother path to get an app running quickly.

### Why This Project Uses Expo

For this project, Expo provides:

- fast iteration while developing UI and game logic
- easy local testing on Android devices
- built-in access to native capabilities already used in this codebase (file system, document picker, sharing)

### Expo Go vs Development Build

When you run npm start, Expo launches a development server.

You then run the app in one of two common ways:

1. Expo Go
    - A prebuilt Expo app you install from the Play Store.
    - You scan the QR code and your project opens inside Expo Go.
    - Best for quick iteration and learning.

2. Development Build (native app build)
    - A custom build of your app with your own native configuration.
    - Better if you need advanced native modules or behavior beyond Expo Go.

For this repo, start with Expo Go unless you hit a specific limitation.

### What Happens When You Run npm start

At a high level:

1. Expo starts a bundler server on your machine.
2. Your JavaScript/TypeScript code is compiled into a mobile bundle.
3. Your Android device/emulator loads that bundle.
4. When you save changes, the app updates quickly (hot reload / fast refresh).

This is why the development loop feels much faster than full native rebuilds.

### Do I Need Android Studio?

Not always.

- Physical Android phone + Expo Go: often enough to start.
- Android emulator: yes, Android Studio is usually needed for the emulator setup.

### What Is EAS?

EAS (Expo Application Services) is Expo's cloud build/deploy system.

You can think of it as the service that helps produce installable builds (APK/AAB) without doing every native build step manually on your own machine.

This repo includes EAS configuration, but if you are just trying to run and develop locally, npm start is the main first step.

## Usage Notes

- Data is currently local-first on the device.
- Treat exported JSON files as your backup/share format.
- Because this project is WIP, expect rapid changes in data format and behavior.

## Troubleshooting

### Metro/Expo does not start

- Ensure dependencies are installed: npm install
- Retry with cache clear:

```bash
npx expo start -c
```

### Android device not detected

- Use Expo Go with QR code first (easiest path)
- If using emulator, confirm emulator is running before starting Android launch

### App behaves strangely after branch changes

- Stop server, restart with cache clear:

```bash
npx expo start -c
```

## Current Scope Summary

Warlock is an internal Android-first Expo app for creating and managing DnD 2024 5e characters, with architecture intended to grow toward wider ruleset support, including homebrew and UA.
