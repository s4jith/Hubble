import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import {
  Info,
  Shield,
  Users,
  Heart,
  Mail,
  Globe,
  LogOut,
  ChevronRight,
  MessageCircle,
  BookOpen,
  Award,
} from 'lucide-react-native';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

interface AboutScreenProps {
  navigation: any;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const features = [
    {
      icon: Shield,
      title: 'Real-time Protection',
      description: 'AI-powered detection of cyberbullying, deepfakes, and online threats',
    },
    {
      icon: MessageCircle,
      title: 'Smart Chatbot',
      description: 'Personalized support based on your needs - whether you need emotional support or behavior guidance',
    },
    {
      icon: BookOpen,
      title: 'Educational Resources',
      description: 'Learn about online safety, digital wellness, and how to protect yourself',
    },
    {
      icon: Award,
      title: 'Community Support',
      description: 'Connect with others, share experiences, and build a safer online environment together',
    },
  ];

  const team = [
    { name: 'Hubble Team', role: 'Development & Design' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Shield size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Hubble</Text>
        <Text style={styles.tagline}>Protecting Digital Lives</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Heart size={24} color={COLORS.red} />
            <Text style={styles.missionText}>
              Hubble is dedicated to creating a safer digital environment for everyone. 
              We use advanced AI technology to detect and prevent cyberbullying, identify 
              deepfakes, and protect users from online threats. Our goal is to empower 
              individuals to navigate the digital world with confidence and security.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <feature.icon size={24} color={COLORS.primary} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('mailto:support@hubbleapp.com')}
          >
            <View style={styles.contactIcon}>
              <Mail size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.contactText}>support@hubbleapp.com</Text>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('https://hubbleapp.com')}
          >
            <View style={styles.contactIcon}>
              <Globe size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.contactText}>www.hubbleapp.com</Text>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Important Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Links</Text>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Help & Support</Text>
            <ChevronRight size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Hubble. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            Made with ❤️ for a safer internet
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.l,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  version: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  missionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.l,
    flexDirection: 'row',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  missionText: {
    flex: 1,
    marginLeft: SPACING.m,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  featureCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    flexDirection: 'row',
    marginBottom: SPACING.s,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  contactItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    marginLeft: SPACING.m,
    fontSize: 14,
    color: COLORS.text,
  },
  linkItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.l,
    marginTop: SPACING.l,
    padding: SPACING.m,
    borderRadius: 12,
    backgroundColor: COLORS.red + '15',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red,
    marginLeft: SPACING.s,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});

export default AboutScreen;
