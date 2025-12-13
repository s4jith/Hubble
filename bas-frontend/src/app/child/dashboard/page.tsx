'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, LogOut, User, Eye, Activity, Calendar, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function ChildDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'child') {
      router.push('/login');
      return;
    }

    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      const [profileRes, scansRes] = await Promise.all([
        apiClient.getChildProfile(),
        apiClient.getChildOwnScanHistory({ limit: 20 }),
      ]);

      setProfile(profileRes.data);
      setScans(scansRes.data.scans || []);
    } catch (error) {
      console.error('Failed to load data', error);
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
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8" />
              <span className="text-2xl font-bold">Hubble</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.firstName}! 👋
          </h1>
          <p className="text-neutral-600">
            Your safety dashboard - Stay protected online
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-neutral-600" />
                <div className="text-3xl font-bold">{scans.length}</div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">Content checks performed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Safe Content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">
                  {scans.filter(s => !s.isAbusive).length}
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">No issues detected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Flagged Items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">
                  {scans.filter(s => s.isAbusive).length}
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-2">Content reviewed by parent</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-neutral-900 text-white flex items-center justify-center text-2xl font-bold">
                      {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Full Name</div>
                      <div className="font-medium">
                        {profile?.firstName} {profile?.lastName}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Username</div>
                      <div className="font-medium">@{profile?.username}</div>
                    </div>

                    {profile?.dateOfBirth && (
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">Date of Birth</div>
                        <div className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(profile.dateOfBirth)}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Account Type</div>
                      <Badge variant="secondary">
                        <Lock className="w-3 h-3 mr-1" />
                        Protected Child Account
                      </Badge>
                    </div>

                    {profile?.isActive !== undefined && (
                      <div>
                        <div className="text-xs text-neutral-500 mb-1">Status</div>
                        <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                          {profile.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Notice */}
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
                  <Info className="w-4 h-4" />
                  Safety Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-blue-900">
                  <p>
                    🛡️ Your parent monitors your online activity to keep you safe
                  </p>
                  <p>
                    💬 If you see something that makes you uncomfortable, tell a trusted adult
                  </p>
                  <p>
                    🚨 Never share personal information with strangers online
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity History */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent online content checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scans.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium mb-1">No activity yet</p>
                    <p className="text-sm">Your activity will appear here when content is checked</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scans.map((scan, index) => (
                          <TableRow key={scan.id || scan._id || index}>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{formatDate(scan.createdAt)}</div>
                                <div className="text-neutral-500">{formatTime(scan.createdAt)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {scan.contentType || 'Text'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {scan.source || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {scan.isAbusive ? (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm text-orange-600 font-medium">Reviewed</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  <span className="text-sm text-green-600 font-medium">Safe</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-6 border-2 border-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-semibold mb-2">Talk to Your Parent</h4>
                <p className="text-sm text-neutral-600">
                  Your parent is here to help you stay safe online. Don't hesitate to ask questions!
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-semibold mb-2">Feeling Unsafe?</h4>
                <p className="text-sm text-neutral-600">
                  If someone is bothering you online, tell a trusted adult immediately.
                </p>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <h4 className="font-semibold mb-2">Privacy Tips</h4>
                <p className="text-sm text-neutral-600">
                  Never share passwords, addresses, or personal photos with people you don't know.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
