import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard, TouchableWithoutFeedback, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from '../components/ScreenWrapper';
import CustomButton from '../components/CustomButton';
import { COLORS, SPACING } from '../constants/theme';
import { analyzeText, AnalysisResult } from '../services/ai';
import { AlertTriangle, CheckCircle, Search, Shield, Info } from 'lucide-react-native';

const AnalyzeScreen = () => {
    const [text, setText] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!text.trim()) return;

        Keyboard.dismiss();
        setLoading(true);
        setResult(null);

        try {
            const analysis = await analyzeText(text);
            setResult(analysis);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = () => {
        if (!result) return COLORS.textSecondary;
        if (!result.isHarmful) return COLORS.success;
        switch (result.severity) {
            case 'high': return COLORS.error;
            case 'medium': return COLORS.warning;
            default: return COLORS.primary;
        }
    };

    return (
        <ScreenWrapper>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>AI Analyzer</Text>
                        <Text style={styles.subtitle}>Powered by advanced NLP</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Paste a message, comment, or text to analyze..."
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={text}
                            onChangeText={setText}
                        />
                        <View style={styles.inputIcon}>
                            <Search color={COLORS.primary} size={20} />
                        </View>
                    </View>

                    <CustomButton
                        title="ANALYZE CONTENT"
                        onPress={handleAnalyze}
                        loading={loading}
                        style={styles.button}
                    />

                    {result && (
                        <LinearGradient
                            colors={result.isHarmful
                                ? [`${getSeverityColor()}15`, `${getSeverityColor()}05`]
                                : ['rgba(50, 215, 75, 0.15)', 'rgba(50, 215, 75, 0.05)']}
                            style={[styles.resultBox, { borderColor: getSeverityColor() }]}
                        >
                            <View style={styles.resultHeader}>
                                <View style={[styles.resultIcon, { backgroundColor: `${getSeverityColor()}20` }]}>
                                    {result.isHarmful ? (
                                        <AlertTriangle color={getSeverityColor()} size={24} />
                                    ) : (
                                        <CheckCircle color={COLORS.success} size={24} />
                                    )}
                                </View>
                                <View style={styles.resultTitleContainer}>
                                    <Text style={styles.resultTitle}>
                                        {result.isHarmful ? `${result.severity.toUpperCase()} RISK` : 'SAFE'}
                                    </Text>
                                    <Text style={styles.resultScore}>
                                        Confidence: {Math.round(result.score * 100)}%
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.resultMessage}>{result.message}</Text>

                            {result.flags.length > 0 && (
                                <View style={styles.flagsContainer}>
                                    <Text style={styles.flagsLabel}>DETECTED TRIGGERS</Text>
                                    <View style={styles.tags}>
                                        {result.flags.map((flag, index) => (
                                            <View key={index} style={[styles.tag, { borderColor: getSeverityColor() }]}>
                                                <Text style={[styles.tagText, { color: getSeverityColor() }]}>
                                                    {flag.toUpperCase()}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {result.categories.length > 0 && (
                                <View style={styles.categoriesContainer}>
                                    <Text style={styles.categoriesLabel}>Categories: </Text>
                                    <Text style={styles.categoriesText}>
                                        {result.categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')}
                                    </Text>
                                </View>
                            )}

                            {result.recommendation && (
                                <View style={styles.recommendationBox}>
                                    <Info color={COLORS.primary} size={16} />
                                    <Text style={styles.recommendationText}>{result.recommendation}</Text>
                                </View>
                            )}
                        </LinearGradient>
                    )}

                    {!result && !loading && (
                        <View style={styles.tipBox}>
                            <Shield color={COLORS.primary} size={32} />
                            <Text style={styles.tipTitle}>How it works</Text>
                            <Text style={styles.tipText}>
                                Our AI analyzes text for harassment, threats, bullying, and other harmful patterns.
                                Paste any message to check if it contains potentially harmful content.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </TouchableWithoutFeedback>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.m,
        paddingBottom: 120,
    },
    header: {
        marginBottom: SPACING.l,
        marginTop: SPACING.s,
    },
    title: {
        color: COLORS.text,
        fontSize: 28,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: SPACING.xs,
    },
    inputContainer: {
        marginBottom: SPACING.l,
        position: 'relative',
    },
    input: {
        backgroundColor: COLORS.surfaceLight,
        color: COLORS.text,
        borderRadius: 20,
        padding: SPACING.m,
        paddingTop: SPACING.m,
        height: 140,
        textAlignVertical: 'top',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputIcon: {
        position: 'absolute',
        bottom: SPACING.m,
        right: SPACING.m,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 10,
        borderRadius: 50,
    },
    button: {
        marginBottom: SPACING.l,
    },
    resultBox: {
        padding: SPACING.l,
        borderRadius: 24,
        borderWidth: 1,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    resultIcon: {
        padding: 10,
        borderRadius: 50,
        marginRight: SPACING.m,
    },
    resultTitleContainer: {
        flex: 1,
    },
    resultTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    resultScore: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    resultMessage: {
        color: COLORS.text,
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.9,
    },
    flagsContainer: {
        marginTop: SPACING.l,
        paddingTop: SPACING.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    flagsLabel: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        letterSpacing: 1,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.xs,
        borderRadius: 20,
        marginRight: SPACING.s,
        marginBottom: SPACING.s,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    categoriesContainer: {
        flexDirection: 'row',
        marginTop: SPACING.m,
    },
    categoriesLabel: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    categoriesText: {
        color: COLORS.text,
        fontSize: 13,
        fontWeight: '600',
    },
    recommendationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        padding: SPACING.m,
        borderRadius: 16,
        marginTop: SPACING.l,
    },
    recommendationText: {
        color: COLORS.text,
        marginLeft: SPACING.s,
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    tipBox: {
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 24,
    },
    tipTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: SPACING.m,
        marginBottom: SPACING.s,
    },
    tipText: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default AnalyzeScreen;
