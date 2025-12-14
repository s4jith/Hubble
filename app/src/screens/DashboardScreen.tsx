import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  Users,
  MessageCircle,
  FileText,
  Lock,
  Eye,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setStats, setSecurityTips } from '../store/slices/dashboardSlice';
import { setUserScore } from '../store/slices/chatSlice';
import mockData from '../data/mockData.json';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  navigation: any;
}

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

interface SecurityTip {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const dispatch = useAppDispatch();
  const { stats: dashStats, securityTips: tips } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // BACKEND TODO: Replace with actual API call
    // Fetch dashboard stats from GET /api/dashboard/stats
    // Load user-specific statistics and alerts
    dispatch(setStats({
      totalReports: 24,
      activeAlerts: 3,
      resolved: 18,
      pending: 6,
      weeklyChange: 12,
    }));
    
    // Set security tips
    dispatch(setSecurityTips([
      { id: 'tip_1', title: 'Protect Your Privacy', content: 'Never share personal information with strangers online', category: 'privacy' as const, isRead: false },
      { id: 'tip_2', title: 'Strong Passwords', content: 'Use strong and unique passwords for each account', category: 'safety' as const, isRead: false },
      { id: 'tip_3', title: 'Two-Factor Auth', content: 'Enable two-factor authentication wherever possible', category: 'safety' as const, isRead: true },
    ]));
    
    // Load user's cyberbullying score into chat state
    // BACKEND TODO: Get from /api/user/score endpoint
    dispatch(setUserScore(20));

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, []);

  // Using Redux state loaded from mock data
  const stats: StatCard[] = [
    {
      title: 'Total Reports',
      value: String(dashStats.totalReports),
      change: '+3 this week',
      icon: FileText,
      color: COLORS.primary,
    },
    {
      title: 'Active Alerts',
      value: String(dashStats.activeAlerts),
      change: 'Urgent',
      icon: AlertTriangle,
      color: COLORS.secondary,
    },
    {
      title: 'Resolved',
      value: String(dashStats.resolved),
      change: '+8 this month',
      icon: Shield,
      color: '#10B981',
    },
    {
      title: 'Pending',
      value: String(dashStats.pending),
      change: 'In progress',
      icon: TrendingUp,
      color: COLORS.accent,
    },
  ];

  // Using Redux security tips from mock data
  const securityTips: SecurityTip[] = tips.slice(0, 3).map((tip, index) => ({
    id: tip.id || String(index + 1),
    title: tip.title || tip.content,
    description: tip.content,
    icon: index === 0 ? Lock : index === 1 ? AlertTriangle : Eye,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'James'}</Text>
            <Text style={styles.subtitle}>Stay safe and informed</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileText}>J</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ChatBot')}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.actionGradient}
            >
              <MessageCircle size={24} color={COLORS.white} />
              <Text style={styles.actionText}>Talk with Echo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ComplaintUpload')}
          >
            <LinearGradient
              colors={['#FF4444', '#FF6666']}
              style={styles.actionGradient}
            >
              <FileText size={24} color={COLORS.white} />
              <Text style={styles.actionText}>File Complaint</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <stat.icon size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statChange}>{stat.change}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Security Tips</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {securityTips.map((tip) => (
            <View key={tip.id} style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <tip.icon size={24} color={COLORS.yellow} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Cyber Updates</Text>
          
          <TouchableOpacity style={styles.updateCard}>
            <View style={styles.updateHeader}>
              <View style={styles.updateBadge}>
                <TrendingUp size={16} color={COLORS.red} />
                <Text style={styles.updateBadgeText}>Alert</Text>
              </View>
              <Text style={styles.updateTime}>2h ago</Text>
            </View>
            <Text style={styles.updateTitle}>
              New Phishing Campaign Targeting Students
            </Text>
            <Text style={styles.updateDescription}>
              Be aware of emails claiming to be from educational institutions asking for account verification.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.updateCard}>
            <View style={styles.updateHeader}>
              <View style={[styles.updateBadge, { backgroundColor: COLORS.success + '20' }]}>
                <Shield size={16} color={COLORS.success} />
                <Text style={[styles.updateBadgeText, { color: COLORS.success }]}>Info</Text>
              </View>
              <Text style={styles.updateTime}>1d ago</Text>
            </View>
            <Text style={styles.updateTitle}>
              Tips to Protect Your Digital Identity
            </Text>
            <Text style={styles.updateDescription}>
              Learn how to secure your online presence and maintain privacy on social media platforms.
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: SPACING.xxl + SPACING.m,
    paddingBottom: SPACING.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  profileButton: {
    width: 48,
    height: 48,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.yellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  content: {
    padding: SPACING.l,
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: SPACING.l,
    gap: SPACING.m,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.s,
  },
  section: {
    marginBottom: SPACING.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.yellow,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  statCard: {
    width: (width - SPACING.l * 2 - SPACING.xs * 2) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    margin: SPACING.xs,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statChange: {
    fontSize: 11,
    color: COLORS.success,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.yellow + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  tipDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  updateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red + '20',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
    borderRadius: 12,
  },
  updateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.red,
    marginLeft: SPACING.xs,
  },
  updateTime: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  updateDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
});

export default DashboardScreen;
