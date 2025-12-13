import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { AlertTriangle } from 'lucide-react-native';

const AlertCard = ({ message, timestamp, severity = 'medium' }) => {
    const getSeverityColor = () => {
        switch (severity) {
            case 'high': return COLORS.error;
            case 'medium': return COLORS.warning;
            default: return COLORS.success;
        }
    };

    const severityColor = getSeverityColor();

    return (
        <LinearGradient
            colors={[COLORS.surfaceLight, COLORS.surface]}
            style={[styles.card, { borderLeftColor: severityColor }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: `${severityColor}20` }]}>
                    <AlertTriangle color={severityColor} size={18} />
                </View>
                <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.footer}>
                <Text style={[styles.severity, { color: severityColor }]}>
                    {severity.toUpperCase()} PRIORITY
                </Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: SPACING.m,
        borderRadius: 24, // More curvy
        marginBottom: SPACING.m,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    iconBox: {
        padding: SPACING.s,
        borderRadius: 50, // Round icon background
    },
    timestamp: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    message: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 22,
        marginBottom: SPACING.m,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    severity: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default AlertCard;
