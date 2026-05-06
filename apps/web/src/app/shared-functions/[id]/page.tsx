'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { sharedFunctions, auth } from '@/lib/api';
import { useSimpleToast } from '@/hooks/useToast';
import { ArrowDownTrayIcon, ArrowLeftIcon, ArrowPathIcon, CubeIcon } from '@heroicons/react/24/outline';
import type { Node, Edge } from '@xyflow/react';

function FlowBuilderLoader({ initialNodes, initialEdges, onChange }: { initialNodes: Node[]; initialEdges: Edge[]; onChange: (nodes: Node[], edges: Edge[]) => void }) {
  const [Component, setComponent] = useState<any>(null);
  useEffect(() => {
    let mounted = true;
    import('@/components/flow/FlowBuilder').then((mod) => {
      if (mounted) setComponent(() => mod.default);
    });
    return () => { mounted = false; };
  }, []);
  if (!Component) return <div className="flex items-center justify-center h-full"><ArrowPathIcon className="w-8 h-8 animate-spin text-primary" /></div>;
  return <Component initialNodes={initialNodes} initialEdges={initialEdges} onChange={onChange} />;
}

export default function SharedFunctionEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const toast = useSimpleToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    auth.me().then((res) => setUser(res.data)).catch(() => router.push('/login'));

    if (!isNew) {
      sharedFunctions
        .get(id)
        .then((res) => {
          const fn = res.data;
          setName(fn.name);
          setDescription(fn.description || '');
          setNodes(fn.flow?.nodes || []);
          setEdges(fn.flow?.edges || []);
        })
        .catch(() => router.push('/shared-functions'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, isNew, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await sharedFunctions.create({
          name,
          description,
          flow: { nodes, edges },
        });
        toast.success('Shared function created');
        router.push('/shared-functions');
      } else {
        await sharedFunctions.update(id, {
          name,
          description,
          flow: { nodes, edges },
        });
        toast.success('Saved successfully');
        router.push('/shared-functions');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onFlowChange = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-4 shrink-0 shadow-sm">
        <button onClick={() => router.push('/shared-functions')} className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
          <ArrowLeftIcon className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <CubeIcon className="w-5 h-5 text-primary" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Function name"
            className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none w-64 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
            Save
          </button>
        </div>
      </header>

      {/* Description bar */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground font-medium shrink-0 uppercase tracking-wider">Description</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this function does..."
          className="px-2 py-1 border border-border rounded text-sm bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none flex-1 max-w-xl shadow-sm"
        />
      </div>

      {/* Flow Builder */}
      <div className="flex-1 min-h-0">
        <FlowBuilderLoader initialNodes={nodes} initialEdges={edges} onChange={onFlowChange} />
      </div>
    </div>
  );
}
