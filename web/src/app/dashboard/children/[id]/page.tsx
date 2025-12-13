'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye, AlertTriangle, User } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [child, setChild] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    loadChildData();
  }, [params.id, isAuthenticated, user, router]);

  const loadChildData = async () => {
    try {
      const [childRes, scansRes] = await Promise.all([
        apiClient.getChildById(params.id as string),
        apiClient.getChildScanHistory(params.id as string, { limit: 20 }),
      ]);

      setChild(childRes.data.child);
      setScans(scansRes.data.scans || []);
    } catch (error) {
      console.error('Failed to load child data', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-neutral-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-neutral-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">Child not found</p>
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Button 
          variant="ghost" 
          className="mb-4 sm:mb-6 transition-all duration-150 active:scale-95" 
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card className="transition-all duration-150 hover:shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              <div>
                <div className="text-xs sm:text-sm text-neutral-600">Name</div>
                <div className="font-medium text-sm sm:text-base truncate">
                  {child.firstName} {child.lastName}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-neutral-600">Username</div>
                <div className="font-medium text-sm sm:text-base truncate">@{child.username}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-neutral-600">Date of Birth</div>
                <div className="font-medium text-sm sm:text-base">
                  {child.dateOfBirth ? formatDate(child.dateOfBirth) : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-neutral-600">Status</div>
                <Badge variant={child.isActive ? 'default' : 'secondary'} className="text-xs">
                  {child.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-150 hover:shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Activity Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              <div>
                <div className="text-xs sm:text-sm text-neutral-600">Total Scans</div>
                <div className="text-2xl sm:text-3xl font-bold">{scans.length}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-neutral-600">Flagged Content</div>
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  {scans.filter((s) => s.isAbusive).length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-150 hover:shadow-md sm:col-span-2 lg:col-span-1">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 sm:p-6 pt-0">
              <Button
                className="w-full transition-all duration-150 active:scale-95"
                variant="outline"
                onClick={() => router.push(`/dashboard/alerts?childId=${child.id}`)}
              >
                View Alerts
              </Button>
              <Button
                className="w-full transition-all duration-150 active:scale-95"
                variant="outline"
                onClick={() => router.push('/dashboard/scan')}
              >
                Scan Content
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="transition-all duration-150">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Scan History</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {scans.length === 0 ? (
              <div className="text-center py-12 px-4 text-neutral-500">
                <Eye className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">No scan history available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm">Type</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Source</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan) => (
                      <TableRow key={scan.id || scan._id} className="hover:bg-neutral-50">
                        <TableCell className="py-3">
                          <div className="text-xs sm:text-sm">
                            <div className="font-medium">{formatDate(scan.createdAt)}</div>
                            <div className="text-neutral-500 text-xs">{formatTime(scan.createdAt)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm py-3">{scan.contentType || 'Text'}</TableCell>
                        <TableCell className="text-xs sm:text-sm py-3 hidden sm:table-cell">{scan.source || 'Unknown'}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant={scan.isAbusive ? 'destructive' : 'secondary'} className="text-xs">
                            {scan.isAbusive ? 'Flagged' : 'Safe'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 hidden md:table-cell">
                          {scan.severity && (
                            <span className={`font-medium text-xs sm:text-sm ${getSeverityColor(scan.severity)}`}>
                              {scan.severity}
                            </span>
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
  );
}
