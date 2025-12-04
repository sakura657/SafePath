import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ViewStyle, TextStyle } from 'react-native';

interface OverlayBubbleProps {
    text: string;
    type: 'user' | 'ai';
    visible: boolean;
    style?: ViewStyle;
}

export function OverlayBubble({ text, type, visible, style }: OverlayBubbleProps) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) return null;

    const isUser = type === 'user';

    // Dynamic styles based on type
    const containerStyle = isUser ? styles.userContainer : styles.aiContainer;
    const textStyle = isUser ? styles.userText : styles.aiText;

    return (
        <Animated.View style={[styles.wrapper, containerStyle, style, { opacity }]}>
            <Text style={textStyle}>{text}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 24,
        maxWidth: '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    userContainer: {
        backgroundColor: 'rgba(76, 175, 80, 0.85)', // Green, semi-transparent
        borderBottomRightRadius: 4,
    },
    aiContainer: {
        backgroundColor: 'rgba(33, 150, 243, 0.9)', // Blue, semi-transparent
        borderTopLeftRadius: 4,
    },
    userText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    },
    aiText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    },
});
