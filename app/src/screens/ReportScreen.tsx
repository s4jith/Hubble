import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomButton from '../components/CustomButton';
import { COLORS, SPACING } from '../constants/theme';
import { AlertTriangle, MessageSquare, User, Calendar, Send, CheckCircle } from 'lucide-react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabParamList } from '../../App';

type Props = NativeStackScreenProps<TabParamList, 'Report'>;

const ReportScreen = ({ navigation }: Props) => {
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const incidentTypes = [
        { id: 'harassment', label: 'Harassment', icon: MessageSquare },
        { id: 'threats', label: 'Threats', icon: AlertTriangle },
        { id: 'bullying', label: 'Cyberbullying', icon: User },
        { id: 'other', label: 'Other', icon: Calendar },
    ];

    const handleSubmit = () => {
        if (!incidentType || !description.trim()) {
            Alert.alert('Missing Information', 'Please select an incident type and provide a description.');
            return;
        }

        // Simulate submission
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setIncidentType('');
            setDescription('');
            Alert.alert('Report Submitted', 'Thank you for your report. We will review it shortly.');
        }, 2000);
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Report an Incident</Text>
                <Text style={styles.subtitle}>Help us keep the community safe</Text>

                <Text style={styles.label}>Type of Incident</Text>
                <View style={styles.typesGrid}>
                    {incidentTypes.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            onPress={() => setIncidentType(type.id)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={(incidentType === type.id ? COLORS.primaryGradient : [COLORS.surfaceLight, COLORS.surface]) as [string, string, ...string[]]}
                                style={[styles.typeCard, incidentType === type.id && styles.typeCardSelected]}
                            >
                                <type.icon
                                    color={incidentType === type.id ? COLORS.background : COLORS.primary}
                                    size={24}
                                />
                                <Text style={[
                                    styles.typeLabel,
                                    incidentType === type.id && styles.typeLabelSelected
                                ]}>
                                    {type.label}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Describe what happened..."
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    numberOfLines={6}
                    value={description}
                    onChangeText={setDescription}
                    textAlignVertical="top"
                />

                <Text style={styles.label}>Evidence (Optional)</Text>
                <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
                    <Text style={styles.uploadText}>+ Add Screenshots or Files</Text>
                </TouchableOpacity>

                <View style={styles.infoBox}>
                    <AlertTriangle color={COLORS.warning} size={20} />
                    <Text style={styles.infoText}>
                        Your report is confidential. We take all reports seriously and will investigate promptly.
                    </Text>
                </View>

                {submitted ? (
                    <View style={styles.successBox}>
                        <CheckCircle color={COLORS.success} size={32} />
                        <Text style={styles.successText}>Submitting your report...</Text>
                    </View>
                ) : (
                    <CustomButton
                        title="SUBMIT REPORT"
                        onPress={handleSubmit}
                        style={styles.submitBtn}
                    />
                )}
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
    label: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: SPACING.m,
    },
    typesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: SPACING.l,
        marginHorizontal: -SPACING.xs,
    },
    typeCard: {
        width: 80,
        height: 80,
        margin: SPACING.xs,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    typeCardSelected: {
        borderColor: COLORS.primary,
    },
    typeLabel: {
        color: COLORS.text,
        fontSize: 11,
        marginTop: SPACING.xs,
        fontWeight: '500',
    },
    typeLabelSelected: {
        color: COLORS.background,
    },
    textArea: {
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.text,
        borderRadius: 20,
        padding: SPACING.m,
        height: 140,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: SPACING.l,
    },
    uploadBox: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 20,
        padding: SPACING.l,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        marginBottom: SPACING.l,
    },
    uploadText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255, 159, 10, 0.1)',
        padding: SPACING.m,
        borderRadius: 16,
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: 'rgba(255, 159, 10, 0.2)',
    },
    infoText: {
        color: COLORS.text,
        marginLeft: SPACING.m,
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    submitBtn: {
        marginTop: SPACING.s,
    },
    successBox: {
        alignItems: 'center',
        padding: SPACING.xl,
    },
    successText: {
        color: COLORS.success,
        marginTop: SPACING.m,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ReportScreen;
