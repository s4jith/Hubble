import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import {
  ChevronRight,
  Bell,
  Shield,
  User,
  LogOut,
  Lock,
  HelpCircle,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface SettingsScreenNewProps {
  navigation: any;
}

const SettingsScreenNew: React.FC<SettingsScreenNewProps> = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    // BACKEND TODO: Implement logout functionality
    // Clear auth token from secure storage
    // Call logout API endpoint: POST /api/auth/logout
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // Navigation will happen automatically via AuthContext state change
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile Settings', action: () => {} },
        { icon: Bell, label: 'Notifications', action: () => {} },
        { icon: Shield, label: 'Privacy & Security', action: () => {} },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: Lock, label: 'Permissions', action: () => {} },
        { icon: HelpCircle, label: 'Help & Support', action: () => {} },
        { icon: Info, label: 'About', action: () => {} },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={styles.settingItem}
                onPress={item.action}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <item.icon size={20} color={COLORS.yellow} />
                  </View>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.version}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionSubtext}>
            Hubble - Cyberbullying Detection
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
    paddingTop: SPACING.xxl + SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    backgroundColor: COLORS.white,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: SPACING.m,
    borderRadius: 12,
    marginBottom: SPACING.s,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.yellow + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.l,
    marginTop: SPACING.xl,
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
  version: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  versionSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});

export default SettingsScreenNew;
