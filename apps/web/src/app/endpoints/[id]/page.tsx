'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { endpoints, auth } from '@/lib/api';
import { useSimpleToast } from '@/hooks/useToast';
import { ArrowDownTrayIcon, ArrowLeftIcon, PlayIcon, GlobeAltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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

export default function EndpointEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [method, setMethod] = useState('GET');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
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
      endpoints
        .get(id)
        .then((res) => {
          const ep = res.data;
          setName(ep.name);
          setSlug(ep.slug);
          setMethod(ep.method);
          setNodes(ep.flow?.nodes || []);
          setEdges(ep.flow?.edges || []);
        })
        .catch(() => router.push('/dashboard'))
        .finally(() => setLoading(false));
    } else {
      // Default flow for new endpoint
      setNodes([
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: { label: 'Trigger', method: 'GET' },
        },
        {
          id: 'response_1',
          type: 'response',
          position: { x: 250, y: 300 },
          data: { label: 'Response', responseType: 'json', statusCode: 200, body: '{\n  "message": "Hello from Sandbox!"\n}' },
        },
      ]);
      setEdges([
        {
          id: 'e1',
          source: 'trigger_1',
          target: 'response_1',
          animated: true,
        },
      ]);
      setLoading(false);
    }
  }, [id, isNew, router]);

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    // Validate flow has at least one response node
    const hasResponse = nodes.some((n) => n.type === 'response');
    if (!hasResponse) {
      toast.error('Flow must have at least one Response node');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const res = await endpoints.create({
          name,
          slug,
          method,
          flow: { nodes, edges },
        });
        router.push(`/endpoints/${res.data.id}`);
      } else {
        await endpoints.update(id, {
          name,
          slug,
          method,
          flow: { nodes, edges },
        });
        toast.success('Saved successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!user) return;
    setTesting(true);
    setTestResult(null);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/${user.userHash}/${slug}`;
      const res = await fetch(url, { method });
      const body = await res.text();
      setTestResult({
        status: res.status,
        contentType: res.headers.get('content-type'),
        body,
      });
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTesting(false);
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
        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
          <ArrowLeftIcon className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Endpoint name"
            className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none w-48 shadow-sm"
          />
          <div className="flex items-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-2 py-1.5 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>DELETE</option>
              <option>PATCH</option>
            </select>
            <span className="text-sm text-muted-foreground font-mono">/{user?.userHash}/{slug}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !slug || isNew}
            title={isNew ? 'Save endpoint first before testing' : 'Test endpoint'}
            className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {testing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
            Test
          </button>
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

      {/* URL bar */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-2 shrink-0">
        <GlobeAltIcon className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-_]/gi, ''))}
          placeholder="endpoint-slug"
          className="px-2 py-1 border border-border rounded text-sm font-mono bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none flex-1 max-w-xs shadow-sm"
        />
        {testResult && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${testResult.error ? 'bg-red-50 text-red-700 border-red-200' : testResult.status >= 200 && testResult.status < 300 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {testResult.error ? 'Error' : `HTTP ${testResult.status}`}
          </span>
        )}
      </div>

      {/* Test result */}
      {testResult && (
        <div className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/50">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Test Result</span>
            <button onClick={() => setTestResult(null)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors">Close</button>
          </div>
          <pre className="px-4 py-3 text-xs font-mono bg-muted/50 overflow-auto max-h-40 text-foreground/80">{testResult.error || testResult.body}</pre>
        </div>
      )}

      {/* Flow Builder */}
      <div className="flex-1 min-h-0">
        <FlowBuilderLoader initialNodes={nodes} initialEdges={edges} onChange={onFlowChange} />
      </div>
    </div>
  );
}
