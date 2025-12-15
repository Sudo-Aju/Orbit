import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

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

export default function ExploreScreen() {
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];
    const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
    const [credits, setCredits] = useState(0);
    const [ownedItems, setOwnedItems] = useState<string[]>([]);

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

    const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'error') => {
        if (Platform.OS === 'web') return;
        if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (type === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (type === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };

    const renderItem = ({ item }: { item: StoreItem }) => {
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

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <ThemedText type="title">Galactic Store</ThemedText>
                    <ThemedText style={styles.subtitle}>Customize your universe</ThemedText>
                </View>
                <View style={styles.creditsContainer}>
                    <Ionicons name="cube-outline" size={16} color={theme.tint} />
                    <ThemedText style={[styles.creditsText, { color: theme.tint }]}>{credits} DM</ThemedText>
                </View>
            </View>

            <FlatList
                data={STORE_ITEMS}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
    subtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
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
});
