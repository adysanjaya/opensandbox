'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { endpoints, auth, groups, sharedFunctions, admin } from '@/lib/api';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/auth-helpers';
import DashboardLayout from '@/components/DashboardLayout';
import ApiMetricsChart from '@/components/ApiMetricsChart';
import {
  PlusIcon,
  GlobeAltIcon,
  CubeIcon,
  FolderIcon,
  UsersIcon,
  LockOpenIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Endpoint {
  id: string;
  name: string;
  slug: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  isActive: boolean;
  groupId: string | null;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [endpointList, setEndpointList] = useState<Endpoint[]>([]);
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [sharedFunctionCount, setSharedFunctionCount] = useState<number>(0);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      auth.me(),
      endpoints.list(),
      groups.list(),
      sharedFunctions.list(),
    ])
      .then(async ([userRes, endpointsRes, groupsRes, functionsRes]) => {
        const currentUser = userRes.data;
        setUser(currentUser);
        setEndpointList(endpointsRes.data || []);
        setGroupList(groupsRes.data || []);
        setSharedFunctionCount((functionsRes.data || []).length);

        const isSuperAdmin = checkSuperAdmin(currentUser);

        if (isSuperAdmin) {
          try {
            const statsRes = await admin.stats();
            setAdminStats(statsRes.data);
          } catch {
            // non-critical
          }
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const isSuperAdmin = checkSuperAdmin(user);

  const totalEndpoints = endpointList.length;
  const activeEndpoints = endpointList.filter((e) => e.isActive).length;
  const totalGroups = groupList.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeNav="dashboard"
      title="Dashboard"
      subtitle={`Welcome back${user?.name ? `, ${user.name}` : ''}! Workspace overview & quick actions.`}
      user={user}
      onGroupCreated={(newGroup) => setGroupList((prev) => [newGroup, ...prev])}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/endpoints/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Endpoint</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6">
          <div className="absolute -right-6 -top-6 bottom-0 w-1/3 hidden lg:block pointer-events-none opacity-20 dark:opacity-30">
            <img
              src="/hero.png"
              alt="OpenSandbox Architecture"
              className="w-full h-full object-cover object-left"
              style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
            />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary mb-3">
              <SparklesIcon className="w-3.5 h-3.5" />
              OpenSandbox Visual API Engine
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Build & deploy dynamic REST endpoints visually.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Design endpoint request flows, connect database operations, apply logic conditions, and expose real APIs instantly without writing backend boilerplate.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => router.push('/endpoints/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Create New Endpoint
              </button>
              <button
                onClick={() => router.push('/shared-functions/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-medium transition-all"
              >
                <CubeIcon className="w-3.5 h-3.5" />
                Create Shared Function
              </button>
              <button
                onClick={() => router.push('/endpoints')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg text-xs font-medium transition-all"
              >
                <GlobeAltIcon className="w-3.5 h-3.5" />
                View All Endpoints
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => router.push('/endpoints')}
            className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
                  Total Endpoints
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {totalEndpoints}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <GlobeAltIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push('/endpoints')}
            className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500 p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500 transition-colors">
                  Active Endpoints
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {activeEndpoints}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                <LockOpenIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push('/shared-functions')}
            className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500 p-5 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-purple-500 transition-colors">
                  Shared Functions
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {sharedFunctionCount}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                <CubeIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              if (isSuperAdmin) {
                router.push('/admin/users');
              } else {
                router.push('/endpoints');
              }
            }}
            className={`bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 ${
              isSuperAdmin ? 'border-l-pink-500' : 'border-l-amber-500'
            } p-5 cursor-pointer group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  {isSuperAdmin ? 'Total Users' : 'Endpoint Groups'}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {isSuperAdmin ? adminStats?.totalUsers ?? '...' : totalGroups}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${
                  isSuperAdmin
                    ? 'bg-pink-500/10 text-pink-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {isSuperAdmin ? (
                  <UsersIcon className="w-6 h-6" />
                ) : (
                  <FolderIcon className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* API Hit Metrics Graph */}
        <ApiMetricsChart />

      </div>
    </DashboardLayout>
  );
}
