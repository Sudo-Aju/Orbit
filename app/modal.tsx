import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ModalScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Mission Status</ThemedText>
      <ThemedView style={styles.separator} lightColor="rgba(255,255,255,0.1)" darkColor="rgba(255,255,255,0.1)" />

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={{ color: theme.primary }}>24.5</ThemedText>
          <ThemedText style={styles.label}>Velocity (km/s)</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={{ color: theme.success }}>98%</ThemedText>
          <ThemedText style={styles.label}>Fuel Levels</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={{ color: theme.warning }}>3</ThemedText>
          <ThemedText style={styles.label}>Active Anomalies</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <ThemedText type="subtitle" style={{ color: theme.danger }}>OFFLINE</ThemedText>
          <ThemedText style={styles.label}>Comms Relay</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.logTitle}>Recent Logs</ThemedText>
      <View style={styles.logItem}>
        <ThemedText style={styles.logTime}>14:00</ThemedText>
        <ThemedText>Orbit stabilized around Kepler-186f.</ThemedText>
      </View>
      <View style={styles.logItem}>
        <ThemedText style={styles.logTime}>13:45</ThemedText>
        <ThemedText>Scanning for life signs... Negative.</ThemedText>
      </View>
      <View style={styles.logItem}>
        <ThemedText style={styles.logTime}>09:00</ThemedText>
        <ThemedText>System boot sequence completed.</ThemedText>
      </View>

      {}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    gap: 15,
  },
  statBox: {
    width: '47%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  logTitle: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  logItem: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  logTime: {
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    opacity: 0.6,
  }
});
