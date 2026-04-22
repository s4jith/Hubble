import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit2,
  Check,
  X,
  Camera,
} from 'lucide-react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateUser, updateUserProfile } from '../store/slices/authSlice';
import { 
  setProfileInfo, 
  saveProfileStart, 
  saveProfileSuccess, 
  setEditing 
} from '../store/slices/profileSlice';

interface ProfileScreenProps {
  navigation: any;
}

interface ProfileField {
  key: string;
  label: string;
  value: string;
  icon: any;
  editable: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const profile = useAppSelector((state) => state.profile);
  const { userScore } = useAppSelector((state) => state.chat);
  
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [editedFields, setEditedFields] = useState({
    name: user?.name || 'James Wilson',
    email: user?.email || 'james@example.com',
    phone: profile.phone || '+91 98765 43210',
    location: profile.location || 'Mumbai, India',
    dateOfBirth: profile.dateOfBirth || '15 Jan 2010',
  });

  // Sync with Redux state
  useEffect(() => {
    setEditedFields({
      name: user?.name || 'James Wilson',
      email: user?.email || 'james@example.com',
      phone: profile.phone || '+91 98765 43210',
      location: profile.location || 'Mumbai, India',
      dateOfBirth: profile.dateOfBirth || '15 Jan 2010',
    });
  }, [user, profile]);

  const profileFields: ProfileField[] = [
    { key: 'name', label: 'Full Name', value: editedFields.name, icon: User, editable: true },
    { key: 'email', label: 'Email Address', value: editedFields.email, icon: Mail, editable: true, keyboardType: 'email-address' },
    { key: 'phone', label: 'Phone Number', value: editedFields.phone, icon: Phone, editable: true, keyboardType: 'phone-pad' },
    { key: 'location', label: 'Location', value: editedFields.location, icon: MapPin, editable: true },
    { key: 'dateOfBirth', label: 'Date of Birth', value: editedFields.dateOfBirth, icon: Calendar, editable: true },
  ];

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    dispatch(saveProfileStart());
    
    // Update auth user data
    if (user) {
      dispatch(updateUser({
        name: editedFields.name,
        email: editedFields.email,
      }));
    }
    
    // Update profile data
    dispatch(setProfileInfo({
      phone: editedFields.phone,
      location: editedFields.location,
      dateOfBirth: editedFields.dateOfBirth,
    }));
    
    dispatch(saveProfileSuccess());
    setIsEditingLocal(false);
    dispatch(setEditing(false));
    Alert.alert('Success', 'Your profile has been updated successfully!');
  };

  const handleCancel = () => {
    // Reset to original values from Redux state
    setEditedFields({
      name: user?.name || 'James Wilson',
      email: user?.email || 'james@example.com',
      phone: profile.phone || '+91 98765 43210',
      location: profile.location || 'Mumbai, India',
      dateOfBirth: profile.dateOfBirth || '15 Jan 2010',
    });
    setIsEditingLocal(false);
    dispatch(setEditing(false));
  };

  const handleChangePhoto = () => {
    // BACKEND TODO: Implement photo picker and upload
    Alert.alert('Change Photo', 'Photo upload functionality coming soon!');
  };

  // Get stats from user or use defaults
  const stats = user?.stats || {
    reportsFiled: 12,
    reportsResolved: 8,
    daysActive: 45,
    safetyScore: userScore.score,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditingLocal ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              setIsEditingLocal(true);
              dispatch(setEditing(true));
            }}
          >
            <Edit2 size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <X size={20} color={COLORS.red} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Check size={20} color={COLORS.success} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {editedFields.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            {isEditingLocal && (
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
              >
                <Camera size={16} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.userName}>{editedFields.name}</Text>
          <View style={styles.roleBadge}>
            <Shield size={14} color={COLORS.primary} />
            <Text style={styles.roleText}>{user?.role || 'User'}</Text>
          </View>
        </View>

        {/* Profile Fields */}
        <View style={styles.fieldsSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {profileFields.map((field, index) => (
            <View key={field.key} style={styles.fieldCard}>
              <View style={styles.fieldIcon}>
                <field.icon size={20} color={COLORS.primary} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {isEditingLocal && field.editable ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={field.value}
                    onChangeText={(text) => handleFieldChange(field.key, text)}
                    keyboardType={field.keyboardType || 'default'}
                    placeholderTextColor={COLORS.textLight}
                  />
                ) : (
                  <Text style={styles.fieldValue}>{field.value}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Account Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Account Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.reportsFiled}</Text>
              <Text style={styles.statLabel}>Reports Filed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.reportsResolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.daysActive}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
          </View>
        </View>

        {/* Safety Score */}
        <View style={styles.safetySection}>
          <Text style={styles.sectionTitle}>Safety Score</Text>
          <View style={styles.safetyCard}>
            <View style={styles.safetyScoreContainer}>
              <Text style={[
                styles.safetyScore, 
                { color: userScore.category === 'victim' ? COLORS.success : 
                         userScore.category === 'bully' ? COLORS.red : COLORS.primary }
              ]}>
                {stats.safetyScore}
              </Text>
              <Text style={styles.safetyScoreMax}>/100</Text>
            </View>
            <Text style={styles.safetyLabel}>Your online safety rating</Text>
            <View style={styles.safetyBar}>
              <View style={[
                styles.safetyProgress, 
                { 
                  width: `${stats.safetyScore}%`,
                  backgroundColor: userScore.category === 'victim' ? COLORS.success : 
                                   userScore.category === 'bully' ? COLORS.red : COLORS.primary
                }
              ]} />
            </View>
            <Text style={styles.safetyHint}>
              {userScore.category === 'victim' 
                ? "We're here to support you. You're doing great!" 
                : userScore.category === 'bully'
                ? "Let's work together to improve your online behavior."
                : "Keep engaging with safety features to improve your score!"}
            </Text>
          </View>
        </View>

        {/* Spacer for bottom padding */}
        <View style={{ height: SPACING.xxl }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl + SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.red + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.m,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    marginTop: SPACING.s,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    textTransform: 'capitalize',
  },
  fieldsSection: {
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
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  fieldValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: SPACING.xs,
  },
  statsSection: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  safetySection: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
  },
  safetyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.l,
    alignItems: 'center',
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
  safetyScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  safetyScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  safetyScoreMax: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  safetyLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  safetyBar: {
    width: '100%',
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    marginTop: SPACING.m,
    overflow: 'hidden',
  },
  safetyProgress: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  safetyHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
});

export default ProfileScreen;
