import * as SQLite from 'expo-sqlite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, LayoutAnimation, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2.2;
const SUN_RADIUS = 35;

// --- STARFIELD COMPONENT (Memoized for performance) ---
const StarField = React.memo(() => {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      key: i,
      x: Math.random() * width,
      y: Math.random() * height * 0.8, // Keep stars mostly in the upper view
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }));
  }, []);

  return (
    <>
      {stars.map((star) => (
        <Circle
          key={star.key}
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill="white"
          opacity={star.opacity}
        />
      ))}
    </>
  );
});

export default function OrbitScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [globalTime, setGlobalTime] = useState(0);
  const [newTaskText, setNewTaskText] = useState("");

  // Custom Time State
  const [selectedDuration, setSelectedDuration] = useState(3600000);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [isControlsMinimized, setIsControlsMinimized] = useState(false);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  // Animation State for "Warp In" effect
  const [animatingIds, setAnimatingIds] = useState<number[]>([]);

  useEffect(() => {
    async function setup() {
      try {
        const database = await SQLite.openDatabaseAsync('orbit_v7_visuals.db');
        setDb(database);

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            deadline INTEGER
          );
        `);

        const result = await database.getAllAsync('SELECT * FROM tasks');
        setTasks(result);
      } catch (e) {
        console.log(e);
      }
    }
    setup();
    startGameLoop();
  }, []);

  const requestRef = useRef<number>(0);

  const startGameLoop = () => {
    const animate = () => {
      setGlobalTime(Date.now());
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (tasks.length > 0 && db) {
      const now = Date.now();
      tasks.forEach(task => {
        // "Sun Eating" Logic: 
        // If deadline passed, we let it linger for 1 second (visual consumption) then delete
        if (task.deadline <= now - 2000) {
          db.runAsync('DELETE FROM tasks WHERE id = ?', [task.id]);
          setTasks(prev => prev.filter(t => t.id !== task.id));
        }
      });
    }
  }, [globalTime]);

  const refreshTasks = async () => {
    if (db) {
      const result = await db.getAllAsync('SELECT * FROM tasks');
      setTasks(result);
    }
  };

  const addTask = async () => {
    if (!newTaskText || !db) return;

    let duration = selectedDuration;
    if (isCustomMode) {
      const hours = parseFloat(customHours);
      if (isNaN(hours) || hours <= 0) return;
      duration = hours * 3600000;
    }

    const deadline = Date.now() + duration;

    const result = await db.runAsync('INSERT INTO tasks (title, deadline) VALUES (?, ?)', [newTaskText, deadline]);

    // Trigger "Warp In" animation for this new ID
    if (result.lastInsertRowId) {
      setAnimatingIds(prev => [...prev, result.lastInsertRowId]);
      // Remove from animating list after 1s
      setTimeout(() => {
        setAnimatingIds(prev => prev.filter(id => id !== result.lastInsertRowId));
      }, 1000);
    }

    setNewTaskText("");
    if (isCustomMode) setCustomHours("");
    refreshTasks();
  };

  const completeTask = async (id: number) => {
    if (!db) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    setSelectedTask(null);
    refreshTasks();
  };

  const toggleControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsControlsMinimized(!isControlsMinimized);
  }

  const renderSolarSystem = () => {
    return tasks.map((task, index) => {
      const timeRemaining = task.deadline - globalTime;
      const hoursRemaining = Math.max(0, timeRemaining / (1000 * 60 * 60));

      let orbitRadius = SUN_RADIUS + 20 + (hoursRemaining * 6);
      if (orbitRadius > width / 2 - 20) orbitRadius = width / 2 - 20;

      // SUN EATING ANIMATION: 
      // If timeRemaining is negative, spiral into the sun (radius -> 0)
      if (timeRemaining < 0) {
        orbitRadius = Math.max(0, SUN_RADIUS * (1 - Math.abs(timeRemaining) / 2000));
      }

      // Constant Velocity
      const angle = (index * 2) + (globalTime * 0.0002);

      const x = CENTER_X + orbitRadius * Math.cos(angle);
      const y = CENTER_Y + orbitRadius * Math.sin(angle);

      // Color Palette
      let planetColor = "#3742fa";
      if (hoursRemaining < 1) planetColor = "#ff4757";
      else if (hoursRemaining < 6) planetColor = "#ffa502";
      else if (hoursRemaining < 24) planetColor = "#f1c40f";
      else if (hoursRemaining < 48) planetColor = "#2ecc71";

      // Visual Effects
      const isWarpingIn = animatingIds.includes(task.id);
      let planetSize = 8 + (hoursRemaining < 1 ? (Math.sin(globalTime / 200) * 2 + 2) : 0);

      // Scale up if warping in
      if (isWarpingIn) {
        planetSize = 0; // The animation logic would ideally interpolate this, 
        // but for simple SVG without reanimated, we just let it appear. 
        // Let's rely on the pulse effect for visual interest instead.
      }

      // Sun Consumption Shrink
      if (timeRemaining < 0) planetSize = Math.max(0, 8 * (1 - Math.abs(timeRemaining) / 2000));

      return (
        <G key={task.id} onPress={() => setSelectedTask(task)}>
          {/* Track (Only show if alive) */}
          {timeRemaining > 0 && (
            <Circle
              cx={CENTER_X} cy={CENTER_Y} r={orbitRadius}
              stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"
            />
          )}

          {/* Planet Glow/Shadow Container */}
          <G transform={`translate(${x}, ${y})`}>
            {/* The Sphere Gradient */}
            <Circle r={planetSize} fill={`url(#grad_${task.id % 5})`} />

            {/* Rim Light (Simulated 3D) */}
            <Circle r={planetSize} stroke="rgba(255,255,255,0.4)" strokeWidth={1} opacity={0.5} />
          </G>

          {/* Label (Hide if being eaten) */}
          {timeRemaining > 0 && (
            <SvgText
              x={x + 12} y={y + 4} fill="#aaa" fontSize="10" fontWeight="bold" opacity={0.8}
            >
              {task.title.length > 8 ? task.title.substring(0, 8) + ".." : task.title}
            </SvgText>
          )}
        </G>
      );
    });
  };

  const durationOptions = [
    { label: "1h", ms: 3600000 },
    { label: "6h", ms: 21600000 },
    { label: "1d", ms: 86400000 },
    { label: "3d", ms: 259200000 },
    { label: "Custom", ms: -1 },
  ];

  const handleDurationSelect = (ms: number) => {
    if (ms === -1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      setSelectedDuration(ms);
    }
  }

  const getFormatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 24) return Math.floor(hours / 24) + " Days left";
    if (hours > 0) return hours + " Hours left";
    return mins + " Mins left";
  }

  // Calculate Sun Breathing
  const sunPulse = 1 + Math.sin(globalTime / 800) * 0.05;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>ORBIT</Text>
        <Text style={styles.subtitle}>{tasks.length} Active Missions</Text>
      </View>

      <View style={styles.orbitContainer}>
        <Svg height={height * 0.75} width={width}>
          <Defs>
            {/* Sun Gradient */}
            <RadialGradient id="sunGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#ffdd59" stopOpacity="1" />
              <Stop offset="70%" stopColor="#ffa502" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#ff4757" stopOpacity="0" />
            </RadialGradient>

            {/* Planet Gradients (Simple 3D effect) */}
            {/* Red */}
            <RadialGradient id="grad_0" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#ff6b81" stopOpacity="1" />
              <Stop offset="100%" stopColor="#c0392b" stopOpacity="1" />
            </RadialGradient>
            {/* Orange */}
            <RadialGradient id="grad_1" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#f1c40f" stopOpacity="1" />
              <Stop offset="100%" stopColor="#e67e22" stopOpacity="1" />
            </RadialGradient>
            {/* Yellow */}
            <RadialGradient id="grad_2" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#f1c40f" stopOpacity="1" />
              <Stop offset="100%" stopColor="#f39c12" stopOpacity="1" />
            </RadialGradient>
            {/* Green */}
            <RadialGradient id="grad_3" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#2ecc71" stopOpacity="1" />
              <Stop offset="100%" stopColor="#27ae60" stopOpacity="1" />
            </RadialGradient>
            {/* Blue */}
            <RadialGradient id="grad_4" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#3742fa" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0984e3" stopOpacity="1" />
            </RadialGradient>
          </Defs>

          <StarField />

          {/* The Sun (Breathing) */}
          <G transform={`translate(${CENTER_X}, ${CENTER_Y}) scale(${sunPulse})`}>
            {/* Inner Core */}
            <Circle cx={0} cy={0} r={SUN_RADIUS} fill="url(#sunGrad)" />
            {/* Outer Glow */}
            <Circle cx={0} cy={0} r={SUN_RADIUS + 15} fill="#ffa502" opacity={0.15} />
            <Circle cx={0} cy={0} r={SUN_RADIUS + 30} fill="#ffa502" opacity={0.05} />
          </G>

          {renderSolarSystem()}
        </Svg>
      </View>

      {/* CONTROLS CONTAINER */}
      <View style={[styles.controls, isControlsMinimized && styles.controlsMinimized]}>

        {/* Toggle Handle */}
        <TouchableOpacity
          style={styles.handleBar}
          onPress={toggleControls}
        >
          <View style={styles.handleIcon} />
          <Text style={styles.handleText}>{isControlsMinimized ? "ADD MISSION" : "MINIMIZE"}</Text>
        </TouchableOpacity>

        {/* Content (Hidden when minimized) */}
        {!isControlsMinimized && (
          <>
            <View style={styles.orbitSelector}>
              <Text style={styles.controlLabel}>DEADLINE</Text>
              <View style={styles.orbitBtns}>
                {durationOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.lvlBtn,
                      !isCustomMode && selectedDuration === opt.ms && styles.lvlBtnActive,
                      isCustomMode && opt.ms === -1 && styles.lvlBtnActive
                    ]}
                    onPress={() => handleDurationSelect(opt.ms)}
                  >
                    <Text style={[
                      styles.lvlText,
                      !isCustomMode && selectedDuration === opt.ms && styles.lvlTextActive,
                      isCustomMode && opt.ms === -1 && styles.lvlTextActive
                    ]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isCustomMode && (
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter Hours (e.g. 0.5 or 24)"
                  placeholderTextColor="#666"
                  value={customHours}
                  onChangeText={setCustomHours}
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="New Task Name..."
                placeholderTextColor="#666"
                value={newTaskText}
                onChangeText={setNewTaskText}
              />
              <TouchableOpacity style={styles.launchBtn} onPress={addTask}>
                <Text style={styles.launchText}>LAUNCH</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Modal transparent animationType="fade" visible={!!selectedTask} onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedTask && (
              <>
                <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>
                    {getFormatTime(selectedTask.deadline - Date.now())}
                  </Text>
                </View>
                <Text style={styles.modalDesc}>
                  {(selectedTask.deadline - Date.now()) < 3600000
                    ? "CRITICAL: Entering Sun's Atmosphere!"
                    : "Orbit stable."}
                </Text>
                <TouchableOpacity style={styles.completeBtn} onPress={() => completeTask(selectedTask.id)}>
                  <Text style={styles.completeText}>COMPLETE MISSION</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTask(null)}>
                  <Text style={styles.closeText}>CLOSE</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c14' }, // Darker background for space
  header: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center' },
  title: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: 5 },
  subtitle: { color: '#808e9b', fontSize: 14, letterSpacing: 1 },
  orbitContainer: { flex: 1 },

  controls: { backgroundColor: '#1e2029', padding: 20, paddingBottom: 100, borderTopLeftRadius: 30, borderTopRightRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.5, shadowRadius: 10 },
  controlsMinimized: { paddingBottom: 30, height: 90 },

  handleBar: { alignItems: 'center', paddingBottom: 15, marginBottom: 5 },
  handleIcon: { width: 40, height: 4, backgroundColor: '#485460', borderRadius: 2, marginBottom: 5 },
  handleText: { color: '#808e9b', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  controlLabel: { color: '#808e9b', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  orbitSelector: { marginBottom: 15 },
  orbitBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  lvlBtn: { width: 60, height: 40, borderRadius: 12, backgroundColor: '#2a2d3a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#485460' },
  lvlBtnActive: { backgroundColor: '#ffa502', borderColor: '#ffa502' },
  lvlText: { color: '#808e9b', fontWeight: 'bold', fontSize: 12 },
  lvlTextActive: { color: '#1e272e' },
  customRow: { marginBottom: 15 },
  customInput: { backgroundColor: '#2a2d3a', borderRadius: 12, color: '#ffa502', paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#ffa502' },
  inputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#2a2d3a', borderRadius: 15, color: 'white', paddingHorizontal: 20, height: 55, marginRight: 10, borderWidth: 1, borderColor: '#485460' },
  launchBtn: { backgroundColor: '#0be881', borderRadius: 15, justifyContent: 'center', paddingHorizontal: 20 },
  launchText: { color: '#1e272e', fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#1e2029', borderRadius: 25, padding: 30, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  modalTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  modalBadge: { backgroundColor: '#2a2d3a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 15 },
  modalBadgeText: { color: '#d2dae2', fontSize: 12, fontWeight: 'bold' },
  modalDesc: { color: '#808e9b', textAlign: 'center', marginVertical: 25, fontSize: 16 },
  completeBtn: { backgroundColor: '#0be881', width: '100%', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  completeText: { color: '#1e272e', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  closeBtn: { padding: 10 },
  closeText: { color: '#808e9b' }
});