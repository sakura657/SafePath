import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BiometricService } from '@/services/biometricService';
import { useAuth } from '@/contexts/AuthContext';

export function BiometricLockScreen() {
    const { unlockApp } = useAuth();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Attempt to authenticate automatically on mount
        authenticate();
    }, []);

    const authenticate = async () => {
        setIsAuthenticating(true);
        setError(null);

        const success = await BiometricService.authenticate();

        if (success) {
            unlockApp();
        } else {
            setError('Authentication failed. Please try again.');
        }

        setIsAuthenticating(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <IconSymbol size={64} name="lock.fill" color="#fff" />
                </View>

                <Text style={styles.title}>SafePath Locked</Text>
                <Text style={styles.subtitle}>
                    Please authenticate to continue
                </Text>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={styles.button}
                    onPress={authenticate}
                    disabled={isAuthenticating}
                >
                    <IconSymbol size={24} name="faceid" color="#fff" />
                    <Text style={styles.buttonText}>
                        {isAuthenticating ? 'Verifying...' : 'Unlock with Face ID'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 48,
        textAlign: 'center',
    },
    errorText: {
        color: '#ff4444',
        marginBottom: 24,
        fontSize: 14,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#1e88e5',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        gap: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
