import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import StatCard from '../components/StatCard';
import { COLORS, SPACING } from '../constants/theme';
import { Shield, Activity, AlertTriangle, CheckCircle, ChevronRight, Heart, FileWarning } from 'lucide-react-native';

interface QuickActionProps {
    icon: any;
    title: string;
    subtitle: string;
    onPress: () => void;
    color?: string;
}

const QuickAction = ({ icon: Icon, title, subtitle, onPress, color = COLORS.primary }: QuickActionProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
            colors={[COLORS.surfaceLight, COLORS.surface]}
            style={styles.quickAction}
        >
            <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
                <Icon color={color} size={22} />
            </View>
            <View style={styles.quickActionInfo}>
                <Text style={styles.quickActionTitle}>{title}</Text>
                <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
            </View>
            <ChevronRight color={COLORS.textSecondary} size={20} />
        </LinearGradient>
    </TouchableOpacity>
);

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../App';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Hello, User</Text>
                    <Text style={styles.subtitle}>Your digital safety companion is active.</Text>
                </View>

                <View style={styles.scoreContainer}>
                    <LinearGradient
                        colors={['rgba(255, 215, 0, 0.2)', 'transparent']}
                        style={styles.scoreGlow}
                    />
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreValue}>98%</Text>
                        <Text style={styles.scoreLabel}>Safety Score</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard title="Scanned" value="1,240" icon={Activity} />
                    <StatCard title="Flagged" value="3" icon={AlertTriangle} />
                </View>

                <Text style={styles.sectionHeader}>Quick Actions</Text>

                <QuickAction
                    icon={FileWarning}
                    title="Report an Incident"
                    subtitle="Submit a new report"
                    onPress={() => navigation.navigate('Report')}
                    color={COLORS.warning}
                />

                <QuickAction
                    icon={Heart}
                    title="Get Support"
                    subtitle="Mental health resources"
                    onPress={() => navigation.navigate('Resources')}
                    color={COLORS.error}
                />

                <LinearGradient
                    colors={[COLORS.surfaceLight, COLORS.surface]}
                    style={styles.section}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.sectionTitle}>System Status</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusIcon}>
                            <Shield color={COLORS.success} size={20} />
                        </View>
                        <Text style={styles.statusText}>Real-time Monitoring Active</Text>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={styles.statusIcon}>
                            <CheckCircle color={COLORS.success} size={20} />
                        </View>
                        <Text style={styles.statusText}>AI Engine Operational</Text>
                    </View>
                </LinearGradient>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.m,
        paddingBottom: 120,
    },
    header: {
        marginBottom: SPACING.xl,
        marginTop: SPACING.m,
    },
    greeting: {
        color: COLORS.text,
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginTop: SPACING.xs,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
        position: 'relative',
    },
    scoreGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        top: -25,
    },
    scoreCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 8,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    scoreValue: {
        color: COLORS.primary,
        fontSize: 42,
        fontWeight: 'bold',
    },
    scoreLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: SPACING.xs,
    },
    statsGrid: {
        flexDirection: 'row',
        marginBottom: SPACING.l,
    },
    sectionHeader: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
    },
    quickAction: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: 20,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.m,
    },
    quickActionInfo: {
        flex: 1,
    },
    quickActionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    quickActionSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    section: {
        padding: SPACING.l,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        marginTop: SPACING.m,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: SPACING.m,
        borderRadius: 20,
    },
    statusIcon: {
        backgroundColor: 'rgba(50, 215, 75, 0.1)',
        padding: 8,
        borderRadius: 50,
    },
    statusText: {
        color: COLORS.text,
        marginLeft: SPACING.m,
        fontSize: 15,
        fontWeight: '500',
    },
});

export default HomeScreen;
