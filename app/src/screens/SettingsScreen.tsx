import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, SPACING } from '../constants/theme';
import { Bell, Shield, Eye, Users, ChevronRight, Moon, Volume2 } from 'lucide-react-native';

interface SettingItemProps {
    icon: any;
    title: string;
    description?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    isSwitch?: boolean;
}

const SettingItem = ({ icon: Icon, title, description, value, onValueChange, isSwitch = true }: SettingItemProps) => {
    return (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={() => !isSwitch && onValueChange && onValueChange(!value)}
            activeOpacity={isSwitch ? 1 : 0.7}
        >
            <View style={styles.settingIcon}>
                <Icon color={COLORS.primary} size={20} />
            </View>
            <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{title}</Text>
                {description && <Text style={styles.settingDesc}>{description}</Text>}
            </View>
            {isSwitch ? (
                <Switch
                    value={Boolean(value)}
                    onValueChange={onValueChange}
                    thumbColor={value ? '#FFD700' : '#f4f3f4'}
                />
            ) : (
                <ChevronRight color={COLORS.textSecondary} size={20} />
            )}
        </TouchableOpacity>
    );
};

const SettingsScreen = () => {
    const [notifications, setNotifications] = useState(true);
    const [realTimeMonitoring, setRealTimeMonitoring] = useState(true);
    const [sensitiveContent, setSensitiveContent] = useState(true);
    const [parentMode, setParentMode] = useState(false);
    const [soundAlerts, setSoundAlerts] = useState(false);
    const [darkMode, setDarkMode] = useState(true);

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Customize your safety experience</Text>

                <LinearGradient
                    colors={[COLORS.surfaceLight, COLORS.surface]}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Monitoring</Text>
                    <SettingItem
                        icon={Shield}
                        title="Real-time Monitoring"
                        description="Scan messages as they arrive"
                        value={realTimeMonitoring}
                        onValueChange={setRealTimeMonitoring}
                    />
                    <SettingItem
                        icon={Eye}
                        title="Sensitive Content Filter"
                        description="Flag potentially harmful content"
                        value={sensitiveContent}
                        onValueChange={setSensitiveContent}
                    />
                </LinearGradient>

                <LinearGradient
                    colors={[COLORS.surfaceLight, COLORS.surface]}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <SettingItem
                        icon={Bell}
                        title="Push Notifications"
                        description="Get alerts for flagged content"
                        value={notifications}
                        onValueChange={setNotifications}
                    />
                    <SettingItem
                        icon={Volume2}
                        title="Sound Alerts"
                        description="Play sound for critical alerts"
                        value={soundAlerts}
                        onValueChange={setSoundAlerts}
                    />
                </LinearGradient>

                <LinearGradient
                    colors={[COLORS.surfaceLight, COLORS.surface]}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Parental Controls</Text>
                    <SettingItem
                        icon={Users}
                        title="Parent Mode"
                        description="Enable dashboard for parents"
                        value={parentMode}
                        onValueChange={setParentMode}
                    />
                </LinearGradient>

                <LinearGradient
                    colors={[COLORS.surfaceLight, COLORS.surface]}
                    style={styles.section}
                >
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <SettingItem
                        icon={Moon}
                        title="Dark Mode"
                        description="Use dark theme"
                        value={darkMode}
                        onValueChange={setDarkMode}
                    />
                </LinearGradient>

                <Text style={styles.version}>Hubble v1.0.0</Text>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.m,
        paddingBottom: 120,
    },
    title: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
        marginTop: SPACING.s,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginBottom: SPACING.l,
    },
    section: {
        borderRadius: 24,
        padding: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    sectionTitle: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    settingDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    version: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.l,
        fontSize: 12,
    },
});

export default SettingsScreen;
