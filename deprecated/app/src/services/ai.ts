// Enhanced AI Analysis Service with more comprehensive detection

interface Pattern {
    keywords: string[];
    weight: number;
}

interface Patterns {
    [key: string]: Pattern;
}

const OFFENSIVE_PATTERNS: Patterns = {
    severe: {
        keywords: ['kill', 'die', 'suicide', 'murder', 'shoot', 'stab'],
        weight: 1.0,
    },
    threats: {
        keywords: ['hurt', 'beat', 'attack', 'destroy', 'punch', 'fight'],
        weight: 0.8,
    },
    harassment: {
        keywords: ['hate', 'stupid', 'idiot', 'dumb', 'loser', 'ugly', 'fat', 'useless', 'worthless', 'pathetic'],
        weight: 0.6,
    },
    bullying: {
        keywords: ['nobody likes', 'everyone hates', 'go away', 'shut up', 'you suck', 'freak', 'weirdo'],
        weight: 0.7,
    },
};

const POSITIVE_PATTERNS = ['love', 'great', 'awesome', 'wonderful', 'friend', 'help', 'support', 'kind', 'nice'];

export interface AnalysisResult {
    isHarmful: boolean;
    score: number;
    flags: string[];
    categories: string[];
    severity: 'high' | 'medium' | 'low' | 'safe';
    message: string;
    recommendation: string | null;
}

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const lowerText = text.toLowerCase();
    let maxSeverity = 0;
    let detectedFlags: string[] = [];
    let categories: string[] = [];

    // Check for offensive patterns
    Object.entries(OFFENSIVE_PATTERNS).forEach(([category, { keywords, weight }]) => {
        const found = keywords.filter(word => lowerText.includes(word));
        if (found.length > 0) {
            detectedFlags.push(...found);
            categories.push(category);
            const severity = weight * (1 + found.length * 0.1);
            if (severity > maxSeverity) maxSeverity = severity;
        }
    });

    // Check for positive content
    const positiveFound = POSITIVE_PATTERNS.filter(word => lowerText.includes(word));
    const hasPositive = positiveFound.length > 0;

    if (detectedFlags.length > 0) {
        let severityLevel: AnalysisResult['severity'] = 'low';
        if (maxSeverity >= 0.8) severityLevel = 'high';
        else if (maxSeverity >= 0.6) severityLevel = 'medium';

        return {
            isHarmful: true,
            score: Math.min(maxSeverity, 1),
            flags: [...new Set(detectedFlags)],
            categories: [...new Set(categories)],
            severity: severityLevel,
            message: getSeverityMessage(severityLevel, categories),
            recommendation: getRecommendation(severityLevel),
        };
    }

    return {
        isHarmful: false,
        score: hasPositive ? 0.0 : 0.1,
        flags: [],
        categories: hasPositive ? ['positive'] : [],
        severity: 'safe',
        message: hasPositive
            ? 'This content appears positive and supportive!'
            : 'Content appears safe. No harmful patterns detected.',
        recommendation: null,
    };
};

const getSeverityMessage = (severity: string, categories: string[]): string => {
    const categoryText = categories.join(', ');
    switch (severity) {
        case 'high':
            return `⚠️ Critical Alert: Detected severe ${categoryText} content. Immediate attention may be required.`;
        case 'medium':
            return `Warning: Detected ${categoryText} patterns. This content may be harmful.`;
        default:
            return `Notice: Detected mild ${categoryText} language. Use caution.`;
    }
};

const getRecommendation = (severity: string): string => {
    switch (severity) {
        case 'high':
            return 'Consider reporting this content and reaching out to a trusted adult or support resource.';
        case 'medium':
            return 'You may want to block or mute this sender and discuss with someone you trust.';
        default:
            return 'Stay aware and don\'t hesitate to report if the behavior continues.';
    }
};

export interface AlertItem {
    id: number;
    message: string;
    timestamp: string;
    severity: 'high' | 'medium' | 'low';
    source: string;
    category: string;
}

export const getMockMonitoringData = (): AlertItem[] => {
    return [
        {
            id: 1,
            message: "You are so stupid, nobody likes you.",
            timestamp: "2 mins ago",
            severity: "high",
            source: "Social Media",
            category: "harassment"
        },
        {
            id: 2,
            message: "Why don't you just disappear?",
            timestamp: "15 mins ago",
            severity: "high",
            source: "Direct Message",
            category: "threats"
        },
        {
            id: 3,
            message: "That photo is so ugly.",
            timestamp: "1 hour ago",
            severity: "medium",
            source: "Comment",
            category: "bullying"
        },
        {
            id: 4,
            message: "You're such a loser, go away.",
            timestamp: "2 hours ago",
            severity: "medium",
            source: "Group Chat",
            category: "harassment"
        },
        {
            id: 5,
            message: "Nobody wants you here, freak.",
            timestamp: "3 hours ago",
            severity: "high",
            source: "Social Media",
            category: "bullying"
        },
    ];
};

export const getWeeklyStats = () => {
    return {
        totalScanned: 1240,
        flagged: 12,
        blocked: 5,
        safetyScore: 98,
        trend: 'improving',
        weeklyChange: +3,
    };
};
