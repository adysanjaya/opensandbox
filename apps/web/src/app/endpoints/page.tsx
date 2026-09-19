'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { endpoints, auth, groups } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import EndpointActionMenu from '@/components/EndpointActionMenu';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  LockClosedIcon,
  LockOpenIcon,
  TagIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  GlobeAltIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono border ${
        map[method] || 'bg-muted text-muted-foreground border-border'
      }`}
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

export default function EndpointsPage() {
  const router = useRouter();
  const toast = useSimpleToast();
  const [user, setUser] = useState<any>(null);
  const [endpointList, setEndpointList] = useState<Endpoint[]>([]);
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [assigningGroup, setAssigningGroup] = useState<string | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Delete modal state
  const [deleteEndpointId, setDeleteEndpointId] = useState<string | null>(null);
  const [deleteEndpointName, setDeleteEndpointName] = useState('');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupName, setDeleteGroupName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (slug: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api-sandbox.adysanjaya.my.id';
    const fullUrl = `${apiBase}/${user?.userHash || ''}/${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      toast.success(`URL endpoint disalin: ${fullUrl}`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };


  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([auth.me(), endpoints.list(), groups.list()])
      .then(([userRes, endpointsRes, groupsRes]) => {
        setUser(userRes.data);
        setEndpointList(endpointsRes.data || []);
        const groupsData = groupsRes.data || [];
        setGroupList(groupsData);
        setExpandedGroups(new Set(groupsData.map((g: Group) => g.id)));
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Click outside to close group assignment dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assigningGroup && !(event.target as Element).closest('.relative')) {
        setAssigningGroup(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [assigningGroup]);

  function handleDelete(id: string, name: string) {
    setDeleteEndpointId(id);
    setDeleteEndpointName(name);
  }

  async function handleConfirmDelete() {
    if (!deleteEndpointId) return;
    try {
      await endpoints.delete(deleteEndpointId);
      setEndpointList((prev) => prev.filter((e) => e.id !== deleteEndpointId));
      toast.success('Endpoint deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete endpoint');
    } finally {
      setDeleteEndpointId(null);
      setDeleteEndpointName('');
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await endpoints.update(id, { isActive: !isActive });
      setEndpointList((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isActive: !isActive } : e))
      );
      toast.success(isActive ? 'Endpoint deactivated' : 'Endpoint activated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update endpoint status');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await endpoints.duplicate(id);
      const newEp = res.data;
      setEndpointList((prev) => [newEp, ...prev]);
      toast.success('Endpoint duplicated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate');
    }
  }

  async function handleAssignGroup(endpointId: string, groupId: string | null) {
    try {
      await endpoints.update(endpointId, { groupId });
      setEndpointList((prev) =>
        prev.map((e) => (e.id === endpointId ? { ...e, groupId } : e))
      );
      toast.success('Group updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update group');
    } finally {
      setAssigningGroup(null);
    }
  }

  async function handleConfirmDeleteGroup() {
    if (!deleteGroupId) return;
    try {
      await groups.delete(deleteGroupId);
      setGroupList((prev) => prev.filter((g) => g.id !== deleteGroupId));
      setEndpointList((prev) =>
        prev.map((e) => (e.groupId === deleteGroupId ? { ...e, groupId: null } : e))
      );
      toast.success('Group deleted successfully');
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

  const matchesFilters = (e: Endpoint) => {
    if (filterMethod !== 'ALL' && e.method !== filterMethod) return false;
    if (filterStatus === 'active' && !e.isActive) return false;
    if (filterStatus === 'inactive' && e.isActive) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(query) ||
        e.slug.toLowerCase().includes(query)
      );
    }
    return true;
  };

  const filteredUngroupedEndpoints = endpointList.filter(
    (e) => !e.groupId && matchesFilters(e)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasContent = endpointList.length > 0 || groupList.length > 0;

  return (
    <DashboardLayout
      activeNav="endpoints"
      title="Endpoints"
      subtitle="Manage, monitor, and configure your API routes"
      user={user}
      onGroupCreated={(newGroup) => {
        setGroupList((prev) => [newGroup, ...prev]);
        setExpandedGroups((prev) => new Set(prev).add(newGroup.id));
      }}
      actions={
        <button
          onClick={() => router.push('/endpoints/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Endpoint</span>
        </button>
      }
    >
      <div className="space-y-6">
        {!hasContent ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-5">
              <GlobeAltIcon className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">
              No endpoints yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first API endpoint with the visual flow builder
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
            {/* Search & Filter Bar */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search endpoints by name or slug..."
                  className="w-full pl-9 pr-8 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
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
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
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
                    className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors text-left rounded-t-xl"
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
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteGroupId(group.id);
                          setDeleteGroupName(group.name);
                        }}
                        className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors flex-shrink-0 text-destructive"
                        title="Delete group"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </button>

                    {isExpanded && eps.length > 0 && (
                      <div className="border-t border-border divide-y divide-border">
                        {eps.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 group"
                          >
                            <MethodBadge method={ep.method} />
                            <div
                              onClick={() => router.push(`/endpoints/${ep.id}`)}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {ep.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {ep.slug}
                              </p>
                            </div>

                            <div className="hidden sm:block">
                              <StatusBadge isActive={ep.isActive} />
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleCopyUrl(ep.slug, ep.id, e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-muted-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-border/80 shrink-0"
                              title={`Salin: https://api-sandbox.adysanjaya.my.id/${user?.userHash || ''}/${ep.slug}`}
                            >
                              {copiedId === ep.id ? (
                                <>
                                  <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-500 font-semibold">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  <span className="hidden md:inline">Salin URL</span>
                                </>
                              )}
                            </button>

                            <EndpointActionMenu
                              endpoint={ep}
                              userHash={user?.userHash}
                              groups={groupList}
                              onAssignGroup={handleAssignGroup}
                              onDuplicate={handleDuplicate}
                              onToggleActive={handleToggle}
                              onDelete={handleDelete}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped Endpoints */}
              {filteredUngroupedEndpoints.length > 0 && (
                <div className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="px-4 py-3 bg-muted/20 border-b border-border flex items-center justify-between rounded-t-xl">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Ungrouped Endpoints
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                      {filteredUngroupedEndpoints.length}
                    </span>
                  </div>

                  <div className="divide-y divide-border">
                    {filteredUngroupedEndpoints.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 group"
                      >
                        <MethodBadge method={ep.method} />
                        <div
                          onClick={() => router.push(`/endpoints/${ep.id}`)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {ep.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {ep.slug}
                          </p>
                        </div>

                        <div className="hidden sm:block">
                          <StatusBadge isActive={ep.isActive} />
                        </div>

                        <button
                          type="button"
                          onClick={(e) => handleCopyUrl(ep.slug, ep.id, e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-muted-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all border border-border/80 shrink-0"
                          title={`Salin: https://api-sandbox.adysanjaya.my.id/${user?.userHash || ''}/${ep.slug}`}
                        >
                          {copiedId === ep.id ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <LinkIcon className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Salin URL</span>
                            </>
                          )}
                        </button>

                        <EndpointActionMenu
                          endpoint={ep}
                          userHash={user?.userHash}
                          groups={groupList}
                          onAssignGroup={handleAssignGroup}
                          onDuplicate={handleDuplicate}
                          onToggleActive={handleToggle}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No match state */}
              {searchQuery.trim() &&
                filteredUngroupedEndpoints.length === 0 &&
                groupList.every(
                  (g) =>
                    endpointList.filter(
                      (e) => e.groupId === g.id && matchesFilters(e)
                    ).length === 0
                ) && (
                  <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">
                      No endpoints matched your filter criteria.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterMethod('ALL');
                        setFilterStatus('ALL');
                      }}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
            </div>
          </>
        )}
      </div>

      {/* Delete Endpoint Modal */}
      <Modal
        open={!!deleteEndpointId}
        onOpenChange={(open) => !open && setDeleteEndpointId(null)}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Endpoint</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deleteEndpointName}</strong>?
              This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button
              onClick={() => setDeleteEndpointId(null)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
            >
              Delete Endpoint
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Group Modal */}
      <Modal
        open={!!deleteGroupId}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Group</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete group{' '}
              <strong className="text-foreground">{deleteGroupName}</strong>?
              Endpoints inside this group will be ungrouped, not deleted.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button
              onClick={() => setDeleteGroupId(null)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeleteGroup}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
            >
              Delete Group
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}
