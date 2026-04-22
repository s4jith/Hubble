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
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">Children</h1>
            <p className="text-sm sm:text-base text-neutral-600">Manage your children's accounts and monitor their activity</p>
          </div>
          <Button onClick={() => router.push('/dashboard/children/add')} className="w-full sm:w-auto shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Child
          </Button>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 sm:py-16 px-4">
              <div className="text-center text-neutral-500">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">No children added yet</h3>
                <p className="text-sm sm:text-base mb-6 max-w-md mx-auto">Start monitoring your child's online safety by adding their account</p>
                <Button onClick={() => router.push('/dashboard/children/add')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Child
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {children.map((child) => (
              <Card 
                key={child.id || child._id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-150 hover:scale-[1.02] active:scale-100"
                onClick={() => router.push(`/dashboard/children/${child.id || child._id}`)}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg sm:text-xl truncate">
                        {child.firstName} {child.lastName}
                      </CardTitle>
                      <p className="text-sm text-neutral-500 mt-1 truncate">@{child.username}</p>
                    </div>
                    <Badge variant={child.isActive ? 'default' : 'secondary'} className="shrink-0 text-xs">
                      {child.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    {child.dateOfBirth && (
                      <div className="text-xs sm:text-sm">
                        <span className="text-neutral-600">Date of Birth: </span>
                        <span className="font-medium">{formatDate(child.dateOfBirth)}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-4 pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Eye className="w-4 h-4 text-neutral-500 shrink-0" />
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
