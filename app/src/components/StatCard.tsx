import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';

interface StatCardProps {
    title: string;
    value: string;
    icon?: any;
}

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => {
    return (
        <LinearGradient
            colors={[COLORS.surfaceLight, COLORS.surface]}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.iconContainer}>
                {Icon && <Icon color={COLORS.primary} size={24} />}
            </View>
            <View>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: SPACING.m,
        borderRadius: 24, // More curvy
        flex: 1,
        margin: SPACING.xs,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        marginRight: SPACING.m,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: SPACING.s,
        borderRadius: 50, // Fully round
    },
    value: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
    title: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

export default StatCard;
