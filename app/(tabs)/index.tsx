import * as SQLite from 'expo-sqlite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, LayoutAnimation, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2.2;
const SUN_RADIUS = 35;

const StarField = React.memo(() => {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      key: i,
      x: Math.random() * width,
      y: Math.random() * height * 0.8,
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
  const [subTasks, setSubTasks] = useState<any[]>([]); // New state for moons
  const [globalTime, setGlobalTime] = useState(0);
  const [newTaskText, setNewTaskText] = useState("");

  const [selectedDuration, setSelectedDuration] = useState(3600000);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [isControlsMinimized, setIsControlsMinimized] = useState(false);

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newSubTaskText, setNewSubTaskText] = useState(""); // Input for subtask modal
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  const [animatingIds, setAnimatingIds] = useState<number[]>([]);

  useEffect(() => {
    async function setup() {
      try {
        const database = await SQLite.openDatabaseAsync('orbit_v8_moons.db');
        setDb(database);

        // Create Main Table
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            deadline INTEGER
          );
        `);

        // Create Subtasks Table
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS subtasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_id INTEGER,
            title TEXT,
            is_completed INTEGER DEFAULT 0
          );
        `);

        refreshData(database);
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
        if (task.deadline <= now - 2000) {
          deleteTaskCascade(task.id);
        }
      });
    }
  }, [globalTime]);

  const refreshData = async (database = db) => {
    if (database) {
      const tasksResult = await database.getAllAsync('SELECT * FROM tasks');
      const subTasksResult = await database.getAllAsync('SELECT * FROM subtasks');
      setTasks(tasksResult);
      setSubTasks(subTasksResult);
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

    if (result.lastInsertRowId) {
      setAnimatingIds(prev => [...prev, result.lastInsertRowId]);
      setTimeout(() => {
        setAnimatingIds(prev => prev.filter(id => id !== result.lastInsertRowId));
      }, 1000);
    }

    setNewTaskText("");
    if (isCustomMode) setCustomHours("");
    refreshData();
  };

  const addSubTask = async () => {
    if (!newSubTaskText || !selectedTask || !db) return;
    await db.runAsync('INSERT INTO subtasks (parent_id, title) VALUES (?, ?)', [selectedTask.id, newSubTaskText]);
    setNewSubTaskText("");
    refreshData();
  }

  const toggleSubTask = async (subId: number, currentStatus: number) => {
    if (!db) return;
    const newStatus = currentStatus === 1 ? 0 : 1;
    await db.runAsync('UPDATE subtasks SET is_completed = ? WHERE id = ?', [newStatus, subId]);
    refreshData();
  }

  const deleteTaskCascade = async (id: number) => {
    if (!db) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    // Delete subtasks first
    await db.runAsync('DELETE FROM subtasks WHERE parent_id = ?', [id]);
    // Delete parent
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);

    if (selectedTask?.id === id) setSelectedTask(null);
    refreshData();
  };

  const toggleControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsControlsMinimized(!isControlsMinimized);
  }

  const renderSolarSystem = () => {
    return tasks.map((task, index) => {
      // 1. Planet Physics
      const timeRemaining = task.deadline - globalTime;
      const hoursRemaining = Math.max(0, timeRemaining / (1000 * 60 * 60));

      let orbitRadius = SUN_RADIUS + 25 + (hoursRemaining * 6);
      if (orbitRadius > width / 2 - 20) orbitRadius = width / 2 - 20;

      if (timeRemaining < 0) {
        orbitRadius = Math.max(0, SUN_RADIUS * (1 - Math.abs(timeRemaining) / 2000));
      }

      const planetAngle = (index * 2) + (globalTime * 0.0002);
      const planetX = CENTER_X + orbitRadius * Math.cos(planetAngle);
      const planetY = CENTER_Y + orbitRadius * Math.sin(planetAngle);

      // 2. Planet Visuals
      const isWarpingIn = animatingIds.includes(task.id);
      let planetSize = 8 + (hoursRemaining < 1 ? (Math.sin(globalTime / 200) * 2 + 2) : 0);
      if (isWarpingIn) planetSize = 0;
      if (timeRemaining < 0) planetSize = Math.max(0, 8 * (1 - Math.abs(timeRemaining) / 2000));

      // 3. Render Moons (Subtasks)
      const myMoons = subTasks.filter(st => st.parent_id === task.id && st.is_completed === 0);

      const renderMoons = () => {
        return myMoons.map((moon, mIndex) => {
          const moonOrbitRadius = 15; // Distance from planet
          const moonSpeed = 0.002; // Faster than planet
          const moonAngle = (mIndex * (Math.PI * 2 / myMoons.length)) + (globalTime * moonSpeed);

          const moonX = planetX + moonOrbitRadius * Math.cos(moonAngle);
          const moonY = planetY + moonOrbitRadius * Math.sin(moonAngle);

          return (
            <Circle
              key={`moon_${moon.id}`}
              cx={moonX}
              cy={moonY}
              r={2}
              fill="#bdc3c7"
              opacity={timeRemaining > 0 ? 0.8 : 0}
            />
          );
        });
      };

      return (
        <G key={task.id} onPress={() => setSelectedTask(task)}>
          {timeRemaining > 0 && (
            <Circle
              cx={CENTER_X} cy={CENTER_Y} r={orbitRadius}
              stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none"
            />
          )}

          {/* Draw Moons first so they go behind planet sometimes (simple z-index via order) */}
          {timeRemaining > 0 && renderMoons()}

          <G transform={`translate(${planetX}, ${planetY})`}>
            <Circle r={planetSize} fill={`url(#grad_${task.id % 5})`} />
            <Circle r={planetSize} stroke="rgba(255,255,255,0.4)" strokeWidth={1} opacity={0.5} />
          </G>

          {timeRemaining > 0 && (
            <SvgText
              x={planetX + 12} y={planetY + 4} fill="#aaa" fontSize="10" fontWeight="bold" opacity={0.8}
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

  const sunPulse = 1 + Math.sin(globalTime / 800) * 0.05;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>ORBIT</Text>
        <Text style={styles.subtitle}>{tasks.length} Systems Active</Text>
      </View>

      <View style={styles.orbitContainer}>
        <Svg height={height * 0.75} width={width}>
          <Defs>
            <RadialGradient id="sunGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#ffdd59" stopOpacity="1" />
              <Stop offset="70%" stopColor="#ffa502" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#ff4757" stopOpacity="0" />
            </RadialGradient>

            <RadialGradient id="grad_0" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#ff6b81" stopOpacity="1" />
              <Stop offset="100%" stopColor="#c0392b" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="grad_1" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#f1c40f" stopOpacity="1" />
              <Stop offset="100%" stopColor="#e67e22" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="grad_2" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#f1c40f" stopOpacity="1" />
              <Stop offset="100%" stopColor="#f39c12" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="grad_3" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#2ecc71" stopOpacity="1" />
              <Stop offset="100%" stopColor="#27ae60" stopOpacity="1" />
            </RadialGradient>
            <RadialGradient id="grad_4" cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#3742fa" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0984e3" stopOpacity="1" />
            </RadialGradient>
          </Defs>

          <StarField />

          <G transform={`translate(${CENTER_X}, ${CENTER_Y}) scale(${sunPulse})`}>
            <Circle cx={0} cy={0} r={SUN_RADIUS} fill="url(#sunGrad)" />
            <Circle cx={0} cy={0} r={SUN_RADIUS + 15} fill="#ffa502" opacity={0.15} />
            <Circle cx={0} cy={0} r={SUN_RADIUS + 30} fill="#ffa502" opacity={0.05} />
          </G>

          {renderSolarSystem()}
        </Svg>
      </View>

      <View style={[styles.controls, isControlsMinimized && styles.controlsMinimized]}>

        <TouchableOpacity
          style={styles.handleBar}
          onPress={toggleControls}
        >
          <View style={styles.handleIcon} />
          <Text style={styles.handleText}>{isControlsMinimized ? "ADD MISSION" : "MINIMIZE"}</Text>
        </TouchableOpacity>

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
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                  <TouchableOpacity onPress={() => setSelectedTask(null)}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>
                    {getFormatTime(selectedTask.deadline - Date.now())}
                  </Text>
                </View>

                {/* SUBTASKS SECTION */}
                <View style={styles.subtaskList}>
                  <Text style={styles.subtaskHeader}>MOONS (Sub-tasks)</Text>

                  <FlatList
                    data={subTasks.filter(s => s.parent_id === selectedTask.id)}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.subtaskItem}
                        onPress={() => toggleSubTask(item.id, item.is_completed)}
                      >
                        <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]} />
                        <Text style={[styles.subtaskText, item.is_completed && styles.subtaskTextDone]}>
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptySub}>No moons yet.</Text>}
                    style={{ maxHeight: 150 }}
                  />

                  {/* Add Subtask Input */}
                  <View style={styles.subtaskInputRow}>
                    <TextInput
                      style={styles.subtaskInput}
                      placeholder="+ Add Moon..."
                      placeholderTextColor="#555"
                      value={newSubTaskText}
                      onChangeText={setNewSubTaskText}
                    />
                    {newSubTaskText.length > 0 && (
                      <TouchableOpacity onPress={addSubTask}>
                        <Text style={styles.addSubText}>ADD</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={styles.completeBtn} onPress={() => deleteTaskCascade(selectedTask.id)}>
                  <Text style={styles.completeText}>COMPLETE MISSION</Text>
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
  container: { flex: 1, backgroundColor: '#0c0c14' },
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
  modalBox: { width: '90%', backgroundColor: '#1e2029', borderRadius: 25, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', flex: 1 },
  closeText: { color: '#808e9b', fontSize: 24, fontWeight: 'bold', padding: 5 },

  modalBadge: { alignSelf: 'flex-start', backgroundColor: '#2a2d3a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 5, marginBottom: 20 },
  modalBadgeText: { color: '#d2dae2', fontSize: 12, fontWeight: 'bold' },

  subtaskList: { marginBottom: 20, backgroundColor: '#15171e', padding: 15, borderRadius: 15 },
  subtaskHeader: { color: '#808e9b', fontSize: 10, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  subtaskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 6, borderWidth: 2, borderColor: '#485460', marginRight: 10 },
  checkboxChecked: { backgroundColor: '#0be881', borderColor: '#0be881' },
  subtaskText: { color: '#d2dae2', fontSize: 14 },
  subtaskTextDone: { color: '#555', textDecorationLine: 'line-through' },
  emptySub: { color: '#444', fontStyle: 'italic', marginBottom: 10 },

  subtaskInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, borderTopWidth: 1, borderTopColor: '#2a2d3a', paddingTop: 10 },
  subtaskInput: { flex: 1, color: 'white', fontSize: 14 },
  addSubText: { color: '#0be881', fontWeight: 'bold', paddingLeft: 10 },

  completeBtn: { backgroundColor: '#0be881', width: '100%', paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  completeText: { color: '#1e272e', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});