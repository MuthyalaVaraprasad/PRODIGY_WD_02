# ChronoSync | Advanced Time Analytics & Stopwatch Dashboard

ChronoSync is an ultra-modern, highly interactive, and responsive web application that combines a high-precision **Stopwatch**, a **Countdown Timer** with customizable presets, a **Digital World Clock & Alarm Planner**, and a real-time **Lap Analytics Dashboard** featuring dynamic SVG chart trend plotting.

Built entirely using vanilla web technologies (HTML5, CSS3, and ES6+ JavaScript), it offers a premium glassmorphic visual aesthetic, five customizable color themes, keyboard hotkeys, and synthesised sound effects generated programmatically via the Web Audio API.

### 🌐 Live Demo: https://stopwatchweb-ochre.vercel.app/

---

## 🚀 Key Features

### ⏱️ 1. High-Precision Stopwatch
- **Accuracy Engine**: Measures timing intervals using high-resolution timestamp deltas (`performance.now()`). This prevents internal timing drift, ensuring absolute accuracy even when the application runs in background browser tabs.
- **Micro-Millisecond Precision**: Shows hours, minutes, seconds, and milliseconds cleanly.
- **Dynamic Circular Progress Dial**: Features an outer progress ring that sweeps smoothly in synchronization with seconds.
- **Delta Comparison Tracking**: Automatically computes and highlights split time variations between successive laps in red (slower split) or green (faster split).

### 📊 2. Lap Analytics & SVG Trend Charts
- **Interactive SVG Chart**: Dynamically renders a line-trend graph tracing lap times. Hovering over graph points displays tooltips indicating exact split times.
- **Metrics Dashboard**: Computes and highlights real-time stats:
  - **Fastest Lap** (automatically highlighted in the lap history table).
  - **Slowest Lap** (automatically highlighted in the lap history table).
  - **Average Lap time**.
  - **Total Lap count**.
- **Data Portability**: Allows users to export the recorded session history directly to a `.csv` spreadsheet file with one click.

### ⏳ 3. Countdown Timer
- **Custom Pickers**: Features a responsive numeric scroll picker to configure custom hours, minutes, and seconds.
- **Quick Presets**: Set common timers with a single click: 1 Min, 5 Min, 10 Min, and 25 Min (Pomodoro).
- **Time Indicators**: Dials glow and transition to pulsing warning states when the countdown drops below 10 seconds.
- **Alarm Alert**: Completing a countdown triggers a flashing full-screen red warning border and plays a synthesised chime melody.

### 🔔 4. World Clock & Alarm Planner
- Renders local system time in 12-hour (AM/PM) format with a long date banner.
- Allows scheduling multiple named alarms that match the system clock to trigger fullscreen alert banners.

### 🎨 5. Premium Multi-Theme Engine
Instantly switch between five visual palettes:
1. **Glassmorphism (Dark)**: Frosted card layouts over an elegant indigo-violet background.
2. **Glassmorphism (Light)**: High-contrast light frosted cards on soft lavender gradients.
3. **Cyberpunk Neon**: Retro grids with glowing pink card borders and electric cyan text.
4. **Forest Emerald**: Calming mint highlights on abyssal green gradients.
5. **Deep Ocean**: Abyssal navy backgrounds with glowing aqua cyan details.

### 🎵 6. Web Audio API Synthesis
Uses the browser's native Audio Context to programmatically synthesize sound waves for user interactions. Eliminates external `.mp3` loading errors:
- **Click**: High-frequency mechanical selector chime.
- **Lap**: Bell chime.
- **Reset**: Low-frequency descending whoosh sweep.
- **Record**: Upward arpeggio melody (C5 ➔ E5 ➔ G5 ➔ C6) triggered when breaking a fastest-lap split record.
- **Second Ticks**: Optional metronome toggle in the sidebar that ticks like a mechanical clock while timers run.
- **Alarm siren**: Dual-tone alternating melody.

---

## ⌨️ Keyboard Shortcuts

Interact with the dashboard efficiently using keyboard hotkeys:

| Key | Action | Context |
| :--- | :--- | :--- |
| <kbd>Spacebar</kbd> | Play / Pause | Starts or stops the active Stopwatch/Timer |
| <kbd>L</kbd> | Record Lap | Pins a new split lap (Stopwatch mode only) |
| <kbd>R</kbd> | Reset / Cancel | Resets active stopwatch or cancels active countdown |
| <kbd>Escape</kbd> | Dismiss Alarm | Closes active timer or clock alarm alert screen overlay |

---

## 📂 Project Structure

```
c:\Users\Varaprasad\OneDrive\Desktop\PRODIGY_WD_02/
├── index.html          # Semantic HTML5 Layout & Settings controls
├── style.css           # Design System variables, grid sheets, responsive queries & animations
├── app.js              # State Controllers, Web Audio Synthesizer, SVG Charts & Local Storage
└── README.md           # Professional project documentation
```

---

## 🛠️ Installation & Usage

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MuthyalaVaraprasad/PRODIGY_WD_02.git
   ```
2. **Navigate to the Directory**:
   ```bash
   cd PRODIGY_WD_02
   ```
3. **Launch the Application**:
   - Double-click `index.html` to open it in any modern web browser (Chrome, Firefox, Safari, Edge).
   - Alternatively, serve it locally using a static server:
     ```bash
     npx http-server .
     ```
