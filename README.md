# 🛡️ ATW • 3D Student Management System

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-38bdf8?style=for-the-badge&logo=github)](https://atwishere.github.io/3D-student-management-system/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Zero_Lag_FX-f59e0b?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

An executive-grade, ultra-responsive 3D Student Management & Gamified Attendance Platform. Designed to replace static spreadsheets with real-time 3D interactive spatial graphics, hardware-accelerated performance, responsive micro-synthesizer sound effects, and intelligent Excel synchronization.

---

## 🌟 What's New & Key Highlights

### 1. 🛡️ ATW Official Brand & Vector Identity
- **Custom Vector Emblem**: Handcrafted geometric hexagon shield with gold metallic gradients (`#f59e0b` to `#fbbf24`), cyan neon inner border (`#38bdf8`), star crest, and monogram **ATW** typography.
- **Dynamic Brand Insertion**: Vector favicon for browser tabs (`favicon.svg`), luxury animated hero badge in directory view, and header emblem in attendance ribbons.

### 2. 🏷️ Dynamic Page Identity in Title Bar & Tabs
Browser tabs dynamically adapt to provide clear context for administrators and teachers:
- **Main Directory**: `ATW • Student Directory`
- **Class Filtering**: `ATW • Class 10 Directory`
- **Fee Defaulters**: `ATW • Defaulters Directory`
- **Student Profile & Ledger**: `ATW • [Student Name] | Fee Records`
- **Attendance Register**: `ATW • Attendance Register (Class 10 A)`
- **3D Constellation Mode**: `ATW • 3D Constellation Attendance (Class 10 A)`
- **Bubble Popper Mode**: `ATW • Bubble Popper Attendance (Class 10 A)`
- **Falling Stars Mode**: `ATW • Falling Stars Attendance (Class 10 A)`
- **Target Practice Mode**: `ATW • Target Practice Attendance (Class 10 A)`

### 3. 🔊 Zero-Lag Web Audio Synthesizer Engine
- **0 KB Asset Overhead & 0 ms Audio Latency**: Generates real-time audio waveforms directly on browser audio threads via the native **Web Audio API**—no heavy audio files or network requests.
- **Celestial Present Chime (`playPresentSound`)**: Sparkling dual-harmonic bell sweep (A5 &rarr; E6) with shimmering harmonic decay.
- **Gentle Absent Tone (`playAbsentSound`)**: Soft, muted descent tone for unobtrusive marking.
- **Triumphant Complete Arpeggio (`playCompleteSound`)**: 5-note melodic cosmic chord (C5, E5, G5, B5, C6) when attendance is finished.
- **Micro-Click Haptic (`playClickSound`)**: Crisp UI feedback on toggles and button presses.
- **Ribbon Mute Toggle**: Dedicated `[ 🔊 Sound: ON ]` / `[ 🔇 Muted ]` button directly in the upper navigation bar.

### 4. ✨ Mystery 3D Constellation & Non-Repeating Shuffle
- **Secret Shape Masking**: Constellation shapes are masked as `Constellation #1 ❓`, `Constellation #2 ❓`, etc. The real shape name and polygonal lines remain completely hidden during attendance to preserve the surprise for students until the `✨ Complete` button is clicked.
- **Non-Repeating Random Shuffle**: The 🎲 Random button uses a deck shuffle algorithm without replacement—it cycles through every available mystery shape before repeating, ensuring every shape is seen at least once.
- **Non-Destructive `🔓 Resume / Edit`**: If attendance was completed accidentally or late students arrive, clicking `Resume / Edit` returns the stars to interactive marking mode **without erasing any marked attendance**.
- **Safe Class Transitions**: Switching classes dynamically clears the 3D visual constellation for the new class while **strictly preserving** all previously marked attendance records across all other classes.
- **Single-Side Orderly Absent Star Columns**: Absent students are positioned in a neat, evenly spaced vertical column on the right side (`x = 16.5`), perfectly visible with uniform distance between each star and no clumping or splitting.

### 5. ⚡ Eco Mode (Super Fast & ON by Default)
- **High-Performance 60+ FPS**: Clamps Device Pixel Ratio (`dpr = 1`), reduces polygon segment counts on 3D spheres from 64 &rarr; 24-32, and bypasses heavy post-processing Bloom passes in Eco Mode.
- **Persistent State**: Eco mode preferences are automatically synced and remembered across browser sessions via `localStorage`.

### 6. 📐 Streamlined Compact Layout
- **Single-Line Upper Ribbon**: Navigation back link, class dropdown, batch selector, date picker, live counter stats (`Total`, `P`, `A`), game switch, Eco mode toggle, Sound toggle, Register/Game toggle, and Excel export all reside in a single sleek ribbon.
- **Minimizable Lower HUD**: 3D control bar can be collapsed into a floating pill (`▼ Min` and `▲ Controls`) to maximize visual screen space for large classroom displays and projectors.

---

## 🚀 Core Features & Architectural Modules

### 📂 Intelligent Universal Excel Parser (`excelParser.js`)
- **Auto-Detection**: Scans uploaded `.xls` / `.xlsx` files and isolates true student master records while ignoring summary rows and dashboards.
- **Fuzzy Column Guessing**: Identifies name, class, section, batch, and identifier columns (Book No, Roll No, Admission No).
- **Interactive Mapping Confirmation Modal**: Allows teachers to verify or override column assignments before data is imported.
- **Auto-Sync Fee Installments**: Automatically extracts installment columns (`1 INSTALL`, `2 INSTALL`, etc.) and pre-populates fee statuses.

### 🔮 3D Interactive Fee Management (`FeeModal.jsx`)
- **Interactive Golden Orbs**: Fees visualized as floating 3D spheres that transition from frosted glass (Unpaid) to reflective metallic gold (Paid).
- **Adaptive Geometries**: Automatically switches from linear track layouts (1-5 installments) to floating circular orbits for annual plans (up to 24 installments).
- **Silver Data Breakdown Orbs**: Unbound canvas breakout technique displays sheet origin and roll numbers outside standard modal frames.
- **Admin Configuration**: Dynamically adjust global fee structures and base amounts for instant recalculation.

### 🎮 Gamified 3D Attendance Engines (`AttendanceSystem.jsx`)
- **✨ 3D Constellation Attendance (`ConstellationGame.jsx`)**: Students appear as floating stars. Marking present joins them into mystery celestial geometry with non-repeating shape shuffles and single-side absent columns.
- **🎆 Festive Crackers Attendance (`FallingStarsGame.jsx`)**: Interactive nocturnal celebration featuring a 3D Firecracker Shack and Master at bottom-right, student palette launcher, 40+ authentic high-contrast firework effects, ascending rockets with ascent whistle, apex burst with expanding radial spark physics, glowing 3D celebration student typography in the sky, and persistent floating festive lanterns.
- **🫧 Bubble Popper Attendance (`BubblePopperGame.jsx`)**: Students float in iridescent bubbles that pop on attendance confirmation.
- **🎯 Target Practice Attendance (`TargetPracticeGame.jsx`)**: High-performance canvas-cached arcade archery target board.
- **Merge Mode**: Combine multiple sections (e.g. `10 A`, `10 B`) into a unified register while cleanly partitioning saved records.

### 📊 School Directory & Defaulters System (`App.jsx`)
- **Compound Filters**: Filter simultaneously by Category, Class, Section, Batch, and text search with instant results.
- **Defaulters Isolation Filter**: Instantly isolate students who are either **Absent Today** OR have **Unpaid Fee Dues**.
- **Clean Excel Export**: Generates clean `.xlsx` reports stripped of internal flags for official school administrative records.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 8 |
| **3D Graphics Engine** | Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`) |
| **Shaders & Postprocessing** | `@react-three/postprocessing` |
| **Audio Synthesizer** | Native Web Audio API (OscillatorNode, GainNode, BiquadFilterNode) |
| **Animations & UI** | Framer Motion |
| **Data Importer / Exporter** | SheetJS (`xlsx`) |
| **Iconography** | Lucide React |

---

## 💻 Local Development & One-Click Launch

### Quick Launch on Windows
Simply double-click the included batch launcher:
```bat
Start_Attendance.bat
```
*(Automatically checks environment, starts Vite dev server, and opens your default browser at `http://localhost:5555`).*

### Manual Installation & Running
1. Clone the repository:
   ```bash
   git clone https://github.com/ATWISHERE/3D-student-management-system.git
   cd 3D-student-management-system
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

---

## 🎯 Keyboard & Mouse Controls

- **Left Click**: Mark Present / Toggle status.
- **Right Click**: Mark Absent (in 3D game views).
- **Left Click + Drag**: Orbit / Rotate 3D perspective.
- **Right Click + Drag**: Pan camera in 3D scene.
- **Scroll Wheel**: Zoom in and out.
- **`▼ Min` / `▲ Controls`**: Minimize or restore HUD controls.

---

## 📄 License & Attribution

Developed with ❤️ by **Abdul Tarique Warsi (ATW)**.  
Open-source under the [MIT License](LICENSE).
