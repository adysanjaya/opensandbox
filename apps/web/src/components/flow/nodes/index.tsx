'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  PlayIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ShieldCheckIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const COLOR_MAP: Record<string, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  gray: 'bg-gray-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
};

const BORDER_MAP: Record<string, string> = {
  green: 'border-green-500',
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  amber: 'border-amber-500',
  cyan: 'border-cyan-500',
  gray: 'border-gray-500',
  red: 'border-red-500',
  indigo: 'border-indigo-500',
  teal: 'border-teal-500',
  pink: 'border-pink-500',
};

const BG_MAP: Record<string, string> = {
  green: 'bg-green-50',
  blue: 'bg-blue-50',
  purple: 'bg-purple-50',
  amber: 'bg-amber-50',
  cyan: 'bg-cyan-50',
  gray: 'bg-gray-50',
  red: 'bg-red-50',
  indigo: 'bg-indigo-50',
  teal: 'bg-teal-50',
  pink: 'bg-pink-50',
};

interface WrapperProps {
  children: React.ReactNode;
  selected?: boolean;
  color: string;
  icon: React.ReactNode;
  label: string;
  hideSource?: boolean;
  hideTarget?: boolean;
}

const NodeWrapper = memo(({ children, selected, color, icon, label, hideSource, hideTarget }: WrapperProps) => {
  const bg = COLOR_MAP[color] || 'bg-blue-500';
  const border = BORDER_MAP[color] || 'border-blue-500';
  const light = BG_MAP[color] || 'bg-blue-50';

  return (
    <div
      className={`min-w-[200px] max-w-[280px] rounded-xl border transition-all duration-200 ${
        selected
          ? `border-2 ${border} ${light} shadow-lg ring-2 ${border.replace('border-', 'ring-')}/20`
          : 'border-border bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md'
      }`}
    >
      {!hideTarget && (
        <Handle
          type="target"
          position={Position.Top}
          className={`!w-3 !h-3 ${bg} !border-2 !border-card`}
        />
      )}
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className={`p-1.5 ${bg} rounded-lg shadow-sm`}>{icon}</div>
          <span className="font-semibold text-sm text-foreground tracking-tight truncate">{label}</span>
        </div>
        <div className="space-y-1">{children}</div>
      </div>
      {!hideSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-3 !h-3 ${bg} !border-2 !border-card`}
        />
      )}
    </div>
  );
});
NodeWrapper.displayName = 'NodeWrapper';

export const TriggerNode = memo((props: NodeProps) => {
  const data = props.data || {};
  return (
    <NodeWrapper
      selected={props.selected}
      color="green"
      icon={<PlayIcon className="w-4 h-4 text-white" />}
      label={String(data.label || 'Trigger')}
      hideTarget
    >
      <div className="text-xs text-muted-foreground">
        Method: <span className="font-semibold text-foreground">{String(data.method || 'GET')}</span>
      </div>
    </NodeWrapper>
  );
});
TriggerNode.displayName = 'TriggerNode';

export const ConditionNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const conditions = Array.isArray(data.conditions) ? data.conditions : [{ type: 'default' }];

  return (
    <div
      className={`min-w-[260px] rounded-xl border transition-all duration-200 ${
        props.selected
          ? 'border-2 border-amber-500 bg-amber-50 shadow-lg ring-2 ring-amber-500/20'
          : 'border-border bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-amber-500 !border-2 !border-card" />
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 bg-amber-500 rounded-lg shadow-sm">
            <ArrowPathIcon className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight truncate">{String(data.label || 'Condition')}</span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-semibold">
            {conditions.length}
          </span>
        </div>
        <div className="space-y-2">
          {conditions.map((cond: any, idx: number) => (
            <div key={idx} className="relative flex items-center group">
              <div
                className={`text-xs px-3 py-1.5 rounded-lg flex-1 truncate flex items-center gap-2 ${
                  cond.type === 'default'
                    ? 'bg-muted text-muted-foreground border border-border'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                <span className="font-mono text-[10px] bg-card/60 px-1.5 py-0.5 rounded-lg font-medium">{idx + 1}</span>
                <span className="truncate">
                  {cond.type === 'default'
                    ? 'Else'
                    : `${cond.type}: ${cond.condition || ''}`}
                </span>
              </div>
              <Handle
                type="source"
                position={Position.Right}
                id={`condition-${idx}`}
                className="!absolute !right-[-8px] !w-3 !h-3 !bg-amber-500 !border-2 !border-card"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
ConditionNode.displayName = 'ConditionNode';

export const HttpRequestNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const method = String(data.method || 'GET');
  let hostname = 'No URL';
  try {
    hostname = new URL(String(data.url || '')).hostname;
  } catch {
    hostname = String(data.url || '');
  }

  return (
    <NodeWrapper selected={props.selected} color="purple" icon={<GlobeAltIcon className="w-4 h-4 text-white" />} label={String(data.label || 'HTTP Request')}>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${
          method === 'GET' ? 'bg-green-100 text-green-700' :
          method === 'POST' ? 'bg-blue-100 text-blue-700' :
          method === 'PUT' ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {method}
        </span>
        <span className="text-xs text-muted-foreground truncate flex-1">{hostname}</span>
      </div>
    </NodeWrapper>
  );
});
HttpRequestNode.displayName = 'HttpRequestNode';

export const SetVariableNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const vars = Array.isArray(data.variables) ? data.variables : [];
  return (
    <NodeWrapper selected={props.selected} color="cyan" icon={<CodeBracketIcon className="w-4 h-4 text-white" />} label={String(data.label || 'Set Variable')}>
      <div className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{vars.length}</span> variable{vars.length !== 1 ? 's' : ''} set
      </div>
    </NodeWrapper>
  );
});
SetVariableNode.displayName = 'SetVariableNode';

export const TransformNode = memo((props: NodeProps) => {
  const data = props.data || {};
  return (
    <NodeWrapper selected={props.selected} color="indigo" icon={<ArrowsRightLeftIcon className="w-4 h-4 text-white" />} label={String(data.label || 'Transform')}>
      <div className="text-xs text-muted-foreground capitalize">
        Type: <span className="font-medium text-foreground">{String(data.transformType || 'template')}</span>
      </div>
    </NodeWrapper>
  );
});
TransformNode.displayName = 'TransformNode';

export const DelayNode = memo((props: NodeProps) => {
  const data = props.data || {};
  return (
    <NodeWrapper selected={props.selected} color="gray" icon={<ClockIcon className="w-4 h-4 text-white" />} label={String(data.label || 'Delay')}>
      <div className="text-xs text-muted-foreground">
        Wait <span className="font-semibold text-foreground">{Number(data.duration || 1)} {String(data.unit || 'seconds')}</span>
      </div>
    </NodeWrapper>
  );
});
DelayNode.displayName = 'DelayNode';

export const RandomSplitNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const branches = Array.isArray(data.branches) ? data.branches : [{ percentage: 50 }, { percentage: 50 }];

  return (
    <div className={`min-w-[220px] rounded-xl border transition-all duration-200 ${
      props.selected ? 'border-2 border-indigo-500 bg-indigo-50 shadow-lg ring-2 ring-indigo-500/20' : 'border-border bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md'
    }`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-card" />
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 bg-indigo-500 rounded-lg shadow-sm"><ArrowsRightLeftIcon className="w-4 h-4 text-white" /></div>
          <span className="font-semibold text-sm text-foreground tracking-tight truncate">{String(data.label || 'A/B Split')}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex mb-2">
          {branches.map((b: any, i: number) => (
            <div key={i} className={`h-full ${['bg-indigo-500','bg-indigo-400','bg-indigo-300','bg-purple-300'][i%4]}`} style={{ width: `${b.percentage}%` }} />
          ))}
        </div>
        <div className="flex gap-1">
          {branches.map((_: any, i: number) => (
            <div key={i} className="relative flex-1">
              <div className="text-xs bg-indigo-100 text-indigo-700 px-1 py-1 rounded-lg text-center font-medium">{branches[i].percentage}%</div>
              <Handle type="source" position={Position.Bottom} id={`branch-${i}`} className="!absolute !left-1/2 !-translate-x-1/2 !bottom-[-8px] !w-3 !h-3 !bg-indigo-500 !border-2 !border-card" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
RandomSplitNode.displayName = 'RandomSplitNode';

export const ResponseNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const responseType = String(data.responseType || 'json');
  const statusCode = Number(data.statusCode) || 200;

  const typeColors: Record<string, string> = {
    json: 'bg-blue-100 text-blue-700',
    text: 'bg-gray-100 text-gray-700',
    xml: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className={`min-w-[180px] rounded-xl border transition-all duration-200 ${
      props.selected ? 'border-2 border-teal-500 bg-teal-50 shadow-lg ring-2 ring-teal-500/20' : 'border-border bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md'
    }`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-teal-500 !border-2 !border-card" />
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="p-1.5 bg-teal-500 rounded-lg shadow-sm"><DocumentArrowUpIcon className="w-4 h-4 text-white" /></div>
          <span className="font-semibold text-sm text-foreground tracking-tight truncate">{String(data.label || 'Response')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${typeColors[responseType] || typeColors.json}`}>
            {responseType.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">HTTP {statusCode}</span>
        </div>
      </div>
    </div>
  );
});
ResponseNode.displayName = 'ResponseNode';

export const ValidateInputNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const rules = Array.isArray(data.rules) ? data.rules : [];
  return (
    <div className={`min-w-[220px] rounded-xl border transition-all duration-200 ${
      props.selected ? 'border-2 border-red-500 bg-red-50 shadow-lg ring-2 ring-red-500/20' : 'border-border bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md'
    }`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-red-500 !border-2 !border-card" />
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 bg-red-500 rounded-lg shadow-sm"><ShieldCheckIcon className="w-4 h-4 text-white" /></div>
          <span className="font-semibold text-sm text-foreground tracking-tight truncate">{String(data.label || 'Validate Input')}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          <span className="font-semibold text-foreground">{rules.length}</span> rule{rules.length !== 1 ? 's' : ''}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between relative">
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">valid</span>
            <Handle
              type="source"
              position={Position.Right}
              id="valid"
              className="!absolute !right-[-8px] !w-3 !h-3 !bg-green-500 !border-2 !border-card"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
          <div className="flex items-center justify-between relative">
            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">invalid</span>
            <Handle
              type="source"
              position={Position.Right}
              id="invalid"
              className="!absolute !right-[-8px] !w-3 !h-3 !bg-red-500 !border-2 !border-card"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
ValidateInputNode.displayName = 'ValidateInputNode';

export const VariableCheckNode = memo((props: NodeProps) => {
  const data = props.data || {};
  const varName = String(data.variableName || 'var');
  const checkType = String(data.checkType || 'exists');
  return (
    <NodeWrapper selected={props.selected} color="amber" icon={<CodeBracketIcon className="w-4 h-4 text-white" />} label={String(data.label || 'Variable Check')}>
      <div className="text-xs text-muted-foreground font-mono">
        <span className="font-semibold text-foreground">{varName}</span> <span className="text-muted-foreground">{checkType}</span>
      </div>
      <div className="flex gap-1 mt-1">
        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">pass</span>
        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">fail</span>
      </div>
    </NodeWrapper>
  );
});
VariableCheckNode.displayName = 'VariableCheckNode';

export const CallFunctionNode = memo((props: NodeProps) => {
  const data = props.data || {};
  return (
    <NodeWrapper selected={props.selected} color="pink" icon={<CubeIcon className="w-4 h-4 text-white" />} label={String(data.label || 'Call Function')}>
      <div className="text-xs text-muted-foreground font-mono truncate">
        <span className="font-semibold text-foreground">{String(data.functionName || data.functionId || '—')}</span>
      </div>
    </NodeWrapper>
  );
});
CallFunctionNode.displayName = 'CallFunctionNode';

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  http_request: HttpRequestNode,
  set_variable: SetVariableNode,
  transform: TransformNode,
  delay: DelayNode,
  random_split: RandomSplitNode,
  response: ResponseNode,
  validate_input: ValidateInputNode,
  variable_check: VariableCheckNode,
  call_function: CallFunctionNode,
};
