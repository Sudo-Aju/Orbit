import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NotFoundScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <ThemedView style={styles.container}>
                <ThemedText type="title">404 - Lost in Space</ThemedText>
                <ThemedText style={styles.text}>This sector has not been charted yet.</ThemedText>
                <Link href="/" style={styles.link}>
                    <ThemedText type="link">Return to Solar System</ThemedText>
                </Link>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    text: {
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
    },
    link: {
        paddingVertical: 15,
    },
});
