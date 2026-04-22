'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Shield, Eye, AlertTriangle, Lock } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'parent') {
        router.push('/dashboard');
      } else {
        router.push('/child/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-xl sm:text-2xl font-bold">Hubble</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="ghost" onClick={() => router.push('/login')} size="sm" className="text-sm">
              Login
            </Button>
            <Button onClick={() => router.push('/register')} size="sm" className="text-sm">
              <span className="hidden xs:inline">Get Started</span>
              <span className="xs:hidden">Start</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 text-center animate-fade-in">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
          Protect Your Children from <br className="hidden sm:block" />
          <span className="text-neutral-600">Cyberbullying</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-neutral-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
          AI-powered real-time monitoring and detection system to keep your children safe online
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
          <Button 
            size="lg" 
            onClick={() => router.push('/register')}
            className="w-full sm:w-auto transition-all duration-150 active:scale-95"
          >
            Start Free Trial
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => router.push('/login')}
            className="w-full sm:w-auto transition-all duration-150 active:scale-95"
          >
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 border border-neutral-200 rounded-lg transition-all duration-150 hover:shadow-lg hover:scale-[1.02]">
            <Eye className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2">Real-time Monitoring</h3>
            <p className="text-sm sm:text-base text-neutral-600">
              24/7 AI-powered monitoring of text messages, social media, and online activities
            </p>
          </div>
          <div className="p-6 border border-neutral-200 rounded-lg transition-all duration-150 hover:shadow-lg hover:scale-[1.02]">
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2">Instant Alerts</h3>
            <p className="text-sm sm:text-base text-neutral-600">
              Get immediate notifications when potential threats or harmful content is detected
            </p>
          </div>
          <div className="p-6 border border-neutral-200 rounded-lg transition-all duration-150 hover:shadow-lg hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
            <Lock className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
            <h3 className="text-lg sm:text-xl font-bold mb-2">Privacy First</h3>
            <p className="text-sm sm:text-base text-neutral-600">
              Transparent monitoring with consent. Your family&apos;s data is encrypted and secure
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-neutral-50 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-12 text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold mb-2">99.2%</div>
              <div className="text-sm sm:text-base text-neutral-600">Detection Accuracy</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold mb-2">&lt;100ms</div>
              <div className="text-sm sm:text-base text-neutral-600">Response Time</div>
            </div>
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-bold mb-2">24/7</div>
              <div className="text-neutral-600">Protection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8">
        <div className="container mx-auto px-4 text-center text-neutral-600">
          <p>&copy; 2025 Hubble. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
