// ─── Flow Node Types ───

export type FlowNodeType =
  | 'trigger'
  | 'condition'
  | 'http_request'
  | 'set_variable'
  | 'transform'
  | 'response'
  | 'delay'
  | 'random_split';

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// ─── Endpoint Types ───

export interface Endpoint {
  id: string;
  userId: string;
  name: string;
  slug: string;
  userHash: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  flow: FlowDefinition;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  apiKey: string;
  createdAt: string;
}

// ─── Execution Context ───

export interface ExecutionContext {
  endpointId: string;
  request: {
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
    path: string;
  };
  variables: Record<string, any>;
}

export interface ExecutionResult {
  statusCode: number;
  contentType: 'text/plain' | 'application/json' | 'application/xml';
  body: string;
  headers?: Record<string, string>;
}

// ─── API Response ───

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
