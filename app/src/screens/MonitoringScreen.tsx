import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, SPACING } from '../constants/theme';
import { getMockMonitoringData, AlertItem } from '../services/ai';
import { AlertTriangle, Shield, Eye, EyeOff, Trash2, MessageSquare, Globe, Users } from 'lucide-react-native';

const getSourceIcon = (source: string) => {
    switch (source) {
        case 'Social Media': return Globe;
        case 'Direct Message': return MessageSquare;
        case 'Group Chat': return Users;
        default: return MessageSquare;
    }
};

interface AlertCardProps {
    item: AlertItem;
    onDismiss: (id: number) => void;
}

const AlertCard = ({ item, onDismiss }: AlertCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useState(new Animated.Value(0))[0];

    const getSeverityColor = () => {
        switch (item.severity) {
            case 'high': return COLORS.error;
            case 'medium': return COLORS.warning;
            default: return COLORS.success;
        }
    };

    const severityColor = getSeverityColor();
    const SourceIcon = getSourceIcon(item.source);

    const toggleExpand = () => {
        setExpanded(!expanded);
        Animated.spring(animatedHeight, {
            toValue: expanded ? 0 : 1,
            useNativeDriver: false,
            friction: 8,
        }).start();
    };

    const expandedHeight = animatedHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100],
    });

    return (
        <TouchableOpacity onPress={toggleExpand} activeOpacity={0.9}>
            <LinearGradient
                colors={[COLORS.surfaceLight, COLORS.surface]}
                style={[styles.card, { borderLeftColor: severityColor }]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconBox, { backgroundColor: `${severityColor}20` }]}>
                            <AlertTriangle color={severityColor} size={18} />
                        </View>
                        <View style={styles.sourceInfo}>
                            <View style={styles.sourceRow}>
                                <SourceIcon color={COLORS.textSecondary} size={12} />
                                <Text style={styles.sourceText}>{item.source}</Text>
                            </View>
                            <Text style={styles.timestamp}>{item.timestamp}</Text>
                        </View>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: `${severityColor}20` }]}>
                        <Text style={[styles.severityText, { color: severityColor }]}>
                            {item.severity.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.message}>{item.message}</Text>

                <Animated.View style={[styles.expandedContent, { maxHeight: expandedHeight }]}>
                    <View style={styles.divider} />
                    <Text style={styles.categoryLabel}>Category: {item.category}</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => onDismiss(item.id)}>
                            <EyeOff color={COLORS.textSecondary} size={16} />
                            <Text style={styles.actionText}>Dismiss</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]}>
                            <Trash2 color={COLORS.error} size={16} />
                            <Text style={[styles.actionText, { color: COLORS.error }]}>Block Source</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const MonitoringScreen = () => {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        setAlerts(getMockMonitoringData());
    }, []);

    const handleDismiss = (id: number) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    const filteredAlerts = filter === 'all'
        ? alerts
        : alerts.filter(a => a.severity === filter);

    interface FilterButtonProps {
        value: string;
        label: string;
    }

    const FilterButton = ({ value, label }: FilterButtonProps) => (
        <TouchableOpacity
            onPress={() => setFilter(value)}
            style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
        >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Monitoring</Text>
                    <View style={styles.statusBadge}>
                        <Shield color={COLORS.success} size={14} />
                        <Text style={styles.statusText}>Active</Text>
                    </View>
                </View>
                <Text style={styles.subtitle}>
                    {alerts.length} flagged {alerts.length === 1 ? 'interaction' : 'interactions'}
                </Text>

                <View style={styles.filterRow}>
                    <FilterButton value="all" label="All" />
                    <FilterButton value="high" label="High" />
                    <FilterButton value="medium" label="Medium" />
                    <FilterButton value="low" label="Low" />
                </View>

                <FlatList
                    data={filteredAlerts}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <AlertCard item={item} onDismiss={handleDismiss} />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Shield color={COLORS.success} size={48} />
                            <Text style={styles.emptyTitle}>All Clear!</Text>
                            <Text style={styles.emptyText}>No flagged content to review.</Text>
                        </View>
                    }
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.s,
    },
    title: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(50, 215, 75, 0.15)',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
    },
    statusText: {
        color: COLORS.success,
        marginLeft: SPACING.xs,
        fontWeight: '600',
        fontSize: 12,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: SPACING.m,
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: SPACING.m,
    },
    filterBtn: {
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: 20,
        marginRight: SPACING.s,
        backgroundColor: COLORS.surfaceLight,
    },
    filterBtnActive: {
        backgroundColor: COLORS.primary,
    },
    filterText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    filterTextActive: {
        color: COLORS.background,
    },
    list: {
        paddingBottom: 120,
    },
    card: {
        padding: SPACING.m,
        borderRadius: 20,
        marginBottom: SPACING.m,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.m,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        padding: SPACING.s,
        borderRadius: 12,
        marginRight: SPACING.m,
    },
    sourceInfo: {
        justifyContent: 'center',
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sourceText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginLeft: 4,
    },
    timestamp: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 2,
    },
    severityBadge: {
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: 8,
    },
    severityText: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    message: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 22,
    },
    expandedContent: {
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: SPACING.m,
    },
    categoryLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: SPACING.m,
        textTransform: 'capitalize',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: SPACING.s,
    },
    actionBtnDanger: {
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
    },
    actionText: {
        color: COLORS.textSecondary,
        marginLeft: SPACING.xs,
        fontSize: 12,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: SPACING.m,
    },
    emptyText: {
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
    },
});

export default MonitoringScreen;
