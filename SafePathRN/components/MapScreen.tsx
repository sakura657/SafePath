import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { speak } from '@/services/ttsService';
import { OverlayBubble } from '@/components/ui/OverlayBubble';

export default function MapScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isAnnouncing, setIsAnnouncing] = useState(false);
    const mapRef = useRef<MapView>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

    const announceLocation = async () => {
        if (!location) {
            speak('Waiting for location data.');
            return;
        }

        try {
            setIsAnnouncing(true);
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const addressText = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}`;
                setAddress(addressText);

                // Speak and then hide after a delay
                speak(`You are currently at ${addressText}`, 'en-US', {
                    onDone: () => {
                        setTimeout(() => setIsAnnouncing(false), 3000);
                    },
                    onError: () => setIsAnnouncing(false)
                });
            } else {
                speak('Could not determine the address.');
                setIsAnnouncing(false);
            }
        } catch (error) {
            console.error(error);
            speak('Failed to get address.');
            setIsAnnouncing(false);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT} // Uses Apple Maps on iOS
                showsUserLocation={true}
                followsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                initialRegion={location ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                } : undefined}
            />

            {/* AI Overlay (Blue Box) */}
            <View style={[styles.aiOverlay, { top: 20 + insets.top }]}>
                <OverlayBubble
                    text={address || "Locating..."}
                    type="ai"
                    visible={isAnnouncing}
                />
            </View>

            <View style={[styles.overlay, { bottom: 40 + insets.bottom }]}>
                <TouchableOpacity style={styles.button} onPress={announceLocation}>
                    <IconSymbol size={28} name="speaker.wave.2.fill" color="#fff" />
                    <Text style={styles.buttonText}>Announce Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    aiOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    overlay: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#1e88e5',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
