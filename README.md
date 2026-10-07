# 🎓 Next-Gen 3D Student Management System

A highly interactive, visually stunning, and premium React-based Student Management System designed to modernize school administration. This application leverages **React**, **Vite**, **Framer Motion**, and **Three.js / React Three Fiber** to transform boring spreadsheets into a fluid, gamified, and offline-capable 3D experience.

---

## 🌟 Core Features & Architecture

### 1. 🧠 Intelligent Excel Data Importer (The "Genius" Parser)
*   **Smart Sheet Detection:** Automatically scans uploaded `.xlsx` files and isolates the true master list (e.g., prioritizing `ALL STUDENTS` sheets while intelligently ignoring Dashboards, Raw Entries, or Summaries).
*   **Fuzzy Header Mapping:** Uses heuristic scanning to automatically identify and map columns for Name, Class, Section, and Custom Identifiers (Roll No, UID, Fee Book No).
*   **Auto-Sync Fee Engine:** Scans the uploaded Excel file for installment columns (e.g., `1 INSTALL`, `2 INSTALL`) and instantly pre-populates the 3D database with the student's paid/unpaid status natively.

### 2. 🔮 3D Interactive Fee Management (`FeeModal.jsx`)
*   **Golden Installment Orbs:** Fees are visualized as floating, interactive 3D spheres. Clicking an orb triggers a distortion animation, swapping its material from a frosty glass (Unpaid) to a highly metallic, reflective Gold (Paid).
*   **Dynamic Spatial Layouts:** The 3D Canvas intelligently arranges orbs in a linear layout for standard fees (1-5 months) or transitions into a circular floating ring for annual layouts (up to 24 months).
*   **Unbound Silver Info Orbs:** Utilizes absolute Canvas breakout techniques to float Silver Metallic Data Orbs entirely outside the boundaries of the modal box, elegantly displaying the student's origin sheet and Unique Identifier.
*   **Global Admin Configuration:** A settings gear allows admins to instantly change the global fee structure (number of installments and base amount), recalculating dues dynamically for the entire school.

### 3. 🎮 Gamified Attendance System (`AttendanceSystem.jsx`)
*   **"Merge Mode" (Club/Combined Attendance):** Admins can dynamically merge multiple classes (e.g., `9-A`, `9-B`, `9-C`) into a single massive register. The system tracks attendance in the unified view but smartly partitions the saved data back into the correct individual class databases.
*   **Fluid 3-State Toggle:** A single forgiving UI button cycles instantly between `Mark All Present`, `Mark All Absent`, and `Clear/Reset All`.
*   **3D Minigames:** Takes the boredom out of attendance with interactive Three.js minigames:
    *   *Constellation Game:* Draw lines between 3D stars.
    *   *Bubble Popper:* Pop floating bubbles.
    *   *Falling Stars & Target Practice.*
*   **Historical Protection:** "Admin Edit Mode" toggle prevents accidental modification of past dates.

### 4. ⚡ High-Performance Directory & Engine (`App.jsx`)
*   **Infinite Stacking Filters:** Filter the student body by Category, Class, Section, and Text Search simultaneously with zero lag.
*   **Defaulters Engine:** A dedicated filter that instantly flags and isolates students who are either **Absent Today** OR have **Unpaid Fee Installments**.
*   **Smart Pagination:** Automatically chunks massive school databases into 50-student pages with smooth Previous/Next navigation to ensure maximum DOM performance.
*   **Excel Export:** Allows admins to export their *currently filtered view* (e.g., "Class 9 Defaulters") into a freshly generated, clean `.xlsx` file, automatically stripping internal tracking variables to keep the output pristine.

---

## 🎨 UI/UX & Aesthetics
*   **Premium Typography:** Combines classic `Cormorant Garamond` headers with ultra-clean modern sans-serif fonts.
*   **Glassmorphism & Micro-animations:** Uses `framer-motion` for buttery smooth layout transitions, modal scaling, and hover effects over a frosted-glass overlay.
*   **Offline-First:** Engineered to rely on an advanced `localStorage` caching architecture, meaning the app runs at lightning speed and works flawlessly even if the school loses internet connection.

---

## 🛠️ Technology Stack
*   **Frontend Framework:** React + Vite
*   **3D Rendering:** Three.js, `@react-three/fiber`, `@react-three/drei`
*   **Animations:** Framer Motion
*   **Data Processing:** SheetJS (`xlsx`)
*   **Icons:** Lucide React
