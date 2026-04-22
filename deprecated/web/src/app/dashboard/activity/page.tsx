'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Activity } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function ActivityFeedPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    loadActivities();
  }, [isAuthenticated, user, router]);

  const loadActivities = async () => {
    try {
      const response = await apiClient.getActivityFeed({ limit: 50 });
      setActivities(response.data.incidents || []);
    } catch (error) {
      console.error('Failed to load activities', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (scanType: string) => {
    switch (scanType) {
      case 'text':
        return '💬';
      case 'image':
        return '🖼️';
      default:
        return '🔍';
    }
  };

  const getSeverityVariant = (severity: string) => {
    if (severity === 'high' || severity === 'critical') {
      return 'destructive';
    }
    return 'secondary';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No recent activities</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-4 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <div className="text-2xl">{getActivityIcon(activity.scanType)}</div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {activity.scanType === 'text' ? 'Text Scan' : 'Image Scan'}
                        {activity.analysis?.isAbusive && ' - Flagged Content'}
                      </div>
                      {activity.source && (
                        <div className="text-sm text-neutral-600 mb-1">
                          Source: {activity.source}
                          {activity.platform && ` (${activity.platform})`}
                        </div>
                      )}
                      <div className="text-sm text-neutral-700 mb-2 line-clamp-2">
                        {activity.content || 'No content preview'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {formatDate(activity.createdAt)} at {formatTime(activity.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {activity.severity && (
                        <Badge variant={getSeverityVariant(activity.severity)}>
                          {activity.severity}
                        </Badge>
                      )}
                      {activity.analysis?.isAbusive && (
                        <Badge variant="destructive">
                          Abusive
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
