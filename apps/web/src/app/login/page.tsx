'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  BoltIcon,
  SparklesIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CubeIcon,
  DocumentArrowUpIcon,
  CodeBracketIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';


const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
  }
}

const FEATURES = [
  {
    icon: Squares2X2Icon,
    title: 'Visual Flow Builder',
    description: 'Drag-and-drop nodes to build API logic without writing code.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Input Validation',
    description: 'Validate request body, query params, and headers with configurable rules.',
  },
  {
    icon: GlobeAltIcon,
    title: 'HTTP Requests',
    description: 'Call external APIs and route responses based on success or failure.',
  },
  {
    icon: CubeIcon,
    title: 'Shared Functions',
    description: 'Reuse validation logic and flows across multiple endpoints.',
  },
  {
    icon: ArrowsRightLeftIcon,
    title: 'Branching Logic',
    description: 'Conditions, A/B splits, delays, and variable checks built-in.',
  },
  {
    icon: DocumentArrowUpIcon,
    title: 'Custom Responses',
    description: 'Return JSON, XML, or plain text with custom status codes.',
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for auth code from Google redirect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
      return;
    }

    const code = searchParams.get('code');
    if (code) {
      handleGoogleCodeExchange(code);
    }
  }, [router, searchParams]);

  const handleGoogleCodeExchange = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await auth.googleCodeLogin(code);
      localStorage.setItem('token', result.data.token);
      // Clean URL
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    const redirectUri = 'http://localhost:3000/login';
    const scope = 'openid email profile';
    const state = Math.random().toString(36).substring(2);
    sessionStorage.setItem('google_oauth_state', state);

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');

    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — Product Preview */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12 max-w-3xl">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <BoltIcon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Sandbox</h1>
          </div>

          {/* Headline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-5">
            Build dynamic APIs<br />
            <span className="text-primary">without code</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-lg leading-relaxed">
            A visual flow builder for creating REST API endpoints. Drag, connect, and deploy — no backend knowledge required.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="group p-4 rounded-xl bg-card/50 border border-border/60 hover:bg-card hover:border-border hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats / trust */}
          <div className="mt-12 flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              <span>Google OAuth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — Login */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-background to-muted/10 lg:hidden" />

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <BoltIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Sandbox</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border/60 p-8">
            <h2 className="text-xl font-semibold text-center mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Sign in to manage your endpoints
            </p>

            {error && (
              <div className="mb-5 p-3.5 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                {error}
              </div>
            )}

            {loading && (
              <div className="mb-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Signing in...
              </div>
            )}

            <div className="w-full">
              <button
                onClick={handleGoogleRedirect}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full bg-white text-zinc-900 text-sm font-medium hover:bg-zinc-100 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground/80">
              Secured by Google OAuth
            </p>
          </div>

          {/* Mobile feature teaser */}
          <div className="lg:hidden mt-8 space-y-3">
            <p className="text-center text-sm text-muted-foreground mb-4">
              What you can do with Sandbox
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.slice(0, 4).map((feature, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-card/50 border border-border/60"
                >
                  <feature.icon className="w-5 h-5 text-primary mb-2" />
                  <h3 className="text-xs font-semibold text-foreground">{feature.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
