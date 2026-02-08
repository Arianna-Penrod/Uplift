# Uplift (React Native + Expo Router)

Uplift is a mobile app built with React Native + Expo that guides users through “levels” of career readiness (Resume, Elevator Pitch, Professional Profile, and Technical Interview practice). The app uses **Expo Router** for file-based navigation and a **light-mode** UI.

---

## Features

- **Tabbed home** (Expo Router `(tabs)` group)
- **Level-based flow**
  - **Level 1:** Resume
  - **Level 2:** Elevator Pitch
  - **Level 3:** Professional Profile
  - **Level 4:** Technical Interview practice (including fill-in-the-blank style exercises)
- Reusable UI components:
  - `Card` component for consistent “panel” styling
  - Fill-in-the-blank UI component for interactive questions
- Consistent **light theme**
- Progress bars styled with app tint color (`#0a7ea4`)

---

## Tech Stack

- **React Native**
- **Expo**
- **Expo Router** (file-based navigation)
- React Navigation (under the hood)
- TypeScript

---

## Getting Started

### 1) Install dependencies
```bash
npm install
# or
yarn
