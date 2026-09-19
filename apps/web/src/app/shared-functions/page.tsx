'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sharedFunctions, auth } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { PlusIcon, CubeIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useSimpleToast } from '@/hooks/useToast';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/modal';

interface SharedFunction {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function SharedFunctionsPage() {
  const router = useRouter();
  const toast = useSimpleToast();
  const [user, setUser] = useState<any>(null);
  const [functionList, setFunctionList] = useState<SharedFunction[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal state
  const [deleteFunctionId, setDeleteFunctionId] = useState<string | null>(null);
  const [deleteFunctionName, setDeleteFunctionName] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([auth.me(), sharedFunctions.list()])
      .then(([userRes, listRes]) => {
        setUser(userRes.data);
        setFunctionList(listRes.data || []);
      })
      .catch(() => {
        localStorage.removeItem('token');
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleDelete(id: string, name: string) {
    setDeleteFunctionId(id);
    setDeleteFunctionName(name);
  }

  async function handleConfirmDelete() {
    if (!deleteFunctionId) return;
    try {
      await sharedFunctions.delete(deleteFunctionId);
      setFunctionList((prev) => prev.filter((f) => f.id !== deleteFunctionId));
      toast.success('Shared function deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete shared function');
    } finally {
      setDeleteFunctionId(null);
      setDeleteFunctionName('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeNav="shared-functions"
      title="Shared Functions"
      subtitle="Reuse modular logic flows and validation across multiple endpoints"
      user={user}
      actions={
        <button
          onClick={() => router.push('/shared-functions/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Function</span>
        </button>
      }
    >
      <div className="space-y-6">
        {functionList.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-5">
              <CubeIcon className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">
              No shared functions yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create reusable sub-flows to share logic across your API endpoints
            </p>
            <button
              onClick={() => router.push('/shared-functions/new')}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all hover:shadow-md active:scale-95"
            >
              Create Function
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {functionList.map((fn) => (
              <div
                key={fn.id}
                className="bg-card rounded-xl border border-border hover:border-primary/40 p-5 transition-all shadow-sm hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/15 text-primary transition-colors">
                      <CubeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/shared-functions/${fn.id}`)}
                        className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                        title="Edit in builder"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fn.id, fn.name)}
                        className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors text-destructive"
                        title="Delete function"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3
                    onClick={() => router.push(`/shared-functions/${fn.id}`)}
                    className="font-bold text-base text-foreground group-hover:text-primary transition-colors cursor-pointer truncate"
                  >
                    {fn.name}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px]">
                    {fn.description || 'No description provided'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Created {new Date(fn.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => router.push(`/shared-functions/${fn.id}`)}
                    className="font-medium text-primary hover:underline"
                  >
                    Open Editor →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteFunctionId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFunctionId(null);
            setDeleteFunctionName('');
          }
        }}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Shared Function</ModalTitle>
            <ModalDescription>
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deleteFunctionName}</strong>?
              Endpoints referencing this function may be affected.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button
              onClick={() => {
                setDeleteFunctionId(null);
                setDeleteFunctionName('');
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
            >
              Delete Function
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}
