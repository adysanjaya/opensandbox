'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import NodeProperties from './NodeProperties';
import {
  PlayIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  PlusIcon,
  XMarkIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const NODE_PALETTE = [
  { type: 'trigger', label: 'Trigger', icon: PlayIcon, color: 'bg-green-500', description: 'Start of the flow / endpoint' },
  { type: 'condition', label: 'Condition', icon: ArrowPathIcon, color: 'bg-amber-500', description: 'Branching logic' },
  { type: 'validate_input', label: 'Validate Input', icon: ShieldCheckIcon, color: 'bg-red-500', description: 'Validate request body/query/headers' },
  { type: 'variable_check', label: 'Variable Check', icon: CodeBracketIcon, color: 'bg-amber-500', description: 'Check variable value & return error' },
  { type: 'http_request', label: 'HTTP Request', icon: GlobeAltIcon, color: 'bg-purple-500', description: 'Call external API' },
  { type: 'set_variable', label: 'Set Variable', icon: CodeBracketIcon, color: 'bg-cyan-500', description: 'Define variables' },
  { type: 'transform', label: 'Transform', icon: ArrowsRightLeftIcon, color: 'bg-indigo-500', description: 'Transform data' },
  { type: 'delay', label: 'Delay', icon: ClockIcon, color: 'bg-gray-500', description: 'Wait for duration' },
  { type: 'random_split', label: 'A/B Split', icon: ArrowsRightLeftIcon, color: 'bg-indigo-500', description: 'Random branching' },
  { type: 'response', label: 'Response', icon: DocumentArrowUpIcon, color: 'bg-teal-500', description: 'Final HTTP response' },
  { type: 'call_function', label: 'Call Function', icon: CubeIcon, color: 'bg-pink-500', description: 'Reuse a shared function' },
];

interface Props {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

function FlowBuilderInner({ initialNodes = [], initialEdges = [], onChange, readOnly = false }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (!m) setShowSidebar(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (selectedNode) setShowSidebar(true);
  }, [selectedNode]);

  useEffect(() => {
    if (onChange) onChange(nodes, edges);
  }, [nodes, edges, onChange]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const paletteItem = NODE_PALETTE.find((n) => n.type === type);
      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: { label: paletteItem?.label || type },
      };

      // If trigger, auto-set method
      if (type === 'trigger') {
        newNode.data = { ...newNode.data, method: 'GET' };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const duplicateNode = (node: Node) => {
    const newNode = {
      ...node,
      id: `node_${node.type}_${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      selected: false,
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const updated = { ...n, data: { ...n.data, ...newData } };
          if (selectedNode?.id === nodeId) setSelectedNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  const addNodeFromPalette = (type: string) => {
    let position = { x: 100, y: 100 };
    if (reactFlowWrapper.current) {
      const rect = reactFlowWrapper.current.getBoundingClientRect();
      position = screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    const paletteItem = NODE_PALETTE.find((n) => n.type === type);
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: { label: paletteItem?.label || type },
    };
    if (type === 'trigger') newNode.data = { ...newNode.data, method: 'GET' };
    setNodes((nds) => nds.concat(newNode));
    setShowSidebar(false);
  };

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    if (isMobile) setShowSidebar(true);
  }, [isMobile]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    if (isMobile) setShowSidebar(false);
  }, [isMobile]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden relative">
      {isMobile && showSidebar && !readOnly && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setShowSidebar(false)} />
      )}

      {!readOnly && (
        <div className={`bg-card border-r border-border flex flex-col h-full overflow-hidden shadow-sm ${isMobile ? `fixed z-50 transition-transform duration-300 ease-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'} w-full left-0 top-0 bottom-0 shadow-2xl` : 'w-80 lg:w-96'}`}>
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card to-muted/40">
            {selectedNode ? (
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate tracking-tight">Properties</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {NODE_PALETTE.find((n) => n.type === selectedNode.type)?.label || selectedNode.type}
                </p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">Node Palette</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{isMobile ? 'Tap to add' : 'Drag to canvas'}</p>
              </div>
            )}
            {isMobile && (
              <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-muted rounded-xl ml-2 transition-colors">
                <XMarkIcon className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedNode ? (
              <div className="h-full overflow-y-auto p-4">
                <NodeProperties
                  node={selectedNode}
                  onUpdate={(data) => updateNodeData(selectedNode.id, data)}
                  onDelete={() => { deleteNode(selectedNode.id); setSelectedNode(null); }}
                  onDuplicate={() => duplicateNode(selectedNode)}
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-3">
                <div className="grid grid-cols-1 gap-2.5">
                  {NODE_PALETTE.map((item) => (
                    <button
                      key={item.type}
                      draggable={!isMobile}
                      onDragStart={(e) => onDragStart(e, item.type)}
                      onClick={() => isMobile && addNodeFromPalette(item.type)}
                      className="group flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60 text-left transition-all duration-200 w-full shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-muted/70 hover:border-border active:scale-[0.98] cursor-grab active:cursor-grabbing"
                    >
                      <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground tracking-tight">{item.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        {isMobile && !readOnly && (
          <div className="absolute top-4 left-4 z-10">
            <button onClick={() => setShowSidebar(true)} className="p-3 bg-background/95 backdrop-blur-sm shadow-lg rounded-xl border border-border hover:shadow-xl transition-shadow">
              {selectedNode ? <Cog6ToothIcon className="w-5 h-5 text-foreground" /> : <PlusIcon className="w-5 h-5 text-foreground" />}
            </button>
          </div>
        )}

        {isMobile && selectedNode && (
          <div className="absolute top-4 left-20 right-20 z-10">
            <div className="bg-background/95 backdrop-blur-sm shadow-lg rounded-xl border border-border px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground tracking-tight truncate">
                {NODE_PALETTE.find((n) => n.type === selectedNode.type)?.label || selectedNode.type}
              </span>
              <button onClick={() => setSelectedNode(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <XMarkIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes as NodeTypes}
            edgeTypes={edgeTypes as EdgeTypes}
            deleteKeyCode={['Delete', 'Backspace']}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{ animated: true, style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 2 }, selectable: true, focusable: true }}
          >
            <Background color="hsl(var(--muted-foreground) / 0.15)" gap={20} size={1} />
            <Controls className="!bg-muted !border-border/60 !shadow-md !text-foreground" />
            {!isMobile && <MiniMap className="!bg-muted !border-border/60 !shadow-md" nodeStrokeWidth={3} maskColor="hsl(var(--background) / 0.6)" />}
          </ReactFlow>
          {/* Hint bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-4 py-2 bg-card/90 backdrop-blur-md rounded-full border border-border shadow-sm text-[11px] text-muted-foreground">
            <span>Click edge then <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">✕</kbd> to delete</span>
            <span className="w-px h-3 bg-border" />
            <span>Or select edge + <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Delete</kbd></span>
            <span className="w-px h-3 bg-border" />
            <span>Select node + <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">Delete</kbd></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlowBuilder(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
