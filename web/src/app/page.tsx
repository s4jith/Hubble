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
      <header className="border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8" />
            <span className="text-2xl font-bold">Hubble</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button onClick={() => router.push('/register')}>Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Protect Your Children from <br />
          <span className="text-neutral-600">Cyberbullying</span>
        </h1>
        <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
          AI-powered real-time monitoring and detection system to keep your children safe online
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => router.push('/register')}>
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-neutral-200 rounded-lg">
            <Eye className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Real-time Monitoring</h3>
            <p className="text-neutral-600">
              24/7 AI-powered monitoring of text messages, social media, and online activities
            </p>
          </div>
          <div className="p-6 border border-neutral-200 rounded-lg">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Instant Alerts</h3>
            <p className="text-neutral-600">
              Get immediate notifications when potential threats or harmful content is detected
            </p>
          </div>
          <div className="p-6 border border-neutral-200 rounded-lg">
            <Lock className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold mb-2">Privacy First</h3>
            <p className="text-neutral-600">
              Transparent monitoring with consent. Your family&apos;s data is encrypted and secure
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">99.2%</div>
              <div className="text-neutral-600">Detection Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">&lt;100ms</div>
              <div className="text-neutral-600">Response Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
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
