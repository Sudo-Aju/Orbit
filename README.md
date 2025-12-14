# Orbit

Orbit is a gamified task management application that visualizes your productivity as a dynamic solar system. Built with **React Native** and **Expo**, it turns your to-do list into an engaging space exploration experience where tasks are planets and subtasks are moons.

## Features

### Interactive Solar System 
- **Tasks as Planets**: Every task you create becomes a planet orbiting the central sun.
- **Dynamic Orbits**: The distance and speed of orbit depend on the task's deadline. Urgent tasks orbit closer!
- **Visual Urgency**: Planets change size and position as deadlines approach, giving you an intuitive sense of time.

### Mission Control
- **Create Missions**: distinct tasks with specific durations (1h, 6h, 1 day, 3 days, or Custom).
- **Subtasks as Moons**: Break down large tasks into subtasks. These appear as moons orbiting their parent planet.
- **Mass Absorption**: Completing subtasks causes your planet to grow in size as it "absorbs mass," visually rewarding your progress.

### Technical Highlights
- **Persistant Storage**: Powered by **SQLite** (`expo-sqlite`) to ensure your missions are saved effectively.
- **High-Performance Graphics**: Utilizes **react-native-svg** for rendering 60fps animations of the starfield, orbits, and planetary bodies.
- **Smooth Animations**: Integrated `LayoutAnimation` and `requestAnimationFrame` for fluid UI transitions and game loops.
- **Haptic Feedback & Gestures**: Tactile responses for a premium mobile feel.

## 🛠 Tech Stack

- **Framework**: React Native (via Expo)
- **Language**: TypeScript
- **Database**: SQLite
- **Graphics**: React Native SVG
- **Navigation**: Expo Router (File-based routing)

## Screens

1.  **Orbit Dashboard**: The main view featuring your personalized solar system. Watch your tasks orbit in real-time.
2.  **Task Detail (Modal)**: Tap on any planet to open the detailed view. Here you can:
    -   View time remaining.
    -   Manage subtasks (Moons).
    -   See "Mass Absorbed" progress.
    -   Complete the mission (delete the task).
3.  **Controls**: A collapsible bottom sheet to quickly add new missions (tasks) without losing sight of your galaxy.

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run the App**
    ```bash
    npx expo start
    ```

3.  **Explore**
    -   Open on **Android Emulator**, **iOS Simulator**, or your physical device using **Expo Go**.

## Future Roadmap (Ideas)
-   **Collision Events**: Tasks colliding if deadlines overlap?
-   **Theme Unlockables**: Different solar systems for high productivity.
-   **Long-term Stats**: a "Galaxy Map" of completed projects.

---

*Built using Expo.*
