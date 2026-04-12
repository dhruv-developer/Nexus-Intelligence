'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Sparkles, Brain, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Nexus Intelligence</h1>
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="text-center max-w-2xl mx-auto px-6">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Brain className="w-16 h-16 text-primary" />
              <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Nexus Intelligence
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            AI-Powered Decision Intelligence Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Smart Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Get AI-powered insights from your data with natural language queries
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border">
            <Brain className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Predictive Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Forecast trends and make data-driven decisions with confidence
            </p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 border">
            <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Real-time Insights</h3>
            <p className="text-sm text-muted-foreground">
              Discover hidden patterns and actionable insights instantly
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {user ? 'Redirecting to dashboard...' : 'Redirecting to login...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
