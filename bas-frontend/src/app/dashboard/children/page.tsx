'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Eye, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ChildrenPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'parent') {
      router.push('/login');
      return;
    }

    loadChildren();
  }, [isAuthenticated, user, router]);

  const loadChildren = async () => {
    try {
      const response = await apiClient.getChildren();
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Failed to load children', error);
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
      <div className="container mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Children</h1>
            <p className="text-neutral-600">Manage your children's accounts and monitor their activity</p>
          </div>
          <Button onClick={() => router.push('/dashboard/children/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-neutral-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No children added yet</h3>
                <p className="mb-6">Start monitoring your child's online safety by adding their account</p>
                <Button onClick={() => router.push('/dashboard/children/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Child
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <Card 
                key={child.id || child._id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/children/${child.id || child._id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {child.firstName} {child.lastName}
                      </CardTitle>
                      <p className="text-sm text-neutral-500 mt-1">@{child.username}</p>
                    </div>
                    <Badge variant={child.isActive ? 'default' : 'secondary'}>
                      {child.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {child.dateOfBirth && (
                      <div className="text-sm">
                        <span className="text-neutral-600">Date of Birth: </span>
                        <span className="font-medium">{formatDate(child.dateOfBirth)}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-4 pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="w-4 h-4 text-neutral-500" />
                        <span className="text-neutral-600">View Details</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
