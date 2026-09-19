'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, admin } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth-helpers';
import DashboardLayout from '@/components/DashboardLayout';
import {
  UsersIcon,
  GlobeAltIcon,
  CubeIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  CalendarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useSimpleToast } from '@/hooks/useToast';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  oauthProvider: string | null;
  oauthPicture: string | null;
  createdAt: string;
  endpointsCount: number;
  sharedFunctionsCount: number;
}

interface AdminStats {
  totalUsers: number;
  totalEndpoints: number;
  totalActiveEndpoints: number;
  totalSharedFunctions: number;
  googleUsers: number;
  newUsersLast7Days: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useSimpleToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterProvider, setFilterProvider] = useState('ALL');

  async function loadData() {
    try {
      const [userRes, usersData, statsData] = await Promise.all([
        auth.me(),
        admin.users(),
        admin.stats(),
      ]);

      const user = userRes.data;
      const hasAdminAccess = isSuperAdmin(user);

      if (!hasAdminAccess) {
        toast.error('Access denied. Superadmin access required.');
        router.push('/dashboard');
        return;
      }

      setCurrentUser(user);
      setUserList(usersData.data || []);
      setStats(statsData.data || null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load user management data');
      router.push('/dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredUsers = userList.filter((u) => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (filterProvider === 'google' && u.oauthProvider !== 'google') return false;
    if (filterProvider === 'local' && u.oauthProvider) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeNav="users"
      title="User Management"
      subtitle="Superadmin portal: Monitor registered users, login methods, and workspace activities"
      user={currentUser}
      actions={
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-lg font-medium text-xs transition-colors shadow-xs"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Registered
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.totalUsers ?? userList.length}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <UsersIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Google Accounts
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.googleUsers ??
                    userList.filter((u) => u.oauthProvider === 'google').length}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.63 16.27 17.5 12.24 17.5c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.66 0 3.02.6 4.07 1.58l2.36-2.36C16.96 3.14 14.77 2.2 12.24 2.2 6.84 2.2 2.5 6.54 2.5 12s4.34 9.8 9.74 9.8c5.65 0 9.38-3.97 9.38-9.55 0-.64-.07-1.27-.19-1.965H12.24z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Endpoints
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.totalEndpoints ??
                    userList.reduce((acc, u) => acc + u.endpointsCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                <GlobeAltIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Signups (7d)
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats?.newUsersLast7Days ?? 0}
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, or user ID..."
              className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
            >
              <option value="ALL">All Providers</option>
              <option value="google">Google OAuth</option>
              <option value="local">Email / Password</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Registered Users</h2>
              <p className="text-xs text-muted-foreground">
                Showing {filteredUsers.length} of {userList.length} users
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">User</th>
                  <th className="px-5 py-3.5 font-semibold">Provider</th>
                  <th className="px-5 py-3.5 font-semibold">Role</th>
                  <th className="px-5 py-3.5 font-semibold">Endpoints</th>
                  <th className="px-5 py-3.5 font-semibold">Functions</th>
                  <th className="px-5 py-3.5 font-semibold">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      No users match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.email === currentUser?.email;
                    const isSuper = isSuperAdmin(u);

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        {/* User info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {u.oauthPicture ? (
                              <img
                                src={u.oauthPicture}
                                alt={u.name}
                                className="w-10 h-10 rounded-full object-cover ring-1 ring-border"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-primary/20">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-foreground text-sm truncate">
                                  {u.name}
                                </p>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {u.email}
                              </p>
                              <span className="text-[10px] text-muted-foreground/60 font-mono block mt-0.5">
                                ID: {u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Provider */}
                        <td className="px-5 py-4">
                          {u.oauthProvider === 'google' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M12.24 10.285V13.4h6.887C18.2 15.63 16.27 17.5 12.24 17.5c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.66 0 3.02.6 4.07 1.58l2.36-2.36C16.96 3.14 14.77 2.2 12.24 2.2 6.84 2.2 2.5 6.54 2.5 12s4.34 9.8 9.74 9.8c5.65 0 9.38-3.97 9.38-9.55 0-.64-.07-1.27-.19-1.965H12.24z" />
                              </svg>
                              Google
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              Email / Password
                            </span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
                              <ShieldCheckIcon className="w-3.5 h-3.5" />
                              Superadmin
                            </span>
                          ) : u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/20">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              User
                            </span>
                          )}
                        </td>

                        {/* Endpoints */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-foreground">
                            {u.endpointsCount}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            endpoints
                          </span>
                        </td>

                        {/* Functions */}
                        <td className="px-5 py-4">
                          <span className="font-semibold text-foreground">
                            {u.sharedFunctionsCount}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            functions
                          </span>
                        </td>

                        {/* Registered At */}
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
