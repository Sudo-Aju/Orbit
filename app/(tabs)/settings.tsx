import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


type StoreItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: keyof typeof Ionicons.glyphMap;
    type: 'theme' | 'upgrade' | 'cosmetic';
};

const STORE_ITEMS: StoreItem[] = [
    { id: 'theme_neon', name: 'Neon Cyberpunk', description: 'A vibrant neon color palette for your systems.', price: 50, icon: 'color-palette-outline', type: 'theme' },
    { id: 'theme_gold', name: 'Golden Age', description: 'Luxurious gold accents for the high roller.', price: 100, icon: 'diamond-outline', type: 'theme' },
    { id: 'upgrade_sensor', name: 'Sensor Array Mk II', description: 'Enhanced visualization for your tasks.', price: 75, icon: 'scan-outline', type: 'upgrade' },
    { id: 'cosmetic_trails', name: 'Stardust Trails', description: 'Leave a trail of stardust as you navigate.', price: 30, icon: 'star-outline', type: 'cosmetic' },
    { id: 'cosmetic_shield', name: 'Planetary Shield', description: 'Visual shield effect for your home planet.', price: 150, icon: 'shield-checkmark-outline', type: 'cosmetic' },
    { id: 'theme_void', name: 'Void Darkness', description: 'Embrace the abyss with this dark theme.', price: 200, icon: 'moon-outline', type: 'theme' },
];

export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];
    const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
    const [credits, setCredits] = useState(0);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);
    const [currentView, setCurrentView] = useState<'menu' | 'store' | 'profile'>('menu');
    const [profileName, setProfileName] = useState("Commander");

    useEffect(() => {
        async function setup() {
            try {
                const database = await SQLite.openDatabaseAsync('orbit_v28_unified.db');
                setDb(database);
                await database.execAsync(`
                    CREATE TABLE IF NOT EXISTS player_stats (key TEXT PRIMARY KEY, value INTEGER);
                    CREATE TABLE IF NOT EXISTS inventory (item_id TEXT PRIMARY KEY, acquired_at INTEGER);
                `);

                const res: any = await database.getFirstAsync("SELECT value FROM player_stats WHERE key = 'dark_matter'");
                if (res) {
                    setCredits(res.value);
                } else {
                    await database.runAsync("INSERT INTO player_stats (key, value) VALUES ('dark_matter', 100)");
                    setCredits(100);
                }

                try {
                    await database.execAsync("ALTER TABLE player_stats ADD COLUMN text_value TEXT");
                } catch { }

                const nameRes: any = await database.getFirstAsync("SELECT text_value FROM player_stats WHERE key = 'profile_name'");
                if (nameRes && nameRes.text_value) setProfileName(nameRes.text_value);

                refreshInventory(database);
            } catch (e) {
                console.log(e);
            }
        }
        setup();
    }, []);

    const refreshInventory = async (database: SQLite.SQLiteDatabase) => {
        const inv = await database.getAllAsync('SELECT item_id FROM inventory');
        setOwnedItems(inv.map((i: any) => i.item_id));
    };

    const handleBuy = async (item: StoreItem) => {
        if (!db) return;
        if (credits < item.price) {
            triggerHaptic('error');
            Alert.alert("Insufficient Funds", "You need more Dark Matter to acquire this item.");
            return;
        }

        Alert.alert("Confirm Purchase", `Buy ${item.name} for ${item.price} DM?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Buy",
                onPress: async () => {
                    try {
                        const newCredits = credits - item.price;
                        await db.runAsync("UPDATE player_stats SET value = ? WHERE key = 'dark_matter'", [newCredits]);
                        await db.runAsync("INSERT INTO inventory (item_id, acquired_at) VALUES (?, ?)", [item.id, Date.now()]);
                        setCredits(newCredits);
                        await refreshInventory(db);
                        triggerHaptic('success');
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        ]);
    };

    const saveProfile = async () => {
        if (!db) return;
        try {
            await db.runAsync("INSERT OR REPLACE INTO player_stats (key, value, text_value) VALUES ('profile_name', 0, ?)", [profileName]);
            triggerHaptic('success');
            Alert.alert("Profile Updated", "Identity confirmed.");
        } catch (e) { console.log(e); }
    }

    const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'error') => {
        if (Platform.OS === 'web') return;
        if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const renderStoreItem = ({ item }: { item: StoreItem }) => {
        const isOwned = ownedItems.includes(item.id);
        const canAfford = credits >= item.price;
        return (
            <View style={[styles.itemCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
                <View style={[styles.iconContainer, { backgroundColor: isOwned ? theme.tint : '#333' }]}>
                    <Ionicons name={item.icon} size={24} color={isOwned ? 'white' : '#888'} />
                </View>
                <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemDesc}>{item.description}</ThemedText>
                </View>
                <TouchableOpacity
                    style={[
                        styles.buyBtn,
                        isOwned ? styles.ownedBtn : (canAfford ? styles.activeBuyBtn : styles.disabledBuyBtn),
                        { borderColor: isOwned ? 'transparent' : (canAfford ? theme.tint : '#555') }
                    ]}
                    disabled={isOwned}
                    onPress={() => handleBuy(item)}
                >
                    <ThemedText style={[
                        styles.buyBtnText,
                        { color: isOwned ? '#fff' : (canAfford ? theme.tint : '#555') }
                    ]}>
                        {isOwned ? "OWNED" : `${item.price} DM`}
                    </ThemedText>
                </TouchableOpacity>
            </View>
        );
    };

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('profile')}>
                <View style={styles.menuIconBox}><Ionicons name="person-outline" size={24} color="white" /></View>
                <View>
                    <Text style={styles.menuTitle}>Personalization</Text>
                    <Text style={styles.menuSub}>Identity & Preferences</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('store')}>
                <View style={styles.menuIconBox}><Ionicons name="cart-outline" size={24} color="white" /></View>
                <View>
                    <Text style={styles.menuTitle}>Galactic Store & Themes</Text>
                    <Text style={styles.menuSub}>Spend Dark Matter</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
        </View>
    );

    const [hapticsEnabled, setHapticsEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [rankIndex, setRankIndex] = useState(0);
    const RANKS = ["Cadet", "Explorer", "Captain", "Admiral"];

    useEffect(() => {
        if (!db) return;
        const loadSettings = async () => {
            try {
                const hRes: any = await db.getFirstAsync("SELECT value FROM player_stats WHERE key = 'haptics_enabled'");
                if (hRes) setHapticsEnabled(hRes.value === 1);

                const nRes: any = await db.getFirstAsync("SELECT value FROM player_stats WHERE key = 'notifications_enabled'");
                if (nRes) setNotificationsEnabled(nRes.value === 1);

                const rRes: any = await db.getFirstAsync("SELECT value FROM player_stats WHERE key = 'rank_index'");
                if (rRes) setRankIndex(rRes.value);
            } catch { }
        };
        loadSettings();
    }, [db]);

    const renderProfile = () => (
        <View style={styles.contentContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>COMMANDER NAME</Text>
                <TextInput
                    style={styles.input}
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholder="Enter Name"
                    placeholderTextColor="#555"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>RANK</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {RANKS.map((rank, i) => (
                        <TouchableOpacity
                            key={rank}
                            onPress={() => { triggerHaptic('light'); setRankIndex(i); }}
                            style={[
                                styles.rankBtn,
                                rankIndex === i && { backgroundColor: theme.tint, borderColor: theme.tint }
                            ]}
                        >
                            <Text style={[styles.rankText, rankIndex === i && { color: '#fff' }]}>{rank}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.label}>HAPTIC FEEDBACK</Text>
                <TouchableOpacity
                    onPress={() => setHapticsEnabled(!hapticsEnabled)}
                    style={[styles.toggleBtn, hapticsEnabled && { backgroundColor: '#0be881' }]}
                >
                    <View style={[styles.toggleCircle, hapticsEnabled && { alignSelf: 'flex-end' }]} />
                </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <Text style={styles.label}>NOTIFICATIONS</Text>
                <TouchableOpacity
                    onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                    style={[styles.toggleBtn, notificationsEnabled && { backgroundColor: '#0be881' }]}
                >
                    <View style={[styles.toggleCircle, notificationsEnabled && { alignSelf: 'flex-end' }]} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
                await saveProfile();
                if (db) {
                    await db.runAsync("INSERT OR REPLACE INTO player_stats (key, value) VALUES ('haptics_enabled', ?)", [hapticsEnabled ? 1 : 0]);
                    await db.runAsync("INSERT OR REPLACE INTO player_stats (key, value) VALUES ('notifications_enabled', ?)", [notificationsEnabled ? 1 : 0]);
                    await db.runAsync("INSERT OR REPLACE INTO player_stats (key, value) VALUES ('rank_index', ?)", [rankIndex]);
                }
            }}>
                <Text style={styles.saveBtnText}>SAVE SETTINGS</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View>
                    {currentView === 'menu' ? (
                        <ThemedText type="title">SETTINGS</ThemedText>
                    ) : (
                        <TouchableOpacity onPress={() => setCurrentView('menu')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="arrow-back" size={24} color={theme.tint} />
                            <ThemedText type="title" style={{ marginLeft: 10 }}>{currentView === 'store' ? 'STORE' : 'PROFILE'}</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
                <View style={styles.creditsContainer}>
                    <Ionicons name="cube-outline" size={16} color={theme.tint} />
                    <ThemedText style={[styles.creditsText, { color: theme.tint }]}>{credits} DM</ThemedText>
                </View>
            </View>

            {currentView === 'menu' && renderMenu()}
            {currentView === 'profile' && renderProfile()}
            {currentView === 'store' && (
                <FlatList
                    data={STORE_ITEMS}
                    keyExtractor={item => item.id}
                    ListHeaderComponent={
                        <View style={styles.earningInfo}>
                            <ThemedText style={styles.earningTitle}>INCOME SOURCES</ThemedText>
                            <View style={styles.earningRow}>
                                <Ionicons name="checkmark-circle-outline" size={16} color={theme.tint} />
                                <ThemedText style={styles.earningText}>Mission Complete (Planet/Comet): <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>+5 DM</ThemedText></ThemedText>
                            </View>
                            <View style={styles.earningRow}>
                                <Ionicons name="repeat-outline" size={16} color={theme.tint} />
                                <ThemedText style={styles.earningText}>Daily Task (Satellite): <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>+2 DM</ThemedText></ThemedText>
                            </View>
                            <View style={styles.earningRow}>
                                <Ionicons name="ellipse-outline" size={16} color={theme.tint} />
                                <ThemedText style={styles.earningText}>Subtask (Moon): <ThemedText style={{ color: theme.tint, fontWeight: 'bold' }}>+1 DM</ThemedText></ThemedText>
                            </View>
                        </View>
                    }
                    renderItem={renderStoreItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    creditsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 5,
        borderWidth: 1,
        borderColor: '#333',
    },
    creditsText: {
        fontWeight: 'bold',
        fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    },
    listContent: {
        padding: 20,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        marginBottom: 15,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    itemDesc: {
        fontSize: 12,
        color: '#888',
    },
    buyBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        marginLeft: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    activeBuyBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    disabledBuyBtn: {
        backgroundColor: 'transparent',
    },
    ownedBtn: {
        backgroundColor: '#2ecc71',
        borderColor: '#2ecc71',
    },
    buyBtnText: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    earningInfo: {
        marginBottom: 20,
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#333'
    },
    earningTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#666',
        letterSpacing: 1
    },
    earningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        gap: 10
    },
    earningText: {
        fontSize: 12,
        color: '#888'
    },
    menuContainer: {
        padding: 20
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333'
    },
    menuIconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#111',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#333'
    },
    menuTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    menuSub: {
        color: '#888',
        fontSize: 12
    },
    contentContainer: {
        padding: 20
    },
    inputGroup: {
        marginBottom: 30
    },
    label: {
        color: '#808e9b',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1
    },
    input: {
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 12,
        padding: 15,
        color: 'white',
        fontSize: 16
    },
    saveBtn: {
        backgroundColor: '#0be881',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center'
    },
    saveBtnText: {
        color: '#000',
        fontWeight: '900',
        letterSpacing: 1
    },
    rankBtn: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
        backgroundColor: '#111'
    },
    rankText: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold'
    },
    toggleBtn: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#333',
        padding: 3,
        justifyContent: 'center'
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white'
    }
});
