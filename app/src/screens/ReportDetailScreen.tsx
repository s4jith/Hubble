import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Building,
  MessageSquare,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportDetail'>;

interface Report {
  id: string;
  type: 'deepfake' | 'cyberbully' | 'threat';
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  description: string;
  date: string;
  reportedTo: string[];
  timeline?: {
    date: string;
    status: string;
    message: string;
  }[];
}

const ReportDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { reportId } = route.params;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // BACKEND TODO: Fetch report details from API
  // GET /api/reports/:reportId
  useEffect(() => {
    // Mock data for now
    const mockReport: Report = {
      id: reportId,
      type: 'cyberbully',
      status: 'reviewing',
      description: 'Abusive messages received on social media platform. The messages contained threatening language and personal attacks.',
      date: '2025-12-10',
      reportedTo: ['School Authority', 'Platform Moderator'],
      timeline: [
        {
          date: '2025-12-10',
          status: 'pending',
          message: 'Report submitted successfully',
        },
        {
          date: '2025-12-11',
          status: 'reviewing',
          message: 'Your report is being reviewed by the authorities',
        },
      ],
    };
    setReport(mockReport);
    setLoading(false);
  }, [reportId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} color={COLORS.yellow} />;
      case 'reviewing':
        return <AlertCircle size={20} color={COLORS.yellow} />;
      case 'resolved':
        return <CheckCircle size={20} color={COLORS.success} />;
      case 'rejected':
        return <XCircle size={20} color={COLORS.red} />;
      default:
        return <FileText size={20} color={COLORS.textSecondary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.yellow;
      case 'reviewing':
        return COLORS.yellow;
      case 'resolved':
        return COLORS.success;
      case 'rejected':
        return COLORS.red;
      default:
        return COLORS.textSecondary;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deepfake':
        return 'Deepfake';
      case 'cyberbully':
        return 'Cyberbullying';
      case 'threat':
        return 'Threat';
      default:
        return type;
    }
  };

  if (loading || !report) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Report Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.reportType}>
              <FileText size={20} color={COLORS.yellow} />
              <Text style={styles.reportTypeText}>{getTypeLabel(report.type)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
              {getStatusIcon(report.status)}
              <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.descriptionText}>{report.description}</Text>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>Date Submitted</Text>
          </View>
          <Text style={styles.dateText}>{report.date}</Text>
        </View>

        {/* Reported To Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Building size={18} color={COLORS.textSecondary} />
            <Text style={styles.sectionTitle}>Reported To</Text>
          </View>
          <View style={styles.authoritiesContainer}>
            {report.reportedTo.map((authority, index) => (
              <View key={index} style={styles.authorityBadge}>
                <Text style={styles.authorityText}>{authority}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline Section */}
        {report.timeline && report.timeline.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={COLORS.textSecondary} />
              <Text style={styles.sectionTitle}>Timeline</Text>
            </View>
            <View style={styles.timeline}>
              {report.timeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    {getStatusIcon(item.status)}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>{item.date}</Text>
                    <Text style={styles.timelineMessage}>{item.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xxl + SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  reportTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 15,
    color: COLORS.text,
  },
  authoritiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  authorityBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  authorityText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  timeline: {
    gap: SPACING.m,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  timelineMessage: {
    fontSize: 14,
    color: COLORS.text,
  },
});

export default ReportDetailScreen;
