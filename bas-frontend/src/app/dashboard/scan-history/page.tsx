'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Eye, Filter } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function ScanHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'safe'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    loadScans();
  }, [filter, page, isAuthenticated, user, router]);

  const loadScans = async () => {
    try {
      const params: any = { page, limit: 20 };
      if (filter === 'flagged') params.isAbusive = true;
      if (filter === 'safe') params.isAbusive = false;

      const response = await apiClient.getScanHistory(params);
      setScans(response.data.scans || []);
    } catch (error) {
      console.error('Failed to load scan history', error);
    } finally {
      setLoading(false);
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
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Scan History
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'flagged' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('flagged')}
                >
                  Flagged
                </Button>
                <Button
                  variant={filter === 'safe' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('safe')}
                >
                  Safe
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {scans.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No scan history found</p>
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
                    <TableHead>Confidence</TableHead>
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
                          <Badge variant={scan.severity === 'high' ? 'destructive' : 'outline'}>
                            {scan.severity}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {scan.confidenceScore && `${(scan.confidenceScore * 100).toFixed(1)}%`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {scans.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-neutral-600">Page {page}</span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={scans.length < 20}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
