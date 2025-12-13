'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Eye, Plus, Scan, History, Activity, FileWarning } from 'lucide-react';

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
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Children</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-600" />
                <div className="text-3xl font-bold">{children.length}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/alerts')}>
            <CardHeader className="pb-2">
              <CardDescription>Active Alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">
                  {dashboard?.activeAlerts || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/scan-history')}>
            <CardHeader className="pb-2">
              <CardDescription>Total Scans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-neutral-600" />
                <div className="text-3xl font-bold">{dashboard?.totalScans || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/incidents')}>
            <CardHeader className="pb-2">
              <CardDescription>Incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">
                  {dashboard?.totalIncidents || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-3">
              <Button className="w-full" onClick={() => router.push('/dashboard/scan')}>
                <Scan className="w-4 h-4 mr-2" />
                Scan Content
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/scan-history')}>
                <History className="w-4 h-4 mr-2" />
                Scan History
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/activity')}>
                <Activity className="w-4 h-4 mr-2" />
                Activity Feed
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/incidents')}>
                <FileWarning className="w-4 h-4 mr-2" />
                Incidents
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
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
                <div className="space-y-3">
                  {children.map((child) => (
                    <div
                      key={child.id || child._id}
                      className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/children/${child.id || child._id}`)}
                    >
                      <div>
                        <div className="font-medium">
                          {child.firstName} {child.lastName}
                        </div>
                        <div className="text-sm text-neutral-500">@{child.username}</div>
                      </div>
                      <Button variant="ghost" size="sm">
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
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id || alert._id}
                      className="p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'high'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-1">{alert.type}</div>
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
