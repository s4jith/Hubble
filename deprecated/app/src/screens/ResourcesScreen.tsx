import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import { COLORS, SPACING } from '../constants/theme';
import { Phone, Globe, Heart, MessageCircle, Mail, ExternalLink } from 'lucide-react-native';

interface ResourceCardProps {
    title: string;
    description: string;
    contact: string;
    type: 'phone' | 'email' | 'chat' | 'web';
    icon?: any;
}

const ResourceCard = ({ title, description, contact, type, icon: Icon }: ResourceCardProps) => {
    const handlePress = () => {
        if (type === 'phone') {
            Linking.openURL(`tel:${contact}`);
        } else if (type === 'email') {
            Linking.openURL(`mailto:${contact}`);
        } else {
            Linking.openURL(contact);
        }
    };

    const getIcon = () => {
        if (Icon) return Icon;
        switch (type) {
            case 'phone': return Phone;
            case 'email': return Mail;
            case 'chat': return MessageCircle;
            default: return Globe;
        }
    };

    const IconComponent = getIcon();

    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <LinearGradient
                colors={[COLORS.surfaceLight, COLORS.surface]}
                style={styles.card}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                        <IconComponent color={COLORS.primary} size={20} />
                    </View>
                    <ExternalLink color={COLORS.textSecondary} size={16} />
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{description}</Text>
                <View style={styles.contactBadge}>
                    <Text style={styles.contactText}>{contact}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const ResourcesScreen = () => {
    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Support Resources</Text>
                <Text style={styles.subtitle}>You are not alone. Help is available 24/7.</Text>

                <View style={styles.emergencyBanner}>
                    <Heart color={COLORS.error} size={24} />
                    <Text style={styles.emergencyText}>In an emergency, call your local emergency services</Text>
                </View>

                <Text style={styles.sectionHeader}>Crisis Helplines</Text>
                <View style={styles.grid}>
                    <ResourceCard
                        title="Suicide Prevention"
                        description="24/7 free and confidential support"
                        contact="988"
                        type="phone"
                    />
                    <ResourceCard
                        title="Crisis Text Line"
                        description="Text HOME for immediate help"
                        contact="741741"
                        type="chat"
                        icon={MessageCircle}
                    />
                </View>

                <Text style={styles.sectionHeader}>Cyberbullying Support</Text>
                <View style={styles.grid}>
                    <ResourceCard
                        title="StopBullying.gov"
                        description="Resources for kids, parents, educators"
                        contact="https://stopbullying.gov"
                        type="web"
                    />
                    <ResourceCard
                        title="CyberSmile Foundation"
                        description="Digital wellbeing & anti-bullying"
                        contact="https://cybersmile.org"
                        type="web"
                    />
                </View>

                <Text style={styles.sectionHeader}>Mental Health</Text>
                <View style={styles.grid}>
                    <ResourceCard
                        title="NAMI Helpline"
                        description="Mental health support and info"
                        contact="1-800-950-6264"
                        type="phone"
                    />
                    <ResourceCard
                        title="Teen Line"
                        description="Teens helping teens"
                        contact="1-800-852-8336"
                        type="phone"
                    />
                </View>

                <View style={styles.footer}>
                    <Heart color={COLORS.primary} size={32} />
                    <Text style={styles.footerText}>Stay Safe Online</Text>
                    <Text style={styles.footerSubtext}>Your wellbeing matters</Text>
                </View>
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
    emergencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 69, 58, 0.15)',
        padding: SPACING.m,
        borderRadius: 16,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: 'rgba(255, 69, 58, 0.3)',
    },
    emergencyText: {
        color: COLORS.error,
        marginLeft: SPACING.m,
        flex: 1,
        fontWeight: '600',
    },
    sectionHeader: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACING.m,
        marginTop: SPACING.s,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -SPACING.xs,
        marginBottom: SPACING.m,
    },
    card: {
        width: '48%',
        margin: '1%',
        padding: SPACING.m,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        minHeight: 160,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: SPACING.xs,
    },
    cardDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    contactBadge: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingHorizontal: SPACING.s,
        paddingVertical: SPACING.xs,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: SPACING.s,
    },
    contactText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: 'bold',
    },
    footer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        paddingVertical: SPACING.l,
    },
    footerText: {
        color: COLORS.text,
        marginTop: SPACING.m,
        fontWeight: 'bold',
        fontSize: 18,
    },
    footerSubtext: {
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        fontSize: 14,
    },
});

export default ResourcesScreen;
