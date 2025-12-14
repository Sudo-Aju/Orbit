import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, FlatList, KeyboardAvoidingView, LayoutAnimation, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2.2;
const SUN_RADIUS = 35;
const BASE_SPEED = 0.0002;
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success') => {
  if (Platform.OS === 'web') return;
  switch (type) {
    case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
    case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
  }
};
const getCategoryPalette = (cat: string) => {
  const predefined: { [key: string]: string[] } = {
    "Work": ["#ff4757", "#c0392b"],  
    "Personal": ["#f1c40f", "#f39c12"],  
    "Health": ["#ffffff", "#dfe6e9"],  
    "Ideas": ["#ffa502", "#e67e22"],  
    "General": ["#f7f1e3", "#d1ccc0"]  
  };
  if (predefined[cat]) return predefined[cat];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  const hues = [0, 30, 45, 60];
  const hue = hues[Math.abs(hash) % hues.length];
  const color = `hsl(${hue}, 90%, 60%)`;
  return [color, color];
}
const CutsceneOverlay = ({ type, taskType, color, onFinish }: { type: 'launch' | 'destroy', taskType?: 'planet' | 'comet' | 'satellite', color: string, onFinish: () => void }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const objectAnim = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    triggerHaptic(type === 'launch' ? 'success' : 'heavy');
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,  
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ])
    ).start();
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(objectAnim, {
          toValue: 1,
          duration: type === 'launch' ? 2500 : 1500,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true
        })
      ]),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => onFinish());
  }, []);
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const reverseSpin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const flameFlicker = shakeAnim.interpolate({ inputRange: [-2, 2], outputRange: [0.8, 1.2] });
  const rocketTranslate = objectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.5, -height]  
  });
  const planetFormScale = objectAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1.5] });
  const planetOpacity = objectAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 1, 1] });
  const cometTranslateX = objectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.6, width * 0.6]  
  });
  const cometTranslateY = objectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.3, -height * 0.3]  
  });
  const tailStretch = objectAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 1] });
  const explosionScale = objectAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 3, 0]  
  });
  const renderVisual = () => {
    if (type === 'destroy') {
      return (
        <Animated.View style={{ transform: [{ scale: explosionScale }] }}>
          <Svg height={200} width={200} viewBox="-100 -100 200 200">
            <Circle r={80} fill={color} opacity={0.5} />
            <Circle r={50} fill="white" />
            <Circle r={90} stroke={color} strokeWidth={2} strokeDasharray="5,5" />
          </Svg>
        </Animated.View>
      );
    }
    if (taskType === 'planet') {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          { }
          <Animated.View style={{ position: 'absolute', transform: [{ scale: planetFormScale }, { rotate: spin }] }}>
            <Svg height={200} width={200} viewBox="-100 -100 200 200">
              <Circle r={70} stroke={color} strokeWidth={2} strokeDasharray="10,30" fill="none" opacity={0.6} />
            </Svg>
          </Animated.View>
          <Animated.View style={{ position: 'absolute', transform: [{ scale: planetFormScale }, { rotate: reverseSpin }] }}>
            <Svg height={200} width={200} viewBox="-100 -100 200 200">
              <Circle r={50} stroke={color} strokeWidth={4} strokeDasharray="30,20" fill="none" opacity={0.8} />
            </Svg>
          </Animated.View>
          { }
          <Animated.View style={{ opacity: planetOpacity, transform: [{ scale: planetFormScale }] }}>
            <Svg height={100} width={100} viewBox="-50 -50 100 100">
              <Circle r={30} fill={color} />
              <Circle r={25} fill="white" opacity={0.3} />
            </Svg>
          </Animated.View>
        </View>
      );
    }
    if (taskType === 'satellite') {
      return (
        <Animated.View style={{ transform: [{ translateY: rocketTranslate }, { translateX: shakeAnim }] }}>
          <Svg height={150} width={80} viewBox="0 0 60 120">
            <Path d="M 30 0 L 60 60 L 30 50 L 0 60 Z" fill="#dfe6e9" />
            <Rect x="20" y="60" width="20" height="15" fill="#636e72" />
            { }
            <G transform="translate(30, 75)">
              <Path d="M -10 0 L 10 0 L 0 40 Z" fill="#ff9f43" />
              <Path d="M -5 0 L 5 0 L 0 25 Z" fill="#feca57" />
            </G>
          </Svg>
        </Animated.View>
      );
    }
    if (taskType === 'comet') {
      return (
        <Animated.View
          style={{
            height: 200,
            width: width,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [
              { translateX: cometTranslateX },
              { translateY: cometTranslateY }
            ],
            zIndex: 10
          }}
        >
          { }
          <Animated.View style={{ transform: [{ rotate: '-30deg' }] }}>
            <Svg height={100} width={300} viewBox="0 0 300 100">
              { }
              <Path d="M 280 50 L 50 30 L 50 70 Z" fill={color} opacity={0.3} />
              <Path d="M 280 50 L 100 40 L 100 60 Z" fill={color} opacity={0.6} />
              { }
              <Circle cx="280" cy="50" r="15" fill={color} />
              <Circle cx="280" cy="50" r="8" fill="white" />
              { }
              <Circle cx="200" cy="40" r="3" fill="white" opacity={0.6} />
              <Circle cx="150" cy="65" r="2" fill="white" opacity={0.4} />
            </Svg>
          </Animated.View>
        </Animated.View>
      );
    }
    return (
      <Animated.View style={{ transform: [{ translateY: rocketTranslate }] }}>
        <Svg height={100} width={60} viewBox="0 0 60 100">
          <Path d="M 30 0 L 60 60 L 30 50 L 0 60 Z" fill={color} />
          <Rect x="20" y="60" width="20" height="15" fill="#555" />
        </Svg>
      </Animated.View>
    );
  };
  const getTitle = () => {
    if (type === 'destroy') return "MISSION ACCOMPLISHED";
    if (taskType === 'planet') return "PLANET FORMING";
    if (taskType === 'satellite') return "SATELLITE DEPLOYMENT";
    if (taskType === 'comet') return "COMET FRAGMENTATION";
    return "INITIATING LAUNCH";
  }
  return (
    <Animated.View style={[styles.cutsceneContainer, { opacity: fadeAnim }]}>
      <Animated.Text style={[styles.cutsceneTitle, { transform: [{ scale: textScale }] }]}>
        {getTitle()}
      </Animated.Text>
      <View style={styles.cutsceneVisual}>
        {renderVisual()}
      </View>
    </Animated.View>
  );
}
const StarField = React.memo(() => {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) => ({
      key: i,
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }));
  }, []);
  return (
    <>
      {stars.map((star) => (
        <Circle key={star.key} cx={star.x} cy={star.y} r={star.r} fill="white" opacity={star.opacity} />
      ))}
    </>
  );
});
const SciFiCalendar = ({ onSelectDate, onClose }: { onSelectDate: (date: Date) => void, onClose: () => void }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const generateDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<View key={`empty_${i}`} style={styles.calDayEmpty} />);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const isToday = i === today.getDate() && currentMonth === today.getMonth();
      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.calDay, isToday && styles.calDayToday]}
          onPress={() => { triggerHaptic('light'); onSelectDate(date); }}
        >
          <Text style={[styles.calDayText, isToday && styles.calDayTextToday]}>{i}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return (
    <Modal transparent animationType="fade" visible={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.calContainer}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={() => setCurrentMonth(prev => prev - 1)}><Text style={styles.calNav}>{'<'}</Text></TouchableOpacity>
            <Text style={styles.calTitle}>{monthNames[currentMonth]} {currentYear}</Text>
            <TouchableOpacity onPress={() => setCurrentMonth(prev => prev + 1)}><Text style={styles.calNav}>{'>'}</Text></TouchableOpacity>
          </View>
          <View style={styles.calGrid}>
            {generateDays()}
          </View>
          <TouchableOpacity style={styles.calClose} onPress={onClose}>
            <Text style={styles.calCloseText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
const SciFiTimePicker = ({ onSelectTime, onClose }: { onSelectTime: (hour: number) => void, onClose: () => void }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <Modal transparent animationType="fade" visible={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.calContainer}>
          <View style={styles.calHeader}>
            <Text style={styles.calTitle}>SELECT HOUR (24h)</Text>
          </View>
          <View style={styles.calGrid}>
            {hours.map(h => (
              <TouchableOpacity
                key={h}
                style={styles.timeBtn}
                onPress={() => { triggerHaptic('light'); onSelectTime(h); }}
              >
                <Text style={styles.timeBtnText}>{h.toString().padStart(2, '0')}:00</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.calClose} onPress={onClose}>
            <Text style={styles.calCloseText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
interface Task {
  id: number;
  title: string;
  deadline: number;
  created_at: number;
  type: 'planet' | 'comet' | 'satellite';
  category: string;
  recurrence: 'none' | 'monthly' | 'yearly';
  status: 'active' | 'archived';
}
const AnimatedG = Animated.createAnimatedComponent(G);
export default function OrbitScreen() {
  const { system } = useLocalSearchParams<{ system: string }>();
  const [activeSystem, setActiveSystem] = useState("General");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subTasks, setSubTasks] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [globalTime, setGlobalTime] = useState(0);
  const [newTaskText, setNewTaskText] = useState("");
  const [taskType, setTaskType] = useState<'planet' | 'comet' | 'satellite'>('planet');
  const [recurrence, setRecurrence] = useState<'none' | 'monthly' | 'yearly'>('none');
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [selectedDuration, setSelectedDuration] = useState(3600000);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isCalendarMode, setIsCalendarMode] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 3600000));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isControlsMinimized, setIsControlsMinimized] = useState(false);
  const [isLaunchPadOpen, setIsLaunchPadOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newSubTaskText, setNewSubTaskText] = useState("");
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [spawnTimes, setSpawnTimes] = useState<{ [key: number]: number }>({});
  const [impactState, setImpactState] = useState<{ id: number, time: number } | null>(null);
  const [dyingMoons, setDyingMoons] = useState<{ [key: number]: number }>({});
  const [activeCutscene, setActiveCutscene] = useState<{ type: 'launch' | 'destroy', taskType?: 'planet' | 'comet' | 'satellite', color: string, onFinish: () => void } | null>(null);
  const sunAgitation = useRef(0);
  const activeSystemRef = useRef("General");
  const [universeTasks, setUniverseTasks] = useState<{ [key: string]: Task[] }>({});
  const [isUniverseView, setIsUniverseView] = useState(false);
  const zoomAnim = useRef(new Animated.Value(1)).current;  
  const universeOpacity = useRef(new Animated.Value(0)).current;
  const [archivedCount, setArchivedCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [destroyingSystem, setDestroyingSystem] = useState<string | null>(null);
  const [destroyStartTime, setDestroyStartTime] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewCategory, setPreviewCategory] = useState<string | null>(null);
  const [previewFadeAnim] = useState(new Animated.Value(0));
  const [isRenamingPreview, setIsRenamingPreview] = useState(false);
  const [renamePreviewText, setRenamePreviewText] = useState("");
  const systemAngleAnims = useRef<{ [key: string]: Animated.Value }>({});
  const orbitLoop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(orbitLoop, {
        toValue: 1,
        duration: 120000,
        easing: Easing.linear,
        useNativeDriver: false  
      })
    ).start();
  }, []);
  useEffect(() => {
    if (system) {
      activeSystemRef.current = system;
      setActiveSystem(system);
      setSelectedCategory(system);
      refreshData(db, system);
    } else {
      activeSystemRef.current = "General";
      setActiveSystem("General");
      refreshData(db, "General");
    }
  }, [system]);
  useEffect(() => {
    async function setup() {
      try {
        const database = await SQLite.openDatabaseAsync('orbit_v28_unified.db');
        setDb(database);
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);
          CREATE TABLE IF NOT EXISTS tasks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  deadline INTEGER,
  created_at INTEGER,
  type TEXT DEFAULT 'planet',
  category TEXT DEFAULT 'General',
  recurrence TEXT DEFAULT 'none',
  status TEXT DEFAULT 'active'
);
          CREATE TABLE IF NOT EXISTS subtasks(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER,
  title TEXT,
  is_completed INTEGER DEFAULT 0
);
`);
        const countRes: any = await database.getFirstAsync('SELECT COUNT(*) as c FROM categories');
        if (countRes?.c === 0) {
          await database.execAsync(`
                INSERT INTO categories(name) VALUES('General'), ('Work'), ('Personal'), ('Health'), ('Ideas');
`);
        }
        refreshData(database, activeSystemRef.current);
      } catch (e) {
        console.log(e);
      }
    }
    setup();
    startGameLoop();
  }, []);
  const requestRef = useRef<number | null>(null);
  const startGameLoop = () => {
    const animate = () => {
      setGlobalTime(Date.now());
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
  };
  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  const panelHeight = isCustomMode ? 350 : 300;
  const minimizedOffset = panelHeight - 55;
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isControlsMinimized ? minimizedOffset : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start();
  }, [isControlsMinimized, isCustomMode]);
  useEffect(() => {
    if (tasks.length > 0 && db) {
      const now = Date.now();
      tasks.forEach(task => {
        if (task.deadline <= now - 2000) {
          deleteTaskCascade(task.id, false);
        }
      });
    }
  }, [globalTime]);
  const refreshData = React.useCallback(async (database = db, categoryFilter = activeSystem) => {
    if (database) {
      const tasksResult = await database.getAllAsync(
        "SELECT * FROM tasks WHERE status = 'active'"
      ) as Task[];
      const subTasksResult = await database.getAllAsync('SELECT * FROM subtasks');
      const catsResult = await database.getAllAsync('SELECT name FROM categories') as { name: string }[];
      const archiveResult: any = await database.getFirstAsync("SELECT COUNT(*) as count FROM tasks WHERE status = 'archived'");
      const currentCatTasks = tasksResult.filter(t => (t.category || 'General') === categoryFilter);
      const grouped: { [key: string]: Task[] } = {};
      catsResult.forEach(c => grouped[c.name] = []);
      tasksResult.forEach(t => {
        const cat = t.category || "General";
        if (grouped[cat]) grouped[cat].push(t);
      });
      if (categoryFilter === activeSystemRef.current) {
        setTasks(currentCatTasks);
      }
      setUniverseTasks(grouped);
      setSubTasks(subTasksResult);
      setCategoriesList(catsResult.map((c) => c.name));
      setArchivedCount(archiveResult?.count || 0);
    }
  }, [db, activeSystem]);
  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        refreshData(db, activeSystem);
      }
    }, [db, activeSystem, refreshData])
  );
  const handleDatePicked = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(targetDate.getHours());
    newDate.setMinutes(targetDate.getMinutes());
    setTargetDate(newDate);
    setIsCalendarOpen(false);
  }
  const handleTimePicked = (hour: number) => {
    const newDate = new Date(targetDate);
    newDate.setHours(hour);
    newDate.setMinutes(0);
    setTargetDate(newDate);
    setIsTimePickerOpen(false);
  }
  const initiateLaunch = () => {
    if (!newTaskText) {
      triggerHaptic('heavy');
      return;
    }
    setIsLaunchPadOpen(true);
    triggerHaptic('light');
  }
  const finalizeAddTask = async () => {
    if (!newTaskText || !db) return;
    setIsLaunchPadOpen(false);
    const catColor = getCategoryPalette(activeSystem)[0];
    setActiveCutscene({
      type: 'launch',
      taskType: taskType,
      color: catColor,
      onFinish: async () => {
        const now = Date.now();
        const deadline = targetDate.getTime();
        const result = await db.runAsync(
          'INSERT INTO tasks (title, deadline, created_at, type, category, recurrence, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newTaskText, deadline, now, taskType, activeSystem, recurrence, 'active']
        );
        if (result.lastInsertRowId) {
          setSpawnTimes(prev => ({ ...prev, [result.lastInsertRowId]: now }));
        }
        setNewTaskText("");
        setTargetDate(new Date(Date.now() + 3600000));
        setTaskType('planet');
        setRecurrence('none');
        refreshData(db, activeSystem);
        setActiveCutscene(null);
      }
    });
  };
  const addSubTask = async () => {
    if (!newSubTaskText || !selectedTask || !db) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await db.runAsync('INSERT INTO subtasks (parent_id, title) VALUES (?, ?)', [selectedTask.id, newSubTaskText]);
    setNewSubTaskText("");
    refreshData(db, activeSystem);
  }
  const toggleSubTask = async (subId: number, currentStatus: number) => {
    if (!db) return;
    if (currentStatus === 1) {
      await db.runAsync('UPDATE subtasks SET is_completed = 0 WHERE id = ?', [subId]);
      refreshData(db, activeSystem);
    } else {
      setDyingMoons(prev => ({ ...prev, [subId]: Date.now() }));
      setTimeout(async () => {
        triggerHaptic('medium');
        await db.runAsync('UPDATE subtasks SET is_completed = 1 WHERE id = ?', [subId]);
        if (selectedTask) {
          setImpactState({ id: selectedTask.id, time: Date.now() });
          setTimeout(() => setImpactState(null), 300);
        }
        setDyingMoons(prev => {
          const n = { ...prev };
          delete n[subId];
          return n;
        });
        refreshData(db, activeSystem);
      }, 800);
    }
  }
  const completeMissionAction = (task: any) => {
    setSelectedTask(null);
    const catColor = getCategoryPalette(task.category || "General")[0];
    setActiveCutscene({
      type: 'destroy',
      color: catColor,
      onFinish: () => {
        deleteTaskCascade(task.id, true);
        setActiveCutscene(null);
      }
    });
  }
  const deleteTaskCascade = async (id: number, isUserAction: boolean) => {
    if (!db) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await db.runAsync("UPDATE tasks SET status = 'archived' WHERE id = ?", [id]);
    await db.runAsync('DELETE FROM subtasks WHERE parent_id = ?', [id]);
    if (selectedTask?.id === id) setSelectedTask(null);
    if (isUserAction) triggerHaptic('heavy');
    refreshData(db, activeSystem);
  };
  const toggleControls = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsControlsMinimized(!isControlsMinimized);
  }
  const renderSolarSystem = () => {
    return tasks.map((task, index) => {
      const timeRemaining = task.deadline - globalTime;
      const hoursRemaining = Math.max(0, timeRemaining / (1000 * 60 * 60));
      let orbitRadius = SUN_RADIUS + 25 + (hoursRemaining * 6);
      if (orbitRadius > width / 2 - 20) orbitRadius = width / 2 - 20;
      let ellipticalY = 1;
      if (task.type === 'satellite') {
        orbitRadius = SUN_RADIUS + 10;
      } else if (task.type === 'comet') {
        ellipticalY = 0.6;
      }
      let isDying = false;
      let scale = 1;
      let opacity = 1;
      let chaosX = 0;
      let chaosY = 0;
      const spawnTime = spawnTimes[task.id] || task.created_at || 0;
      const age = globalTime - spawnTime;
      if (age < 800) {
        const t = age / 800;
        const easeOutBack = 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
        scale = Math.max(0, easeOutBack);
      }
      if (timeRemaining < 0) {
        isDying = true;
        const deathProgress = Math.min(1, Math.abs(timeRemaining) / 2000);
        orbitRadius = orbitRadius * (1 - deathProgress);
        scale = 1 - deathProgress;
        opacity = 1 - deathProgress;
        const shake = 5 * deathProgress;
        chaosX = (Math.random() - 0.5) * shake;
        chaosY = (Math.random() - 0.5) * shake;
      }
      const planetAngle = (index * 2) + (globalTime * BASE_SPEED);
      const planetX = CENTER_X + orbitRadius * Math.cos(planetAngle) + chaosX;
      const planetY = CENTER_Y + (orbitRadius * ellipticalY) * Math.sin(planetAngle) + chaosY;
      const [mainColor, shadowColor] = getCategoryPalette(task.category || "General");
      if (hoursRemaining < 1 && !isDying) {
        const pulse = Math.sin(globalTime / 150) * 0.1;
        scale += pulse;
      }
      const planetSize = task.type === 'satellite' ? 5 : 8;
      const myMoons = task.type === 'satellite'
        ? []
        : subTasks.filter(st => st.parent_id === task.id && st.is_completed === 0);
      let rotation = 0;
      let cometPath = "";
      if (task.type === 'comet') {
        const vx = -Math.sin(planetAngle);
        const vy = ellipticalY * Math.cos(planetAngle);
        rotation = (Math.atan2(vy, vx) * 180 / Math.PI);
      } else if (task.type === 'satellite') {
        const vx = -Math.sin(planetAngle);
        const vy = Math.cos(planetAngle);
        rotation = (Math.atan2(vy, vx) * 180 / Math.PI);
      }
      if (task.type === 'comet' && !isDying) {
        const trailLength = 0.5;
        const tHead = planetAngle;
        const tMid = planetAngle - (trailLength * 0.5);
        const tTail = planetAngle - trailLength;
        const getLocalPos = (t: number) => ({
          x: orbitRadius * Math.cos(t),
          y: (orbitRadius * ellipticalY) * Math.sin(t)
        });
        const headPos = getLocalPos(tHead);
        const midPos = getLocalPos(tMid);
        const tailPos = getLocalPos(tTail);
        const toLocal = (p: { x: number, y: number }) => ({ x: p.x - headPos.x, y: p.y - headPos.y });
        const pMid = toLocal(midPos);
        const pTail = toLocal(tailPos);
        const vx = -orbitRadius * Math.sin(tHead);
        const vy = (orbitRadius * ellipticalY) * Math.cos(tHead);
        const len = Math.sqrt(vx * vx + vy * vy);
        const nx = -vy / len;
        const ny = vx / len;
        const headW = 6;
        const pHeadL = { x: nx * headW, y: ny * headW };
        const pHeadR = { x: -nx * headW, y: -ny * headW };
        cometPath = `M 0 0 L ${pHeadL.x} ${pHeadL.y} Q ${pMid.x} ${pMid.y} ${pTail.x} ${pTail.y} Q ${pMid.x} ${pMid.y} ${pHeadR.x} ${pHeadR.y} Z`;
      }
      return (
        <G key={task.id}>
          <Defs>
            { }
            <RadialGradient
              id={`grad_${task.id}`}
              cx={`${50 + 25 * Math.cos(planetAngle + Math.PI)}%`}
              cy={`${50 + 25 * Math.sin(planetAngle + Math.PI)}%`}
              rx="40%"
              ry="40%"
            >
              <Stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
              <Stop offset="100%" stopColor={mainColor} stopOpacity="1" />
            </RadialGradient>
            { }
            {task.type === 'satellite' && (
              <>
                <RadialGradient
                  id={`sat_body_${task.id}`}
                  cx={`${50 + 20 * Math.cos(planetAngle + Math.PI)}%`}
                  cy={`${50 + 20 * Math.sin(planetAngle + Math.PI)}%`}
                  rx="60%"
                  ry="60%"
                >
                  <Stop offset="0%" stopColor="#ecf0f1" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#7f8fa6" stopOpacity="1" />
                </RadialGradient>
                <RadialGradient id={`sat_panel_${task.id}`} cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={mainColor} stopOpacity="1" />
                </RadialGradient>
              </>
            )}
            { }
          </Defs>
          { }
          {!isDying && (
            <Ellipse
              cx={CENTER_X}
              cy={CENTER_Y}
              rx={orbitRadius}
              ry={orbitRadius * ellipticalY}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
              fill="none"
              strokeDasharray="4,4"
            />
          )}
          {
            !isDying && myMoons.map((moon, mIndex) => {
              const moonOrbitRadius = 15 * scale;
              const moonAngle = (mIndex * (Math.PI * 2 / myMoons.length)) + (globalTime * 0.002);
              const mx = planetX + moonOrbitRadius * Math.cos(moonAngle);
              const my = planetY + moonOrbitRadius * Math.sin(moonAngle);
              return <Circle key={`moon_${moon.id} `} cx={mx} cy={my} r={2 * scale} fill="#bdc3c7" opacity={0.8} />;
            })
          }
          <G transform={`translate(${planetX}, ${planetY}) scale(${scale})`} onPress={() => { triggerHaptic('light'); setSelectedTask(task); }}>
            {task.type === 'comet' && !isDying ? (
              <>
                <Path
                  d={cometPath}
                  fill={mainColor}
                  opacity={0.3}
                />
                <Circle r={6} fill={`url(#grad_${task.id})`} />
              </>
            ) : task.type === 'satellite' && !isDying ? (
              <G transform={`rotate(${rotation}) scale(0.4)`}>
                { }
                <Rect x="-4" y="-4" width="8" height="8" fill={`url(#sat_body_${task.id})`} rx="2" stroke="#7f8fa6" strokeWidth="0.5" />
                <Line x1="0" y1="-4" x2="0" y2="-16" stroke="#95a5a6" strokeWidth="2" />
                <Line x1="0" y1="4" x2="0" y2="16" stroke="#95a5a6" strokeWidth="2" />
                { }
                <Rect x="-6" y="-22" width="12" height="8" fill={`url(#sat_panel_${task.id})`} stroke="#fff" strokeWidth="0.5" />
                <Rect x="-6" y="14" width="12" height="8" fill={`url(#sat_panel_${task.id})`} stroke="#fff" strokeWidth="0.5" />
                <Circle r={2} fill="red" opacity={Math.sin(globalTime / 100) > 0 ? 1 : 0.2} />
              </G>
            ) : (
              <>
                <Circle r={planetSize} fill={`url(#grad_${task.id})`} opacity={opacity} />
                <Circle r={planetSize} stroke="rgba(255,255,255,0.4)" strokeWidth={1} opacity={0.5 * opacity} />
              </>
            )}
          </G>
          {
            !isDying && (
              <SvgText onPress={() => setSelectedTask(task)} x={planetX + 12} y={planetY + 4} fill="#aaa" fontSize="10" fontWeight="bold" opacity={0.8 * opacity}>
                {task.title.length > 8 ? task.title.substring(0, 8) + ".." : task.title}
              </SvgText>
            )
          }
        </G >
      );
    });
  };
  const handleDurationSelect = (ms: number) => {
    if (ms === -1) { setIsCustomMode(true); setIsCalendarMode(false); }
    else if (ms === -2) { setIsCalendarMode(true); }
    else { setIsCustomMode(false); setIsCalendarMode(false); setSelectedDuration(ms); }
  }
  const getFormatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 24) return Math.floor(hours / 24) + "d";
    if (hours > 0) return hours + "h";
    return mins + "m";
  }
  const dyingCount = tasks.filter(t => t.deadline - globalTime < 0).length;
  if (dyingCount > 0) sunAgitation.current = Math.min(1, sunAgitation.current + 0.05);
  else sunAgitation.current = Math.max(0, sunAgitation.current - 0.01);
  const lerpColor = (start: string, end: string, amount: number) => {
    const hexToRgb = (hex: string) => {
      const bigint = parseInt(hex.slice(1), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    }
    const rgb1 = hexToRgb(start);
    const rgb2 = hexToRgb(end);
    const lerped = rgb1.map((c, i) => Math.round(c + (rgb2[i] - c) * amount));
    return `rgb(${lerped.join(",")})`;
  };
  const agitation = sunAgitation.current;
  const sunScale = 1 + Math.sin(globalTime / (800 - (700 * agitation))) * (0.05 + (0.15 * agitation));
  const systemBaseColor = getCategoryPalette(activeSystem)[0];
  const sunColor = lerpColor(systemBaseColor, "#ff4757", agitation);
  const targetDateString = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const targetTimeString = targetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const renderCollisionProgress = (taskId: number, category: string) => {
    const mySubTasks = subTasks.filter(s => s.parent_id === taskId);
    const total = mySubTasks.length;
    if (total === 0) return null;
    const completed = mySubTasks.filter(s => s.is_completed).length;
    const [mainColor, shadowColor] = getCategoryPalette(category);
    let currentRadius = 30 + (completed * 8);
    let offsetX = 0;
    let offsetY = 0;
    let flashFill = `url(#grad_${taskId}_modal)`;
    if (impactState && impactState.id === taskId) {
      offsetX = (Math.random() - 0.5) * 10;
      offsetY = (Math.random() - 0.5) * 10;
      currentRadius += 5;
      flashFill = "white";
    }
    const incompleteMoons = mySubTasks.filter(s => !s.is_completed);
    return (
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Svg height={140} width={width * 0.8}>
          <Defs>
            <RadialGradient id={`grad_${taskId} _modal`} cx="30%" cy="30%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={mainColor} stopOpacity="1" />
              <Stop offset="100%" stopColor={shadowColor} stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Circle cx={(width * 0.4) + offsetX} cy={70 + offsetY} r={currentRadius} fill={flashFill} />
          <Circle cx={(width * 0.4) + offsetX} cy={70 + offsetY} r={currentRadius} stroke="white" strokeWidth={2} opacity={0.3} />
          {impactState && impactState.id === taskId && (
            <Circle cx={(width * 0.4)} cy={70} r={currentRadius + 15} stroke="white" strokeWidth={2} opacity={0.5} />
          )}
          {incompleteMoons.map((moon, i) => {
            const isDying = dyingMoons[moon.id] !== undefined;
            let orbitR = currentRadius + 20;
            let angle = (i * (Math.PI * 2 / Math.max(1, incompleteMoons.length))) + (globalTime * 0.001);
            if (isDying) {
              const elapsed = globalTime - dyingMoons[moon.id];
              const t = Math.min(1, elapsed / 800);
              orbitR = orbitR * (1 - t);
              angle += (t * t * 15);
            }
            const mx = (width * 0.4) + orbitR * Math.cos(angle);
            const my = 70 + orbitR * Math.sin(angle);
            return <Circle key={`preview_moon_${moon.id} `} cx={mx} cy={my} r={4} fill="#bdc3c7" />
          })}
        </Svg>
        <Text style={styles.progressText}>{completed}/{total} Mass Absorbed</Text>
      </View>
    )
  }
  const categories = categoriesList.length > 0 ? categoriesList : ["General", "Work", "Personal", "Health", "Ideas"];
  const previewColors = getCategoryPalette(activeSystem);
  const toggleUniverseMode = () => {
    const toUniverse = !isUniverseView;
    setIsUniverseView(toUniverse);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(zoomAnim, {
        toValue: toUniverse ? 0 : 1,
        duration: 800,
        easing: Easing.inOut(Easing.exp),
        useNativeDriver: false  
      }),
      Animated.timing(universeOpacity, {
        toValue: toUniverse ? 1 : 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();
  };
  const selectSystemFromUniverse = (cat: string) => {
    setPreviewCategory(cat);
    setIsPreviewOpen(true);
    setIsRenamingPreview(false);
    triggerHaptic('medium');
    Animated.timing(previewFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };
  const enterSystemFromPreview = () => {
    if (!previewCategory) return;
    triggerHaptic('success');
    setIsPreviewOpen(false);
    setActiveSystem(previewCategory);
    activeSystemRef.current = previewCategory;
    refreshData(db, previewCategory);
    toggleUniverseMode();  
  };
  const closePreview = () => {
    Animated.timing(previewFadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => setIsPreviewOpen(false));
  };
  const renderSingleSystemPreview = (cat: string) => {
    const tasks = universeTasks[cat] || [];
    const sunR = 10;
    const [c1] = getCategoryPalette(cat);
    return (
      <G>
        <Defs>
          <RadialGradient id={`grad_prev_${cat}`} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <Stop offset="100%" stopColor={c1} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle r={sunR} fill={`url(#grad_prev_${cat})`} pointerEvents="none" />
        <Circle r={sunR + 10} fill={c1} opacity={0.15} pointerEvents="none" />
        {tasks.map((t, ti) => {
          const pR = sunR + 25 + (ti * 15);
          const pA = (ti * 137.5) + (globalTime * BASE_SPEED * 10);
          const px = pR * Math.cos(pA);
          const py = pR * Math.sin(pA);
          const pSize = t.type === 'satellite' ? 1.5 : 4;
          return <Circle key={`prev_${t.id}`} cx={px} cy={py} r={pSize} fill="white" opacity={0.8} pointerEvents="none" />
        })}
      </G>
    )
  }
  const startPreviewRename = () => {
    setRenamePreviewText(previewCategory || "");
    setIsRenamingPreview(true);
    triggerHaptic('medium');
  }
  const handleSavePreviewRename = async () => {
    if (!db || !renamePreviewText || !previewCategory) return;
    try {
      const oldName = previewCategory;
      const newName = renamePreviewText;
      await db.runAsync('UPDATE categories SET name = ? WHERE name = ?', [newName, oldName]);
      await db.runAsync('UPDATE tasks SET category = ? WHERE category = ?', [newName, oldName]);
      setPreviewCategory(newName);
      await refreshData(db);
      setIsRenamingPreview(false);
      triggerHaptic('success');
    } catch (e) { console.log(e); }
  };
  const openAddModal = () => {
    setEditCategoryName("");
    setIsAdding(true);
    triggerHaptic('medium');
  }
  const openEditModal = (cat: string) => {
    setEditCategoryName(cat);
    setIsEditing(true);
    triggerHaptic('medium');
  }
  const handleCreateCategory = async () => {
    if (!db || !editCategoryName) return;
    try {
      await db.runAsync('INSERT INTO categories (name) VALUES (?)', [editCategoryName]);
      await refreshData(db);
      setIsAdding(false);
      setEditCategoryName("");
      triggerHaptic('success');
    } catch (e) { console.log(e); }
  }
  const handleUpdateCategory = async () => {
    if (!db || !editCategoryName) return;  
    const target = activeSystem;  
    try {
      await db.runAsync('UPDATE categories SET name = ? WHERE name = ?', [editCategoryName, target]);
      await db.runAsync('UPDATE tasks SET category = ? WHERE category = ?', [editCategoryName, target]);
      setActiveSystem(editCategoryName);
      activeSystemRef.current = editCategoryName;
      await refreshData(db);
      setIsEditing(false);
      triggerHaptic('success');
    } catch (e) { console.log(e); }
  };
  const handleDeleteCategory = async () => {
    if (!db) return;
    const target = isPreviewOpen ? (previewCategory || 'General') : activeSystem;
    if (target === 'General') {
      Alert.alert("Protected System", "The General system cannot be destroyed.");
      return;
    }
    Alert.alert("Destroy System", `Are you sure you want to destroy the ${target} system? all mass will be lost to the void.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Destroy", style: "destructive", onPress: () => performDestroy(target) }
    ]);
  }
  const performDestroy = (target: string) => {
    setDestroyingSystem(target);
    setDestroyStartTime(Date.now());
    triggerHaptic('heavy');
    if (!isUniverseView) toggleUniverseMode();
    setTimeout(async () => {
      if (!db) return;
      try {
        await db.runAsync("UPDATE tasks SET category = 'General' WHERE category = ?", [target]);
        await db.runAsync("DELETE FROM categories WHERE name = ?", [target]);
        await refreshData(db);
        setDestroyingSystem(null);
        setActiveSystem("General");
        activeSystemRef.current = "General";
        triggerHaptic('success');
      } catch (e) { console.log(e); }
    }, 2000);
  }
  useEffect(() => {
    if (categoriesList.length === 0) return;
    const total = categoriesList.length;
    categoriesList.forEach((cat, index) => {
      let targetAngle = (index * (Math.PI * 2 / total));
      if (!systemAngleAnims.current[cat]) {
        systemAngleAnims.current[cat] = new Animated.Value(targetAngle);
      } else {
        Animated.spring(systemAngleAnims.current[cat], {
          toValue: targetAngle,
          friction: 6,
          tension: 40,
          useNativeDriver: false
        }).start();
      }
    });
    Object.keys(systemAngleAnims.current).forEach(k => {
      if (!categoriesList.includes(k) && k !== destroyingSystem) {
        delete systemAngleAnims.current[k];
      }
    });
  }, [categoriesList]);
  const renderKnownUniverse = () => {
    const categories = categoriesList.length > 0 ? categoriesList : ["General"];
    const systemCount = categories.length;
    const bhPulse = 1 + Math.sin(globalTime / 1000) * 0.05;
    const bhRotation = (globalTime / 50) % 360;
    return (
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: universeOpacity, pointerEvents: isUniverseView ? 'auto' : 'none' }]}>
        <Svg height={height} width={width}>
          <Defs>
            { }
            <RadialGradient id="blackHole" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="40%" stopColor="#000" stopOpacity="1" />
              <Stop offset="70%" stopColor="#2d3436" stopOpacity="1" />
              <Stop offset="100%" stopColor="#6c5ce7" stopOpacity="0" />
            </RadialGradient>
            {categories.map(cat => {
              const [c1] = getCategoryPalette(cat);
              return (
                <RadialGradient key={`grad_univ_${cat}`} id={`grad_univ_${cat}`} cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={c1} stopOpacity="1" />
                </RadialGradient>
              )
            })}
          </Defs>
          <G transform={`translate(${CENTER_X}, ${CENTER_Y}) scale(${bhPulse})`}>
            <Circle r={25} fill="url(#blackHole)" />
            <G transform={`rotate(${bhRotation})`}>
              { }
              {Array.from({ length: Math.min(archivedCount, 100) }).map((_, i) => {
                const angle = (i * 137.5) * (Math.PI / 180);
                const dist = 25 + (i % 30) + (Math.sin(i) * 10);
                const type = i % 10;
                const x = dist * Math.cos(angle);
                const y = dist * Math.sin(angle);
                const opacity = 0.3 + (Math.abs(Math.sin(i)) * 0.5);
                if (type === 9) {
                  return <Circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#57606f" opacity={opacity} />
                } else if (type > 6) {
                  return <Circle key={i} cx={x} cy={y} r={1.5} fill="#fff" opacity={opacity} />
                } else {
                  return <Circle key={i} cx={x} cy={y} r={0.8} fill="rgba(255,255,255,0.5)" opacity={opacity} />
                }
              })}
            </G>
            <SvgText y={5} fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="bold" textAnchor="middle">VOID</SvgText>
          </G>
          {categories.map((cat, i) => {
            if (!systemAngleAnims.current[cat]) systemAngleAnims.current[cat] = new Animated.Value(i * (Math.PI * 2 / systemCount));
            const angleAnim = systemAngleAnims.current[cat];
            const universeRadius = width * 0.40;
            const sunR = 6;
            const [c1] = getCategoryPalette(cat);
            const orbitRad = orbitLoop.interpolate({ inputRange: [0, 1], outputRange: [0, Math.PI * 2] });
            const totalRad = Animated.add(angleAnim, orbitRad);
            const rotationStr = totalRad.interpolate({
              inputRange: [0, Math.PI * 2],
              outputRange: ['0deg', '360deg']
            });
            const counterRotStr = totalRad.interpolate({
              inputRange: [0, Math.PI * 2],
              outputRange: ['0deg', '-360deg']
            });
            const items = universeTasks[cat] || [];
            let scale = 1;
            let opacity = 1;
            let currentRadius = width * 0.40;
            if (destroyingSystem === cat) {
              const elapsed = globalTime - destroyStartTime;
              const duration = 2000;
              const rawT = Math.min(1, Math.max(0, elapsed / duration));
              scale = 1 - rawT;
              opacity = 1 - rawT;
              currentRadius = (width * 0.40) * (1 - Math.pow(rawT, 0.5));  
              currentRadius = (width * 0.40) * (1 - rawT);
            }
            return (
              <AnimatedG
                key={cat}
                opacity={opacity}
                transform={[
                  { translateX: CENTER_X },
                  { translateY: CENTER_Y },
                  { rotate: rotationStr },
                  { translateX: currentRadius },
                  { scale: scale }
                ]}
              >
                { }
                <AnimatedG transform={[{ rotate: counterRotStr }]}>
                  <Circle r={sunR + 20} fill="transparent" />
                  {items.map((t, ti) => {
                    const pR = sunR + 6 + (ti * 3);
                    const pA = (ti * 137.5) + (globalTime * BASE_SPEED * 10);
                    const px = pR * Math.cos(pA);
                    const py = pR * Math.sin(pA);
                    const pSize = t.type === 'satellite' ? 0.8 : 2;
                    return <Circle key={`uni_p_${t.id}`} cx={px} cy={py} r={pSize} fill="white" opacity={0.6} pointerEvents="none" />
                  })}
                  <Circle r={sunR} fill={`url(#grad_univ_${cat})`} pointerEvents="none" />
                  <SvgText y={sunR + 15} fill={c1} fontSize="10" fontWeight="bold" textAnchor="middle" opacity={0.8} pointerEvents="none">
                    {cat.toUpperCase()}
                  </SvgText>
                </AnimatedG>
              </AnimatedG>
            )
          })}
        </Svg>
        { }
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {categories.map((cat, i) => {
            if (!systemAngleAnims.current[cat]) return null;
            const angleAnim = systemAngleAnims.current[cat];
            const universeRadius = width * 0.40;
            const orbitRad = orbitLoop.interpolate({ inputRange: [0, 1], outputRange: [0, Math.PI * 2] });
            const totalRad = Animated.add(angleAnim, orbitRad);
            const rotationStr = totalRad.interpolate({ inputRange: [0, Math.PI * 2], outputRange: ['0deg', '360deg'] });
            let scale = 1;
            let currentRadius = universeRadius;
            if (destroyingSystem === cat) {
              const elapsed = globalTime - destroyStartTime;
              const rawT = Math.min(1, Math.max(0, elapsed / 2000));
              scale = 1 - rawT;
              currentRadius = universeRadius * (1 - rawT);
            }
            return (
              <Animated.View
                key={`hit_${cat}`}
                pointerEvents={destroyingSystem === cat ? 'none' : 'auto'}
                style={{
                  position: 'absolute',
                  width: 100, height: 100,
                  left: CENTER_X - 50,
                  top: CENTER_Y - 50,
                  transform: [
                    { rotate: rotationStr },
                    { translateX: currentRadius },
                    { scale: scale }
                  ], justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 20
                }}
              >
                <TouchableOpacity
                  style={{ width: '100%', height: '100%', borderRadius: 50 }}
                  onPress={() => selectSystemFromUniverse(cat)}
                  activeOpacity={0.5}
                />
              </Animated.View>
            )
          })}
        </View>
        { }
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>KNOWN UNIVERSE</Text>
          <Text style={styles.headerSub}>{categoriesList.length} Systems • {archivedCount} Mass Absorbed</Text>
          <TouchableOpacity style={styles.addSystemBtn} onPress={openAddModal}>
            <Text style={styles.addSystemText}>+ NEW SYSTEM</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }
  const systemScale = zoomAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const systemOpacity = zoomAnim;
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {activeCutscene && (
        <CutsceneOverlay type={activeCutscene.type} taskType={activeCutscene.taskType} color={activeCutscene.color} onFinish={activeCutscene.onFinish} />
      )}
      { }
      {renderKnownUniverse()}
      { }
      <Animated.View
        pointerEvents={!isUniverseView ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { transform: [{ scale: systemScale }], opacity: systemOpacity }]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>ORBIT</Text>
          <TouchableOpacity onPress={toggleUniverseMode}>
            <Text style={styles.subtitle}>{activeSystem.toUpperCase()} SYSTEM ▾</Text>
          </TouchableOpacity>
        </View>
        <Pressable onLongPress={() => { triggerHaptic('medium'); setIsControlsMinimized(false); }} style={{ flex: 1 }}>
          <View style={styles.orbitContainer}>
            <Svg height={height * 0.75} width={width}>
              <Defs>
                <RadialGradient id="sunGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor={sunColor} stopOpacity="1" />
                </RadialGradient>
              </Defs>
              <StarField />
              <G transform={`translate(${CENTER_X}, ${CENTER_Y}) scale(${sunScale})`}>
                <Circle cx={0} cy={0} r={SUN_RADIUS} fill="url(#sunGrad)" onPress={toggleUniverseMode} />
                <Circle cx={0} cy={0} r={SUN_RADIUS + 15} fill={getCategoryPalette(activeSystem)[0]} opacity={0.15} />
              </G>
              {renderSolarSystem()}
            </Svg>
          </View>
        </Pressable>
      </Animated.View>
      <Animated.View style={[styles.controls, { transform: [{ translateY: slideAnim }], height: isCustomMode ? 400 : 300 }]}>
        <TouchableOpacity style={styles.handleBar} onPress={toggleControls}>
          <View style={styles.handleIcon} />
          <Text style={styles.handleText}>{isControlsMinimized ? "ADD MISSION" : "MINIMIZE"}</Text>
        </TouchableOpacity>
        { }
        <View style={[styles.controlHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.controlLabel}>DEADLINE: <Text style={{ color: 'white' }}>{targetDateString} • {targetTimeString}</Text></Text>
          {!isUniverseView && activeSystem !== 'General' && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => openEditModal(activeSystem)}>
                <Text style={{ color: '#0be881', fontSize: 10, fontWeight: 'bold' }}>EDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteCategory}>
                <Text style={{ color: '#ff4757', fontSize: 10, fontWeight: 'bold' }}>DESTROY</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setIsCalendarOpen(true)}>
            <Text style={styles.dateBtnText}>DATE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setIsTimePickerOpen(true)}>
            <Text style={styles.dateBtnText}>TIME</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mission Name"
            placeholderTextColor="#666"
            value={newTaskText}
            onChangeText={setNewTaskText}
          />
          <TouchableOpacity style={styles.launchBtn} onPress={initiateLaunch}>
            <Text style={styles.launchText}>LAUNCH</Text>
          </TouchableOpacity>
        </View>
        {isCustomMode && (
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              placeholder="Enter Hours..."
              placeholderTextColor="#666"
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="numeric"
            />
          </View>
        )}
      </Animated.View>
      <Modal transparent animationType="slide" visible={isLaunchPadOpen} onRequestClose={() => setIsLaunchPadOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { height: 550, paddingBottom: 40 }]}>
            <Text style={styles.modalTitle}>MISSION CONFIGURATION</Text>
            <View style={{ height: 150, alignItems: 'center', justifyContent: 'center', marginVertical: 10 }}>
              <Svg height={150} width={150} viewBox="-50 -50 100 100">
                <Defs>
                  <RadialGradient id="previewGrad" cx="30%" cy="30%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor={previewColors[0]} stopOpacity="1" />
                    <Stop offset="100%" stopColor="#000" stopOpacity="1" />
                  </RadialGradient>
                  <RadialGradient id="satBodyPreview" cx="30%" cy="30%" rx="60%" ry="60%">
                    <Stop offset="0%" stopColor="#ecf0f1" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#7f8fa6" stopOpacity="1" />
                  </RadialGradient>
                  <RadialGradient id="satPanelPreview" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                    <Stop offset="100%" stopColor={previewColors[0]} stopOpacity="1" />
                  </RadialGradient>
                </Defs>
                {taskType === 'planet' && (
                  <Circle r={30} fill="url(#previewGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                )}
                {taskType === 'comet' && (
                  <G transform="rotate(-45)">
                    <Path d="M 0 0 Q -20 -10 -60 0 Q -20 10 0 0 Z" fill={previewColors[0]} opacity={0.5} />
                    <Circle r={20} fill="url(#previewGrad)" />
                  </G>
                )}
                {taskType === 'satellite' && (
                  <G transform="rotate(-15) scale(0.8)">
                    <Rect x="-15" y="-15" width="30" height="30" fill="url(#satBodyPreview)" rx={5} stroke="#7f8fa6" strokeWidth="1" />
                    <Line x1="0" y1="-15" x2="0" y2="-35" stroke="#95a5a6" strokeWidth="3" />
                    <Line x1="0" y1="15" x2="0" y2="35" stroke="#95a5a6" strokeWidth="3" />
                    <Rect x="-20" y="-50" width="40" height="25" fill="url(#satPanelPreview)" rx={2} stroke="#fff" strokeWidth={1} />
                    <Rect x="-20" y="25" width="40" height="25" fill="url(#satPanelPreview)" rx={2} stroke="#fff" strokeWidth={1} />
                    <Circle r={4} fill="red" opacity={Math.sin(globalTime / 100) > 0 ? 1 : 0.2} />
                  </G>
                )}
              </Svg>
            </View>
            <Text style={[styles.controlLabel, { marginBottom: 15 }]}>CLASS</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity onPress={() => { triggerHaptic('light'); setTaskType('planet'); }} style={[styles.typeBtn, taskType === 'planet' && styles.typeBtnActive]}>
                <Text style={styles.typeText}>PLANET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { triggerHaptic('light'); setTaskType('comet'); }} style={[styles.typeBtn, taskType === 'comet' && styles.typeBtnActive]}>
                <Text style={styles.typeText}>COMET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { triggerHaptic('light'); setTaskType('satellite'); }} style={[styles.typeBtn, taskType === 'satellite' && styles.typeBtnActive]}>
                <Text style={styles.typeText}>SAT</Text>
              </TouchableOpacity>
            </View>
            {taskType === 'comet' && (
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                <TouchableOpacity onPress={() => setRecurrence('monthly')} style={[styles.recBtn, recurrence === 'monthly' && styles.recBtnActive]}>
                  <Text style={styles.recBtnText}>MONTHLY</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRecurrence('yearly')} style={[styles.recBtn, recurrence === 'yearly' && styles.recBtnActive]}>
                  <Text style={styles.recBtnText}>YEARLY</Text>
                </TouchableOpacity>
              </View>
            )}
            { }
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
              <TouchableOpacity style={styles.cancelLaunchBtn} onPress={() => setIsLaunchPadOpen(false)}>
                <Text style={styles.closeText}>ABORT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmLaunchBtn} onPress={finalizeAddTask}>
                <Text style={styles.completeText}>LAUNCH</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      { }
      <Modal transparent visible={isEditing || isAdding} animationType="slide" onRequestClose={() => { setIsEditing(false); setIsAdding(false); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>{isAdding ? "INITIALIZE NEW SYSTEM" : "SYSTEM CONFIGURATION"}</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: isAdding ? '#fff' : getCategoryPalette(activeSystem)[0] }]}
              value={editCategoryName}
              onChangeText={setEditCategoryName}
              autoFocus
              placeholder="System Name"
              placeholderTextColor="#555"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => { setIsEditing(false); setIsAdding(false); }} style={styles.cancelBtn}>
                <Text style={styles.btnText}>CANCEL</Text>
              </TouchableOpacity>
              {isAdding ? (
                <TouchableOpacity onPress={handleCreateCategory} style={styles.saveBtn}>
                  <Text style={[styles.btnText, { color: '#0c0c14' }]}>CREATE</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleUpdateCategory} style={styles.saveBtn}>
                  <Text style={[styles.btnText, { color: '#0c0c14' }]}>RENAME</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal transparent visible={isPreviewOpen} animationType="none" onRequestClose={closePreview}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.systemWindow, { opacity: previewFadeAnim }]}>
            <View style={styles.windowHeader}>
              {isRenamingPreview ? (
                <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', gap: 10 }}>
                  <TextInput
                    style={{ flex: 1, backgroundColor: '#0c0c14', color: 'white', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#485460' }}
                    value={renamePreviewText}
                    onChangeText={setRenamePreviewText}
                    placeholder="System Name"
                    placeholderTextColor="#555"
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSavePreviewRename} style={{ backgroundColor: 'white', padding: 10, borderRadius: 8 }}>
                    <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 10 }}>SAVE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsRenamingPreview(false)} style={{ backgroundColor: '#2a2d3a', padding: 10, borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>X</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity onPress={startPreviewRename} style={styles.editBtn}>
                    <Text style={styles.editBtnText}>EDIT</Text>
                  </TouchableOpacity>
                  <Text style={[styles.windowTitle, { color: previewCategory ? getCategoryPalette(previewCategory)[0] : 'white' }]}>
                    {previewCategory?.toUpperCase()}
                  </Text>
                  {previewCategory !== "General" ? (
                    <TouchableOpacity onPress={() => { handleDeleteCategory(); closePreview(); }} style={styles.delBtn}>
                      <Text style={styles.delBtnText}>DESTROY</Text>
                    </TouchableOpacity>
                  ) : (<View style={{ width: 30 }} />)}
                </>
              )}
            </View>
            <TouchableOpacity activeOpacity={1} onPress={enterSystemFromPreview} style={styles.svgWrapper}>
              <Svg height={300} width={300}>
                <G transform="translate(150, 150)">
                  {previewCategory && renderSingleSystemPreview(previewCategory)}
                </G>
              </Svg>
            </TouchableOpacity>
            <Text style={styles.tapHint}>TAP SYSTEM TO ENTER</Text>
            <TouchableOpacity onPress={closePreview} style={styles.closeBtnBottom}>
              <Text style={styles.closeText}>CLOSE WINDOW</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
      {isCalendarMode && <SciFiCalendar onSelectDate={handleDatePicked} onClose={() => setIsCalendarMode(false)} />}
      {isCalendarOpen && <SciFiCalendar onSelectDate={handleDatePicked} onClose={() => setIsCalendarOpen(false)} />}
      {isTimePickerOpen && <SciFiTimePicker onSelectTime={handleTimePicked} onClose={() => setIsTimePickerOpen(false)} />}
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
                    {getFormatTime(selectedTask.deadline - Date.now())} remaining
                  </Text>
                </View>
                {renderCollisionProgress(selectedTask.id, selectedTask.category || "General")}
                <View style={styles.subtaskList}>
                  <Text style={styles.subtaskHeader}>MOONS</Text>
                  <FlatList
                    data={subTasks.filter(s => s.parent_id === selectedTask.id)}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => {
                      const isDying = dyingMoons[item.id] !== undefined;
                      return (
                        <TouchableOpacity
                          style={styles.subtaskItem}
                          onPress={() => toggleSubTask(item.id, item.is_completed)}
                          disabled={isDying}
                        >
                          <View style={[styles.checkbox, item.is_completed && styles.checkboxChecked]} />
                          <Text style={[styles.subtaskText, item.is_completed && styles.subtaskTextDone]}>
                            {item.title} {isDying && "!"}
                          </Text>
                        </TouchableOpacity>
                      )
                    }}
                    ListEmptyComponent={<Text style={styles.emptySub}>Add subtasks to spawn moons.</Text>}
                    style={{ maxHeight: 150 }}
                  />
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
                <TouchableOpacity style={styles.completeBtn} onPress={() => completeMissionAction(selectedTask)}>
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
  controls: {
    backgroundColor: '#1e2029',
    padding: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  handleBar: { alignItems: 'center', paddingBottom: 15, marginBottom: 5 },
  handleIcon: { width: 40, height: 4, backgroundColor: '#485460', borderRadius: 2, marginBottom: 5 },
  handleText: { color: '#808e9b', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  controlHeader: { marginBottom: 10 },
  controlLabel: { color: '#808e9b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  dateBtn: { flex: 1, backgroundColor: '#2a2d3a', padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#485460' },
  dateBtnText: { color: '#0be881', fontWeight: 'bold', letterSpacing: 1 },
  typeRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  typeBtn: { width: 80, height: 40, borderRadius: 12, backgroundColor: '#2a2d3a', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#485460' },
  typeBtnActive: { backgroundColor: '#3742fa', borderColor: '#3742fa' },
  typeText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  catBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, backgroundColor: '#2a2d3a', borderWidth: 1, borderColor: '#485460', margin: 5 },
  inputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#2a2d3a', borderRadius: 15, color: 'white', paddingHorizontal: 20, height: 55, marginRight: 10, borderWidth: 1, borderColor: '#485460' },
  launchBtn: { backgroundColor: '#0be881', borderRadius: 15, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  launchText: { color: '#1e272e', fontWeight: '900', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', backgroundColor: '#1e2029', borderRadius: 25, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', flex: 1 },
  closeText: { color: '#808e9b', fontSize: 14, fontWeight: 'bold', padding: 5 },
  modalBadge: { alignSelf: 'flex-start', backgroundColor: '#2a2d3a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 5, marginBottom: 10 },
  modalBadgeText: { color: '#d2dae2', fontSize: 12, fontWeight: 'bold' },
  progressText: { color: '#0984e3', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
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
  completeText: { color: '#1e272e', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  calContainer: { width: '85%', backgroundColor: '#1e2029', borderRadius: 25, padding: 20, alignItems: 'center' },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, paddingHorizontal: 10 },
  calTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  calNav: { color: '#0be881', fontSize: 20, fontWeight: 'bold' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  calDay: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  calDayEmpty: { width: '14.28%', aspectRatio: 1 },
  calDayText: { color: '#808e9b', fontWeight: 'bold' },
  calDayToday: { backgroundColor: '#2a2d3a', borderRadius: 10, borderWidth: 1, borderColor: '#0be881' },
  calDayTextToday: { color: 'white' },
  calClose: { marginTop: 20 },
  calCloseText: { color: '#ff4757', fontWeight: 'bold' },
  timeBtn: { width: '16.66%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 5 },
  timeBtnText: { color: '#d2dae2', fontSize: 12, fontWeight: 'bold' },
  customRow: { marginBottom: 15 },
  customInput: { backgroundColor: '#2a2d3a', borderRadius: 12, color: '#ffa502', paddingHorizontal: 15, height: 45, borderWidth: 1, borderColor: '#ffa502' },
  recBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, backgroundColor: '#2a2d3a', borderWidth: 1, borderColor: '#485460', marginHorizontal: 5 },
  recBtnActive: { backgroundColor: '#3742fa', borderColor: '#3742fa' },
  recBtnText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  headerOverlay: {
    position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 10, pointerEvents: 'box-none'
  },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 4, textShadowColor: 'black', textShadowRadius: 10 },
  headerSub: { color: '#808e9b', fontSize: 10, letterSpacing: 1, marginTop: 5 },
  addSystemBtn: { marginTop: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#fff', pointerEvents: 'auto' },
  addSystemText: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  systemWindow: { width: width * 0.9, height: 480, backgroundColor: '#1e2029', borderRadius: 30, borderWidth: 1, borderColor: '#2a2d3a', alignItems: 'center', padding: 20, overflow: 'hidden' },
  windowHeader: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  windowTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  editBtn: { backgroundColor: '#2a2d3a', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#485460' },
  editBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  delBtn: { backgroundColor: 'rgba(255,71,87,0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ff4757' },
  delBtnText: { color: '#ff4757', fontSize: 10, fontWeight: 'bold' },
  svgWrapper: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  tapHint: { color: '#555', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 20 },
  closeBtnBottom: { marginTop: 20, padding: 10 },
  modalContent: { width: '80%', backgroundColor: '#1e2029', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#2a2d3a' },
  modalLabel: { color: '#808e9b', fontSize: 10, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  cancelBtn: { padding: 15, borderRadius: 10, flex: 1, alignItems: 'center' },
  saveBtn: { backgroundColor: 'white', padding: 15, borderRadius: 10, flex: 1, alignItems: 'center' },
  modalInput: { backgroundColor: '#0c0c14', color: 'white', padding: 15, borderRadius: 10, fontSize: 18, fontWeight: 'bold', marginBottom: 20, borderWidth: 1, textAlign: 'center', width: '100%' },
  btnText: { color: '#808e9b', fontWeight: 'bold', fontSize: 12 },
  cancelLaunchBtn: { flex: 1, backgroundColor: '#2a2d3a', paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#485460' },
  confirmLaunchBtn: { flex: 2, backgroundColor: '#0be881', paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cutsceneContainer: { position: 'absolute', top: 0, left: 0, width: width, height: height, backgroundColor: '#000', zIndex: 100, alignItems: 'center', justifyContent: 'center' },
  cutsceneTitle: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: 3, marginBottom: 50, textAlign: 'center' },
  cutsceneVisual: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }
});