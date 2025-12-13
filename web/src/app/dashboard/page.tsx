'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Eye, Plus, History, Activity, FileWarning } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  const loadDashboardData = async () => {
    try {
      const [dashboardRes, childrenRes, alertsRes] = await Promise.all([
        apiClient.getDashboardSummary(),
        apiClient.getChildren(),
        apiClient.getAlerts({ limit: 5 }),
      ]);

      setDashboard(dashboardRes.data.summary);
      setChildren(childrenRes.data.children);
      setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-100">
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Total Children</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 shrink-0" />
                <div className="text-2xl sm:text-3xl font-bold">{children.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-100" onClick={() => router.push('/dashboard/alerts')}>
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Active Alerts</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0" />
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  {dashboard?.activeAlerts || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-100" onClick={() => router.push('/dashboard/scan-history')}>
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Total Scans</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 shrink-0" />
                <div className="text-2xl sm:text-3xl font-bold">{dashboard?.totalScans || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-100" onClick={() => router.push('/dashboard/incidents')}>
            <CardHeader className="pb-2 p-4 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Incidents</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 shrink-0" />
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {dashboard?.totalIncidents || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              <Button variant="outline" className="w-full text-xs sm:text-sm" onClick={() => router.push('/dashboard/scan-history')}>
                <History className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Scan History</span>
                <span className="xs:hidden">History</span>
              </Button>
              <Button variant="outline" className="w-full text-xs sm:text-sm" onClick={() => router.push('/dashboard/activity')}>
                <Activity className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Activity</span>
                <span className="xs:hidden">Activity</span>
              </Button>
              <Button variant="outline" className="w-full text-xs sm:text-sm" onClick={() => router.push('/dashboard/incidents')}>
                <FileWarning className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Incidents</span>
                <span className="xs:hidden">Incidents</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Children List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Children</CardTitle>
                <Button size="sm" onClick={() => router.push('/dashboard/children/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No children added yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/dashboard/children/add')}
                  >
                    Add your first child
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {children.map((child) => (
                    <div
                      key={child.id || child._id}
                      className="flex items-center justify-between p-3 sm:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer transition-all duration-150 hover:shadow-sm active:scale-[0.99]"
                      onClick={() => router.push(`/dashboard/children/${child.id || child._id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {child.firstName} {child.lastName}
                        </div>
                        <div className="text-xs sm:text-sm text-neutral-500 truncate">@{child.username}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 ml-2">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Alerts</CardTitle>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push('/dashboard/alerts')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent alerts</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id || alert._id}
                      className="p-3 sm:p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all duration-150 hover:shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-neutral-500 shrink-0">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-medium mb-1 truncate">{alert.type}</div>
                      <div className="text-xs text-neutral-600 line-clamp-2">
                        {alert.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
