import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    variant?: 'primary' | 'secondary';
}

const CustomButton = ({ title, onPress, loading = false, style, textStyle, variant = 'primary' }: CustomButtonProps) => {
    const isPrimary = variant === 'primary';
    const gradientColors = (isPrimary ? COLORS.primaryGradient : [COLORS.surfaceLight, COLORS.surface]) as [string, string, ...string[]];
    const textColor = isPrimary ? '#000000' : COLORS.text;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.8}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={textColor} />
                ) : (
                    <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 30, // Pill shape
        overflow: 'hidden',
        elevation: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default CustomButton;
