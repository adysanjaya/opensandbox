'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, groups } from '@/lib/api';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/auth-helpers';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSimpleToast } from '@/hooks/useToast';
import {
  BoltIcon,
  Squares2X2Icon,
  GlobeAltIcon,
  CubeIcon,
  FolderIcon,
  UsersIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  PlusIcon,
  LifebuoyIcon,
  Cog6ToothIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

import ContactSupportModal from '@/components/ContactSupportModal';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';


interface DashboardLayoutProps {
  children: React.ReactNode;
  activeNav: 'dashboard' | 'endpoints' | 'shared-functions' | 'users' | string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user?: any;
  onGroupCreated?: (newGroup: any) => void;
}

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export default function DashboardLayout({
  children,
  activeNav,
  title,
  subtitle,
  actions,
  user: initialUser,
  onGroupCreated,
}: DashboardLayoutProps) {
  const router = useRouter();
  const toast = useSimpleToast();
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    auth
      .me()
      .then((res) => {
        setCurrentUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      });
  }, [initialUser, router]);

  const isSuperAdmin = checkSuperAdmin(currentUser);

  const mainNavItems = [
    {
      label: 'Dashboard',
      icon: Squares2X2Icon,
      href: '/dashboard',
      active: activeNav === 'dashboard',
    },
    {
      label: 'Endpoints',
      icon: GlobeAltIcon,
      href: '/endpoints',
      active: activeNav === 'endpoints',
    },
    {
      label: 'Shared Functions',
      icon: CubeIcon,
      href: '/shared-functions',
      active: activeNav === 'shared-functions',
    },
    {
      label: 'Groups',
      icon: FolderIcon,
      href: '#',
      active: false,
      onClick: () => setShowGroupModal(true),
    },
    {
      label: 'Dokumentasi',
      icon: BookOpenIcon,
      href: '/docs',
      active: activeNav === 'docs',
    },
  ];


  const adminNavItems = isSuperAdmin
    ? [
        {
          label: 'Registered Users',
          icon: UsersIcon,
          href: '/admin/users',
          active: activeNav === 'users',
        },
        {
          label: 'Pengaturan',
          icon: Cog6ToothIcon,
          href: '/admin/settings',
          active: activeNav === 'settings',
        },
      ]
    : [];


  async function handleCreateGroupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmittingGroup(true);
    try {
      const res = await groups.create({ name: groupName.trim(), color: groupColor });
      toast.success('Group created successfully');
      setGroupName('');
      setShowGroupModal(false);
      if (onGroupCreated) {
        onGroupCreated(res.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setIsSubmittingGroup(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo */}
        <div className="h-[70px] flex items-center justify-between px-5 border-b border-border shrink-0">
          <div
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50 shrink-0 bg-[#160324] flex items-center justify-center p-1">
              <img src="/logo.svg" alt="OpenSandbox" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground leading-tight block">
                OpenSandbox
              </span>
              <span className="block text-[10px] text-muted-foreground font-mono -mt-0.5">
                Visual API Platform
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Workspace section */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Workspace
            </p>
            <div className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        router.push(item.href);
                      }
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      item.active
                        ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Superadmin section */}
          {isSuperAdmin && adminNavItems.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-primary" />
                <p className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  Superadmin
                </p>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        router.push(item.href);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        item.active
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Help & Support section */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Dukungan
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setSupportModalOpen(true);
                  setMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all group"
              >
                <LifebuoyIcon className="w-5 h-5 shrink-0 text-primary group-hover:rotate-45 transition-transform" />
                <span className="truncate">Kontak Bantuan</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom User Area */}
        <div className="px-4 py-4 border-t border-border bg-card/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {currentUser?.oauthPicture ? (
                <img
                  src={currentUser.oauthPicture}
                  alt={currentUser.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <UserCircleIcon className="w-8 h-8 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {currentUser?.name || 'User'}
                  </p>
                  {isSuperAdmin && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary rounded border border-primary/20">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  {currentUser?.email || ''}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-destructive bg-destructive/5 border border-destructive/10 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border h-[70px] flex items-center shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted text-foreground transition-colors"
                aria-label="Open sidebar"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground hidden sm:block truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card/80 hover:bg-muted text-xs font-medium text-foreground transition-all shadow-xs"
                title="Pusat Bantuan & Kontak Admin"
              >
                <LifebuoyIcon className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Kontak Bantuan</span>
              </button>
              {actions}
            </div>
          </div>
        </header>


        {/* Content Container */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>

      {/* Group Creation Modal */}
      <Modal open={showGroupModal} onOpenChange={setShowGroupModal}>
        <ModalContent>
          <form onSubmit={handleCreateGroupSubmit}>
            <ModalHeader>
              <ModalTitle>Create Endpoint Group</ModalTitle>
              <ModalDescription>
                Organize your endpoints into logical folders or categories.
              </ModalDescription>
            </ModalHeader>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authentication, Billing, Webhooks"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGroupColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        groupColor === c ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-card' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <ModalFooter>
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingGroup || !groupName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmittingGroup ? 'Creating...' : 'Create Group'}
              </button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Contact Support Modal */}
      <ContactSupportModal
        open={supportModalOpen}
        onOpenChange={setSupportModalOpen}
      />
    </div>


  );
}
