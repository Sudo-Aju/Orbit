import * as SQLite from 'expo-sqlite';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, G, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2.2;
const SUN_RADIUS = 35;

export default function OrbitScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [globalTime, setGlobalTime] = useState(0);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedOrbit, setSelectedOrbit] = useState(1);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const database = await SQLite.openDatabaseAsync('orbit_v1.db');
        setDb(database);

        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            orbit_level INTEGER
          );
        `);

        const result = await database.getAllAsync('SELECT * FROM tasks');
        setTasks(result);
      } catch (e) {
        console.log("Error setting up DB:", e);
      }
    }
    setup();
    startGameLoop();
  }, []);

  const requestRef = useRef<number>(0);

  const startGameLoop = () => {
    const animate = () => {
      setGlobalTime(prev => prev + 0.002);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };

  const refreshTasks = async () => {
    if (db) {
      const result = await db.getAllAsync('SELECT * FROM tasks');
      setTasks(result);
    }
  };

  const addTask = async () => {
    if (!newTaskText || !db) return;

    await db.runAsync('INSERT INTO tasks (title, orbit_level) VALUES (?, ?)', [newTaskText, selectedOrbit]);
    setNewTaskText("");
    refreshTasks();
  };

  const completeTask = async (id: number) => {
    if (!db) return;
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    setSelectedTask(null);
    refreshTasks();
  };

  const renderSolarSystem = () => {
    return tasks.map((task, index) => {
      const orbitRadius = 50 + (task.orbit_level * 45);
      const speed = 15 / orbitRadius;
      const angle = (index * 2) + (globalTime * speed * 100);

      const x = CENTER_X + orbitRadius * Math.cos(angle);
      const y = CENTER_Y + orbitRadius * Math.sin(angle);

      const colors = ["#ff4757", "#ffa502", "#f1c40f", "#2ecc71", "#3742fa"];
      const planetColor = colors[task.orbit_level - 1] || "#ccc";

      return (
        <G key={task.id} onPress={() => setSelectedTask(task)}>
          <Circle
            cx={CENTER_X} cy={CENTER_Y} r={orbitRadius}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none"
          />
          <Circle
            cx={x} cy={y} r={10}
            fill={planetColor} stroke="rgba(255,255,255,0.8)" strokeWidth={1}
          />
          <SvgText
            x={x + 14} y={y + 4} fill="#aaa" fontSize="10" fontWeight="bold"
          >
            {task.title.length > 8 ? task.title.substring(0, 8) + ".." : task.title}
          </SvgText>
        </G>
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>ORBIT</Text>
        <Text style={styles.subtitle}>{tasks.length} Active Missions</Text>
      </View>

      <View style={styles.orbitContainer}>
        <Svg height={height * 0.65} width={width}>
          <Defs>
            <RadialGradient id="sunGrad" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#ffdd59" stopOpacity="1" />
              <Stop offset="100%" stopColor="#ffa502" stopOpacity="0.8" />
            </RadialGradient>
          </Defs>

          <Circle cx={CENTER_X} cy={CENTER_Y} r={SUN_RADIUS} fill="url(#sunGrad)" />
          <Circle cx={CENTER_X} cy={CENTER_Y} r={SUN_RADIUS + 10} fill="#ffa502" opacity={0.2} />

          {renderSolarSystem()}
        </Svg>
      </View>

      <View style={styles.controls}>
        <View style={styles.orbitSelector}>
          <Text style={styles.controlLabel}>ORBIT LEVEL (Urgency)</Text>
          <View style={styles.orbitBtns}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.lvlBtn, selectedOrbit === lvl && styles.lvlBtnActive]}
                onPress={() => setSelectedOrbit(lvl)}
              >
                <Text style={[styles.lvlText, selectedOrbit === lvl && styles.lvlTextActive]}>{lvl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
      </View>

      <Modal transparent animationType="fade" visible={!!selectedTask} onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {selectedTask && (
              <>
                <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>Orbit Level {selectedTask.orbit_level}</Text>
                </View>
                <Text style={styles.modalDesc}>
                  {selectedTask.orbit_level === 1 ? "⚠️ Critical orbit. High velocity." : "Standard orbit."}
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
  container: { flex: 1, backgroundColor: '#1e272e' },
  header: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center' },
  title: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: 5 },
  subtitle: { color: '#808e9b', fontSize: 14, letterSpacing: 1 },
  orbitContainer: { flex: 1 },
  controls: { backgroundColor: '#2f3640', padding: 20, paddingBottom: 100, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  controlLabel: { color: '#808e9b', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  orbitSelector: { marginBottom: 15 },
  orbitBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  lvlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e272e', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#485460' },
  lvlBtnActive: { backgroundColor: '#ffa502', borderColor: '#ffa502' },
  lvlText: { color: '#808e9b', fontWeight: 'bold' },
  lvlTextActive: { color: '#1e272e' },
  inputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#1e272e', borderRadius: 12, color: 'white', paddingHorizontal: 15, height: 50, marginRight: 10, borderWidth: 1, borderColor: '#485460' },
  launchBtn: { backgroundColor: '#0be881', borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20 },
  launchText: { color: '#1e272e', fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '85%', backgroundColor: '#2f3640', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  modalBadge: { backgroundColor: '#485460', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, marginTop: 10 },
  modalBadgeText: { color: '#d2dae2', fontSize: 12, fontWeight: 'bold' },
  modalDesc: { color: '#808e9b', textAlign: 'center', marginVertical: 20 },
  completeBtn: { backgroundColor: '#0be881', width: '100%', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  completeText: { color: '#1e272e', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { padding: 10 },
  closeText: { color: '#808e9b' }
});