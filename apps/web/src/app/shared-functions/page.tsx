'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sharedFunctions, auth } from '@/lib/api';
import { PlusIcon, CubeIcon, TrashIcon, PencilIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useSimpleToast } from '@/hooks/useToast';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/modal';

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
    const token = localStorage.getItem('token');
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
      toast.success('Shared function deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete shared function');
    } finally {
      setDeleteFunctionId(null);
      setDeleteFunctionName('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-sm">
              <CubeIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sandbox</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
            >
              <Squares2X2Icon className="w-4 h-4" />
              Dashboard
            </button>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <button
              onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
              className="text-sm text-destructive hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Shared Functions</h2>
          <button
            onClick={() => router.push('/shared-functions/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            New Function
          </button>
        </div>

        {functionList.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border-2 border-border border-dashed shadow-sm">
            <CubeIcon className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No shared functions yet</h3>
            <p className="text-muted-foreground mb-6">Create your first shared function to get started</p>
            <button
              onClick={() => router.push('/shared-functions/new')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
            >
              Create Function
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {functionList.map((fn) => (
              <div
                key={fn.id}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/40 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
              >
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/15 transition-colors">
                  <CubeIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate text-foreground">{fn.name}</h3>
                  {fn.description ? (
                    <p className="text-xs text-muted-foreground truncate">{fn.description}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/70 italic">No description</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    Created {new Date(fn.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push(`/shared-functions/${fn.id}`)}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    title="Edit"
                  >
                    <PencilIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(fn.id, fn.name)}
                    className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
                    title="Delete"
                  >
                    <TrashIcon className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Modal */}
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
              Are you sure you want to delete <strong>{deleteFunctionName}</strong>? This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <button
              onClick={() => {
                setDeleteFunctionId(null);
                setDeleteFunctionName('');
              }}
              className="px-4 py-2 bg-muted rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
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
