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
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-neutral-600">Name</div>
                <div className="font-medium">
                  {child.firstName} {child.lastName}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Username</div>
                <div className="font-medium">@{child.username}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Date of Birth</div>
                <div className="font-medium">
                  {child.dateOfBirth ? formatDate(child.dateOfBirth) : 'Not set'}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Status</div>
                <Badge variant={child.isActive ? 'default' : 'secondary'}>
                  {child.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Activity Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-neutral-600">Total Scans</div>
                <div className="text-2xl font-bold">{scans.length}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-600">Flagged Content</div>
                <div className="text-2xl font-bold text-red-600">
                  {scans.filter((s) => s.isAbusive).length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/dashboard/alerts?childId=${child.id}`)}
              >
                View Alerts
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push('/dashboard/scan')}
              >
                Scan Content
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            {scans.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No scan history available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.map((scan) => (
                    <TableRow key={scan.id || scan._id}>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(scan.createdAt)}</div>
                          <div className="text-neutral-500">{formatTime(scan.createdAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{scan.contentType || 'Text'}</TableCell>
                      <TableCell>{scan.source || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={scan.isAbusive ? 'destructive' : 'secondary'}>
                          {scan.isAbusive ? 'Flagged' : 'Safe'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {scan.severity && (
                          <span className={`font-medium ${getSeverityColor(scan.severity)}`}>
                            {scan.severity}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
