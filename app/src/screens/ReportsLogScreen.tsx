import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { FileText, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';

interface Report {
  id: string;
  type: 'deepfake' | 'cyberbully' | 'threat';
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  description: string;
  date: string;
  reportedTo: string[];
}

interface ReportsScreenProps {
  navigation: any;
}

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      type: 'cyberbully',
      status: 'resolved',
      description: 'Abusive messages received on social media platform',
      date: '2025-12-10',
      reportedTo: ['School Authority', 'Platform Moderator'],
    },
    {
      id: '2',
      type: 'deepfake',
      status: 'reviewing',
      description: 'Fake images circulating on social media',
      date: '2025-12-12',
      reportedTo: ['Cyber Crime Branch'],
    },
  ]);

  // BACKEND TODO: Fetch user reports from API
  // GET /api/reports/user/:userId
  // Include filters for status: pending, reviewing, resolved, rejected
  // Implement pagination for large number of reports

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

  const filteredReports = reports.filter((report) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return report.status === 'pending' || report.status === 'reviewing';
    if (activeFilter === 'resolved') return report.status === 'resolved';
    return true;
  });

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportType}>
          <FileText size={16} color={COLORS.yellow} />
          <Text style={styles.reportTypeText}>{getTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          {getStatusIcon(item.status)}
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.reportDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.reportFooter}>
        <Text style={styles.reportDate}>{item.date}</Text>
        <View style={styles.reportedToContainer}>
          {item.reportedTo.map((authority, index) => (
            <View key={index} style={styles.authorityBadge}>
              <Text style={styles.authorityText}>{authority}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <Text style={styles.subtitle}>Track the status of your complaints</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => setActiveFilter('pending')}
        >
          <Text style={[styles.filterText, activeFilter === 'pending' && styles.filterTextActive]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'resolved' && styles.filterButtonActive]}
          onPress={() => setActiveFilter('resolved')}
        >
          <Text style={[styles.filterText, activeFilter === 'resolved' && styles.filterTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reportsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FileText size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>
              Your submitted complaints will appear here
            </Text>
          </View>
        }
      />
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginRight: SPACING.s,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  filterButtonActive: {
    backgroundColor: COLORS.yellow,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  reportsList: {
    padding: SPACING.l,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  reportType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTypeText: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
    borderRadius: 12,
  },
  statusText: {
    marginLeft: SPACING.xs,
    fontSize: 12,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.m,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  reportedToContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  authorityBadge: {
    backgroundColor: COLORS.surface,
    paddingVertical: 2,
    paddingHorizontal: SPACING.s,
    borderRadius: 8,
    marginLeft: SPACING.xs,
  },
  authorityText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
});

export default ReportsScreen;
