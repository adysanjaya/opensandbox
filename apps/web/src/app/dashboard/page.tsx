'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { endpoints, auth, groups } from '@/lib/api';
import {
  BoltIcon,
  Squares2X2Icon,
  GlobeAltIcon,
  CubeIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  LockOpenIcon,
  LockClosedIcon,
  FolderIcon,
  FolderOpenIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSimpleToast } from '@/hooks/useToast';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';

interface Endpoint {
  id: string;
  name: string;
  slug: string;
  method: string;
  isActive: boolean;
  groupId: string | null;
  url: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    GET: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    POST: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PUT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
    PATCH: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${map[method] || 'bg-muted text-muted-foreground border-border'}`}
    >
      {method}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-muted text-muted-foreground border-border'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useSimpleToast();
  const [user, setUser] = useState<any>(null);
  const [endpointList, setEndpointList] = useState<Endpoint[]>([]);
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupColor, setGroupColor] = useState('#3b82f6');
  const [assigningGroup, setAssigningGroup] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Delete modal state
  const [deleteEndpointId, setDeleteEndpointId] = useState<string | null>(null);
  const [deleteEndpointName, setDeleteEndpointName] = useState('');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupName, setDeleteGroupName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([auth.me(), endpoints.list(), groups.list()])
      .then(([userRes, listRes, groupRes]) => {
        setUser(userRes.data);
        setEndpointList(listRes.data || []);
        setGroupList(groupRes.data || []);
        setExpandedGroups(new Set((groupRes.data || []).map((g: Group) => g.id)));
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function matchesFilters(ep: Endpoint) {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ep.name.toLowerCase().includes(q) ||
      ep.slug.toLowerCase().includes(q) ||
      ep.url.toLowerCase().includes(q);
    const matchesMethod = filterMethod === 'ALL' || ep.method === filterMethod;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'active' && ep.isActive) ||
      (filterStatus === 'inactive' && !ep.isActive);
    return matchesSearch && matchesMethod && matchesStatus;
  }

  async function handleDelete(id: string, name: string) {
    setDeleteEndpointId(id);
    setDeleteEndpointName(name);
  }

  async function handleConfirmDeleteEndpoint() {
    if (!deleteEndpointId) return;
    try {
      await endpoints.delete(deleteEndpointId);
      setEndpointList((prev) => prev.filter((e) => e.id !== deleteEndpointId));
      toast.success('Endpoint deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete endpoint');
    } finally {
      setDeleteEndpointId(null);
      setDeleteEndpointName('');
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await endpoints.update(id, { isActive: !isActive });
    setEndpointList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: !isActive } : e))
    );
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await endpoints.duplicate(id);
      const newEp = res.data;
      setEndpointList((prev) => [newEp, ...prev]);
      toast.success('Endpoint duplicated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate');
    }
  }

  async function handleAssignGroup(endpointId: string, groupId: string | null) {
    await endpoints.update(endpointId, { groupId });
    setEndpointList((prev) =>
      prev.map((e) => (e.id === endpointId ? { ...e, groupId } : e))
    );
    setAssigningGroup(null);
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    try {
      const res = await groups.create({ name: groupName, color: groupColor });
      setGroupList((prev) => [res.data, ...prev]);
      setExpandedGroups((prev) => new Set(prev).add(res.data.id));
      setGroupName('');
      setShowGroupModal(false);
      toast.success('Group created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    }
  }

  async function handleDeleteGroup(id: string, name: string) {
    setDeleteGroupId(id);
    setDeleteGroupName(name);
  }

  async function handleConfirmDeleteGroup() {
    if (!deleteGroupId) return;
    try {
      await groups.delete(deleteGroupId);
      setGroupList((prev) => prev.filter((g) => g.id !== deleteGroupId));
      setEndpointList((prev) =>
        prev.map((e) =>
          e.groupId === deleteGroupId ? { ...e, groupId: null } : e
        )
      );
      toast.success('Group deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete group');
    } finally {
      setDeleteGroupId(null);
      setDeleteGroupName('');
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const filteredUngroupedEndpoints = endpointList.filter(
    (e) => !e.groupId && matchesFilters(e)
  );

  const totalEndpoints = endpointList.length;
  const activeEndpoints = endpointList.filter((e) => e.isActive).length;
  const totalGroups = groupList.length;

  const navItems = [
    { label: 'Dashboard', icon: Squares2X2Icon, href: '/dashboard', active: true },
    { label: 'Endpoints', icon: GlobeAltIcon, href: '/endpoints', active: false },
    { label: 'Shared Functions', icon: CubeIcon, href: '/shared-functions', active: false },
    { label: 'Groups', icon: FolderIcon, href: '#', active: false, onClick: () => setShowGroupModal(true) },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasContent = endpointList.length > 0 || groupList.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-card border-r border-border flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="p-2 bg-primary rounded-lg shadow-sm">
            <BoltIcon className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Sandbox
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserCircleIcon className="w-8 h-8 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email || 'User'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-destructive bg-destructive/5 border border-destructive/10 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
              >
                <svg
                  className="w-5 h-5 text-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Dashboard
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Manage and organize your API endpoints
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/endpoints/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">New Endpoint</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {!hasContent ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-5">
                <GlobeAltIcon className="w-8 h-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">
                No endpoints yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first endpoint or group to get started
              </p>
              <button
                onClick={() => router.push('/endpoints/new')}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:shadow-md active:scale-95"
              >
                Create Endpoint
              </button>
            </div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Endpoints
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {totalEndpoints}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <GlobeAltIcon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Active Endpoints
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {activeEndpoints}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <LockOpenIcon className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Groups
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {totalGroups}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <FolderIcon className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search endpoints..."
                    className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
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
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                    className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="ALL">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Endpoints grouped by group */}
              <div className="space-y-4">
                {groupList.map((group) => {
                  const eps = endpointList.filter(
                    (e) => e.groupId === group.id && matchesFilters(e)
                  );
                  const isExpanded = expandedGroups.has(group.id);
                  if (eps.length === 0 && searchQuery.trim()) return null;
                  return (
                    <div
                      key={group.id}
                      className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-border"
                          style={{ backgroundColor: group.color }}
                        />
                        {isExpanded ? (
                          <FolderOpenIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <FolderIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="font-semibold text-sm text-foreground flex-1">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">
                          {eps.length}
                        </span>
                        {isExpanded ? (
                          <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id, group.name);
                          }}
                          className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0"
                          title="Delete group"
                        >
                          <TrashIcon className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </button>
                      {isExpanded && eps.length > 0 && (
                        <div className="border-t border-border">
                          {eps.map((ep, idx) => (
                            <div
                              key={ep.id}
                              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                                idx !== eps.length - 1 ? 'border-b border-border' : ''
                              }`}
                            >
                              <MethodBadge method={ep.method} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {ep.name}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                  {ep.slug}
                                </p>
                              </div>
                              <div className="hidden sm:block">
                                <StatusBadge isActive={ep.isActive} />
                              </div>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() =>
                                    handleToggle(ep.id, ep.isActive)
                                  }
                                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                  title={
                                    ep.isActive ? 'Deactivate' : 'Activate'
                                  }
                                >
                                  {ep.isActive ? (
                                    <LockOpenIcon className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <LockClosedIcon className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setAssigningGroup(
                                        assigningGroup === ep.id
                                          ? null
                                          : ep.id
                                      )
                                    }
                                    className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                    title="Assign group"
                                  >
                                    <TagIcon className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                  {assigningGroup === ep.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-xl border border-border z-50 py-1">
                                      <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b border-border">
                                        Move to Group
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleAssignGroup(ep.id, null)
                                        }
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                      >
                                        No Group
                                      </button>
                                      {groupList.map((g) => (
                                        <button
                                          key={g.id}
                                          onClick={() =>
                                            handleAssignGroup(ep.id, g.id)
                                          }
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                                        >
                                          <span
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor: g.color,
                                            }}
                                          />
                                          {g.name}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    router.push(`/endpoints/${ep.id}`)
                                  }
                                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleDuplicate(ep.id)}
                                  className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                  title="Duplicate"
                                >
                                  <DocumentDuplicateIcon className="w-4 h-4 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(ep.id, ep.name)
                                  }
                                  className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-4 h-4 text-destructive" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Ungrouped */}
                {filteredUngroupedEndpoints.length > 0 && (
                  <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                      <GlobeAltIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-semibold text-sm text-foreground flex-1">
                        Ungrouped
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full font-medium">
                        {filteredUngroupedEndpoints.length}
                      </span>
                    </div>
                    <div>
                      {filteredUngroupedEndpoints.map((ep, idx) => (
                        <div
                          key={ep.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 ${
                            idx !== filteredUngroupedEndpoints.length - 1
                              ? 'border-b border-border'
                              : ''
                          }`}
                        >
                          <MethodBadge method={ep.method} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {ep.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {ep.slug}
                            </p>
                          </div>
                          <div className="hidden sm:block">
                            <StatusBadge isActive={ep.isActive} />
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() =>
                                handleToggle(ep.id, ep.isActive)
                              }
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                              title={ep.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {ep.isActive ? (
                                <LockOpenIcon className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <LockClosedIcon className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setAssigningGroup(
                                    assigningGroup === ep.id ? null : ep.id
                                  )
                                }
                                className="p-1.5 hover:bg-muted rounded-md transition-colors"
                                title="Assign group"
                              >
                                <TagIcon className="w-4 h-4 text-muted-foreground" />
                              </button>
                              {assigningGroup === ep.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-xl border border-border z-50 py-1">
                                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b border-border">
                                    Move to Group
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleAssignGroup(ep.id, null)
                                    }
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                  >
                                    No Group
                                  </button>
                                  {groupList.map((g) => (
                                    <button
                                      key={g.id}
                                      onClick={() =>
                                        handleAssignGroup(ep.id, g.id)
                                      }
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                                    >
                                      <span
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                          backgroundColor: g.color,
                                        }}
                                      />
                                      {g.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/endpoints/${ep.id}`)
                              }
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(ep.id)}
                              className="p-1.5 hover:bg-muted rounded-md transition-colors"
                              title="Duplicate"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(ep.id, ep.name)}
                              className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupList.filter((g) => {
                  const eps = endpointList.filter(
                    (e) => e.groupId === g.id && matchesFilters(e)
                  );
                  return (
                    eps.length > 0 ||
                    (!searchQuery.trim() &&
                      endpointList.filter((e) => e.groupId === g.id).length ===
                        0)
                  );
                }).length === 0 &&
                  filteredUngroupedEndpoints.length === 0 && (
                    <div className="text-center py-14 bg-card rounded-xl border border-border border-dashed shadow-sm">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                        <MagnifyingGlassIcon className="w-6 h-6 text-muted-foreground/60" />
                      </div>
                      <p className="text-muted-foreground font-medium">
                        No endpoints match your filters.
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Create New Group
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Production APIs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    '#3b82f6',
                    '#ef4444',
                    '#10b981',
                    '#f59e0b',
                    '#8b5cf6',
                    '#ec4899',
                    '#06b6d4',
                    '#6366f1',
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setGroupColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        groupColor === c
                          ? 'border-foreground'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Endpoint Modal */}
      <Modal
        open={!!deleteEndpointId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteEndpointId(null);
            setDeleteEndpointName('');
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Endpoint</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteEndpointName}</strong>? This action cannot be
              undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button
              onClick={() => {
                setDeleteEndpointId(null);
                setDeleteEndpointName('');
              }}
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeleteEndpoint}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Group Modal */}
      <Modal
        open={!!deleteGroupId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteGroupId(null);
            setDeleteGroupName('');
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Group</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete <strong>{deleteGroupName}</strong>
              ? Endpoints in this group will be ungrouped.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button
              onClick={() => {
                setDeleteGroupId(null);
                setDeleteGroupName('');
              }}
              className="px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeleteGroup}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
