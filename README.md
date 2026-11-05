# 🎰 Slot Machine Workout

A customizable, interactive 4-roller slot machine web application designed to gamify fitness routines. Spin to randomly generate your next exercise challenge, track progress towards a target number of rolls, and share custom workouts with friends or clients via 1-click email links or direct URLs.

![Slot Machine Workout Preview](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20Desktop-orange)
![License](https://img.shields.io/badge/License-MIT-blue)
![Vite](https://img.shields.io/badge/Bundler-Vite%206-purple)

---

## 🌟 Highlights & Features

### 1. Authentic 4-Roller Slot Mechanics
- **Roller 1: Custom Exercises**
  - Fully customizable: manually add, edit, or delete any exercise.
  - Built-in presets: *Full Body Bodyweight*, *Core & Abs Shred*, *HIIT Cardio Burner*, and *Dumbbell Strength*.
- **Roller 2: Work Time**
  - 30 seconds to 90 seconds, in exact 10-second increments (`30s`, `40s`, `50s`, `60s`, `70s`, `80s`, `90s`).
- **Roller 3: Rest Time**
  - 15 seconds to 45 seconds, in exact 5-second increments (`15s`, `20s`, `25s`, `30s`, `35s`, `40s`, `45s`).
- **Roller 4: Sets**
  - 1, 2, or 3 sets (`1`, `2`, `3`).

### 2. Physical Arcade Experience
- **Interactive Mechanical Lever**: Click or pull the 3D spring-loaded lever on the right side of the machine to initiate a spin.
- **Arcade Pushbutton**: Big tactile "SPIN" button with keyboard shortcut (`Spacebar` to spin, `L` for lever pull).
- **Procedural Audio Engine**: Authentic mechanical click loops, sequential reel clunks, win chimes, and countdown beeps powered by the native Web Audio API (zero external sound files, completely offline capable).
- **Realistic Reel Physics**: Smooth cubic-bezier deceleration with mechanical brake overshoot bounce.

### 3. Shareable Workouts & 1-Click Email Invites
- **URL Serialization**: Custom exercise sets and target roll counts are encoded into lightweight URL hash fragments.
- **1-Click Email Sharing**: Generates a pre-formatted `mailto:` email with a formatted workout breakdown and direct URL for friends, clients, or training partners.
- **Zero-Backend Requirement**: No server or database required; state is fully preserved via URL encoding and client-side `localStorage`.

### 4. Goal-Oriented Roll Targets & Celebration
- **Specified Number of Rolls**: Set how many rolls are required to finish the workout (e.g. 10 rounds).
- **Live HUD & Marquee**: Displays current roll progress (`Roll 3 / 10`), remaining rounds, and an animated progress bar.
- **Jackpot Celebration**: Reaching the final roll triggers a canvas confetti cannon, triumphal fanfare, and session summary metrics (total work time, total rest time, total sets completed).

### 5. Integrated Interval Companion Timer
- Launch an automated workout timer directly from the rolled outcome.
- 3-second "Get Ready" countdown, followed by timed **Work** and **Rest** intervals across all specified sets.
- Audio transition cues at 3-2-1 seconds and phase completion.

---

## 🏗️ Architecture & Project Structure

```
slot-workout/
├── index.html                 # Main user interface & slot cabinet layout
├── package.json               # Vite project configuration & scripts
├── README.md                  # System documentation & usage guide
├── test/
│   └── workout.test.js        # Automated unit test suite
└── src/
    ├── main.js                # App coordinator, event bindings, keyboard handlers
    ├── styles/
    │   └── main.css           # 3D arcade styling, neon theme, responsive layout
    └── modules/
        ├── audio.js           # Procedural Web Audio API sound synthesizer
        ├── confetti.js        # HTML5 Canvas celebration particle explosion
        ├── intervalTimer.js   # Interactive workout interval companion
        ├── share.js           # URL serialization, base64 encoding, mailto generator
        ├── slotEngine.js      # 4-Reel animation, cubic-bezier easing, reel stops
        └── workoutState.js    # Central state store, persistence, history tracking
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ (tested on v24)
- npm v9+

### Installation
```bash
# Clone the repository
git clone https://github.com/SwimmerPierce/slot-workout.git

# Navigate into project directory
cd slot-workout

# Install development dependencies
npm install
```

### Development Server
Run the local Vite dev server with instant Hot Module Replacement (HMR):
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Automated Tests
Execute the unit test suite verifying reel intervals, sets, exercise pools, state mutations, and share link encoding:
```bash
npm test
```

### Production Build
Compile optimized static production assets ready for deployment:
```bash
npm run build
```
Built static files are placed in the `dist/` directory.

### Preview Production Build
```bash
npm run preview
```

---

## 🎮 How to Use

1. **Spin the Machine**:
   - Tap the red **SPIN!** button, pull the **mechanical lever**, or press **Spacebar** on your keyboard.
   - The 4 reels will spin and lock in sequentially: **Exercise** -> **Work Time** -> **Rest Time** -> **Sets**.
2. **Execute Your Challenge**:
   - Tap **"Start Guided Interval Timer"** for an audio-guided countdown covering all sets.
   - Or perform it on your own and tap **"Did It (Spin Next)"**.
3. **Customize Exercises & Goals**:
   - Click the **"Exercises"** button in the header.
   - Add your own custom exercises or pick from built-in presets.
   - Set the **Target Rolls** (e.g. 5, 10, 15 rounds).
   - Click **Save & Update Slot Machine**.
4. **Share With Someone**:
   - Click **"Share / Email"**.
   - Click **"Send Link via Email"** to launch a pre-composed message with the complete exercise list and direct machine link.
   - Or click **"Copy"** to share via chat or social media.
5. **Hit the Jackpot**:
   - Complete all rolls in your workout set to unlock the celebratory jackpot fanfare and confetti shower!

---

## 📄 License
MIT License. Created by [SwimmerPierce](https://github.com/SwimmerPierce).
