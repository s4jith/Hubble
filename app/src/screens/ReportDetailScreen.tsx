import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react-native';

interface ReportDetailScreenProps {
  navigation: any;
  route: {
    params: {
      reportId: string;
    };
  };
}

const ReportDetailScreen: React.FC<ReportDetailScreenProps> = ({ navigation, route }) => {
  const { reportId } = route.params;

  // Mock report data - BACKEND TODO: Fetch from API
  const report = {
    id: reportId,
    title: 'Suspicious Activity Detected',
    description: 'I noticed someone following my child from school today. The person was wearing a dark hoodie and kept a consistent distance of about 20 meters. This happened around 3:30 PM near the main gate of Sunshine Elementary School.',
    status: reportId === '1' ? 'resolved' : reportId === '2' ? 'pending' : 'investigating',
    date: '2024-01-15',
    time: '15:30',
    location: 'Sunshine Elementary School',
    priority: reportId === '1' ? 'high' : 'medium',
    images: [
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
      'https://images.unsplash.com/photo-1557804483-ef3ae78eca57?w=800',
    ],
    updates: [
      {
        date: '2024-01-16',
        status: 'investigating',
        message: 'Report received and assigned to local authorities',
      },
      {
        date: '2024-01-17',
        status: 'investigating',
        message: 'Security footage being reviewed',
      },
    ],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={24} color="#4CAF50" />;
      case 'investigating':
        return <Timer size={24} color="#FF9800" />;
      case 'pending':
        return <Clock size={24} color="#FFC107" />;
      default:
        return <AlertTriangle size={24} color="#FF4444" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#4CAF50';
      case 'investigating':
        return '#FF9800';
      case 'pending':
        return '#FFC107';
      default:
        return '#FF4444';
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Details</Text>
          <View style={{ width: 44 }} />
        </View>
      </BlurView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <BlurView intensity={40} tint="light" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon(report.status)}
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Report Details */}
        <BlurView intensity={40} tint="light" style={styles.detailsCard}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Calendar size={16} color="#666" />
              <Text style={styles.metaText}>{report.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.metaText}>{report.time}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#666" />
              <Text style={styles.metaText}>{report.location}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>

          {report.images && report.images.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Evidence</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.imagesContainer}
              >
                {report.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.evidenceImage}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </BlurView>

        {/* Updates Timeline */}
        <BlurView intensity={40} tint="light" style={styles.updatesCard}>
          <Text style={styles.sectionTitle}>Updates Timeline</Text>
          {report.updates.map((update, index) => (
            <View key={index} style={styles.updateItem}>
              <View style={styles.updateDot} />
              <View style={styles.updateContent}>
                <Text style={styles.updateDate}>{update.date}</Text>
                <Text style={styles.updateMessage}>{update.message}</Text>
              </View>
            </View>
          ))}
        </BlurView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {/* BACKEND TODO: Add comment functionality */}}
          >
            <Text style={styles.actionButtonText}>Add Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => {/* BACKEND TODO: Contact support */}}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.gradientButton}
            >
              <Text style={styles.primaryButtonText}>Contact Support</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Poppins-Bold',
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  statusCard: {
    borderRadius: 20,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Regular',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  detailsCard: {
    borderRadius: 20,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: SPACING.m,
    fontFamily: 'Poppins-Bold',
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: SPACING.l,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.m,
    fontFamily: 'Poppins-SemiBold',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
    marginBottom: SPACING.l,
    fontFamily: 'Poppins-Regular',
  },
  imagesContainer: {
    marginBottom: SPACING.m,
  },
  evidenceImage: {
    width: 200,
    height: 150,
    borderRadius: 16,
    marginRight: SPACING.m,
    backgroundColor: '#E0E0E0',
  },
  updatesCard: {
    borderRadius: 20,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: SPACING.m,
  },
  updateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    marginTop: 6,
    marginRight: SPACING.m,
  },
  updateContent: {
    flex: 1,
  },
  updateDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  updateMessage: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  actionButtons: {
    gap: SPACING.m,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingVertical: SPACING.m,
    fontFamily: 'Poppins-SemiBold',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
  },
  primaryButton: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  gradientButton: {
    paddingVertical: SPACING.m,
    alignItems: 'center',
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
   
    fontFamily: 'Poppins-Bold',
  },
});

export default ReportDetailScreen;
