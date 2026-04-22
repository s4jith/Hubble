'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, and number');
      setLoading(false);
      return;
    }

    if (formData.firstName.trim().length === 0 || formData.lastName.trim().length === 0) {
      setError('First name and last name are required');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      
      // Remove empty phone field
      const cleanData = {
        ...registerData,
        ...(registerData.phone ? { phone: registerData.phone.trim() } : {}),
      };
      
      const response = await apiClient.registerParent(cleanData);
      
      // Handle both response structures
      const responseData = response.data?.data || response.data;
      const { user, accessToken, refreshToken } = responseData;
      
      if (!user || !accessToken || !refreshToken) {
        throw new Error('Invalid response from server');
      }
      
      setAuth(user, accessToken, refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Extract error message from various response formats
      let errorMessage = 'Registration failed. Please try again.';
      const newFieldErrors: Record<string, string> = {};
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle field-specific errors object
        if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
          Object.keys(errorData.errors).forEach(field => {
            const fieldError = errorData.errors[field];
            if (Array.isArray(fieldError)) {
              newFieldErrors[field] = fieldError[0];
            } else {
              newFieldErrors[field] = fieldError;
            }
          });
          errorMessage = errorData.message || 'Please fix the errors below';
        }
        // Handle validation errors array
        else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => e.message || e.msg).join(', ');
        } 
        // Handle single error message
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Handle error string
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setFieldErrors(newFieldErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-10 h-10" />
            <span className="text-3xl font-bold">Hubble</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Parent Account</CardTitle>
            <CardDescription>Start protecting your children online today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    className={fieldErrors.firstName ? 'border-red-500' : ''}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-red-600">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    className={fieldErrors.lastName ? 'border-red-500' : ''}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-red-600">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={fieldErrors.email ? 'border-red-500' : ''}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={fieldErrors.phone ? 'border-red-500' : ''}
                />
                {fieldErrors.phone ? (
                  <p className="text-xs text-red-600">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-xs text-neutral-500">Enter phone with country code (e.g., +1 234 567 8900)</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={fieldErrors.password ? 'border-red-500' : ''}
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-red-600">{fieldErrors.password}</p>
                ) : (
                  <p className="text-xs text-neutral-500">Must contain uppercase, lowercase, and number</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={fieldErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm text-neutral-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium underline">Login</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
