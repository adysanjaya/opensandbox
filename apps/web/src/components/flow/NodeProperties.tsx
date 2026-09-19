'use client';

import { useState } from 'react';
import type { Node } from '@xyflow/react';
import { DocumentDuplicateIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NODE_PALETTE = [
  { type: 'trigger', label: 'Trigger', color: 'bg-green-500' },
  { type: 'condition', label: 'Condition', color: 'bg-amber-500' },
  { type: 'validate_input', label: 'Validate Input', color: 'bg-red-500' },
  { type: 'variable_check', label: 'Variable Check', color: 'bg-amber-500' },
  { type: 'http_request', label: 'HTTP Request', color: 'bg-purple-500' },
  { type: 'set_variable', label: 'Set Variable', color: 'bg-cyan-500' },
  { type: 'transform', label: 'Transform', color: 'bg-indigo-500' },
  { type: 'delay', label: 'Delay', color: 'bg-gray-500' },
  { type: 'random_split', label: 'A/B Split', color: 'bg-indigo-500' },
  { type: 'response', label: 'Response', color: 'bg-teal-500' },
  { type: 'call_function', label: 'Call Function', color: 'bg-pink-500' },
];

interface Props {
  node: Node;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function NodeProperties({ node, onUpdate, onDelete, onDuplicate }: Props) {
  const paletteItem = NODE_PALETTE.find((n) => n.type === node.type);
  const data = (node.data || {}) as Record<string, any>;
  const [varTemplateOpen, setVarTemplateOpen] = useState(false);

  const updateField = (key: string, value: any) => onUpdate({ [key]: value });

  const varTemplates = [
    { label: 'Query param', value: '{{query.paramName}}' },
    { label: 'Header', value: '{{headers.headerName}}' },
    { label: 'Body', value: '{{body}}' },
    { label: 'Variable', value: '{{variables.varName}}' },
    { label: 'Request path', value: '{{request.path}}' },
    { label: 'Request method', value: '{{request.method}}' },
  ];

  function VarInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-9 border border-border rounded-lg text-sm bg-card shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/70 outline-none transition-all"
        />
        <button type="button" onClick={() => setOpen(!open)} className="absolute right-2 top-2 text-muted-foreground hover:text-primary text-xs font-mono transition-colors">
          {'{{}}'}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-8 z-50 w-56 bg-card rounded-lg shadow-xl border border-border py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">Insert Variable</div>
              {varTemplates.map((t) => (
                <button key={t.value} type="button" onClick={() => { onChange(value + t.value); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 flex items-center justify-between transition-colors">
                  <code className="text-primary font-mono text-xs">{t.value}</code>
                  <span className="text-[10px] text-muted-foreground">{t.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-card shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/70 outline-none transition-all";
  const labelClass = "block text-sm font-medium text-foreground/90 mb-1.5";
  const cardClass = "p-4 bg-muted/60 rounded-xl border border-border/60 shadow-sm space-y-3";
  const removeBtnClass = "text-destructive hover:text-red-600 hover:bg-destructive/10 rounded-md p-1 transition-colors";
  const addBtnClass = "w-full px-3 py-2.5 bg-muted hover:bg-muted/70 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-border/50 shadow-sm";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border/50 shadow-sm">
        <div className={`w-10 h-10 ${paletteItem?.color || 'bg-muted-foreground'} rounded-lg flex items-center justify-center shadow-sm`}>
          <span className="text-white text-lg font-bold">{paletteItem?.label?.charAt(0) || '?'}</span>
        </div>
        <div>
          <p className="font-medium text-foreground">{paletteItem?.label || node.type}</p>
          <p className="text-xs text-muted-foreground font-mono">{node.id}</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Label</label>
        <input
          type="text"
          value={typeof data.label === 'string' ? data.label : ''}
          onChange={(e) => updateField('label', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Trigger */}
      {node.type === 'trigger' && (
        <div>
          <label className={labelClass}>HTTP Method</label>
          <select
            value={data.method || 'GET'}
            onChange={(e) => updateField('method', e.target.value)}
            className={inputClass}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
      )}

      {/* Condition */}
      {node.type === 'condition' && (
        <div>
          <label className={labelClass}>Conditions</label>
          <div className="space-y-3">
            {(Array.isArray(data.conditions) ? data.conditions : [{ type: 'default', condition: 'default' }]).map((cond: any, idx: number) => (
              <div key={idx} className={cardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition {idx + 1}</span>
                  <button onClick={() => {
                    const arr = [...(Array.isArray(data.conditions) ? data.conditions : [])];
                    arr.splice(idx, 1);
                    updateField('conditions', arr);
                  }} className={removeBtnClass}><XMarkIcon className="w-4 h-4" /></button>
                </div>
                <select
                  value={cond.type || 'default'}
                  onChange={(e) => {
                    const arr = [...(Array.isArray(data.conditions) ? data.conditions : [])];
                    if (e.target.value === 'default') {
                      arr[idx] = { type: 'default', condition: 'default' };
                    } else {
                      arr[idx] = { ...cond, type: e.target.value };
                    }
                    updateField('conditions', arr);
                  }}
                  className={inputClass}
                >
                  <option value="default">Default (Else)</option>
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                  <option value="regex">Regex</option>
                </select>
                {cond.type !== 'default' && (
                  <input
                    type="text"
                    value={cond.condition || ''}
                    onChange={(e) => {
                      const arr = [...(Array.isArray(data.conditions) ? data.conditions : [])];
                      arr[idx] = { ...cond, condition: e.target.value };
                      updateField('conditions', arr);
                    }}
                    placeholder="Value to compare"
                    className={inputClass}
                  />
                )}
              </div>
            ))}
            <button
              onClick={() => updateField('conditions', [...(Array.isArray(data.conditions) ? data.conditions : []), { type: 'equals', condition: '' }])}
              className={addBtnClass}
            >
              <PlusIcon className="w-4 h-4" /> Add Condition
            </button>
          </div>
        </div>
      )}

      {/* HTTP Request */}
      {node.type === 'http_request' && (
        <>
          <div>
            <label className={labelClass}>Method</label>
            <select value={data.method || 'GET'} onChange={(e) => updateField('method', e.target.value)} className={inputClass}>
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>URL</label>
            <VarInput value={typeof data.url === 'string' ? data.url : ''} onChange={(v) => updateField('url', v)} placeholder="https://api.example.com/endpoint" />
          </div>
          <div>
            <label className={labelClass}>Save Response To Variable</label>
            <input type="text" value={typeof data.saveResponseTo === 'string' ? data.saveResponseTo : ''} onChange={(e) => updateField('saveResponseTo', e.target.value)} placeholder="e.g. apiResponse" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Error Variable (Optional)</label>
            <input type="text" value={typeof data.errorVariable === 'string' ? data.errorVariable : ''} onChange={(e) => updateField('errorVariable', e.target.value)} placeholder="e.g. httpError" className={inputClass} />
          </div>
        </>
      )}

      {/* Set Variable */}
      {node.type === 'set_variable' && (
        <div>
          <label className={labelClass}>Variables</label>
          <div className="space-y-3">
            {(Array.isArray(data.variables) ? data.variables : []).map((v: any, idx: number) => (
              <div key={idx} className="flex gap-2 min-w-0">
                <input type="text" value={v.name || ''} onChange={(e) => {
                  const arr = [...(Array.isArray(data.variables) ? data.variables : [])];
                  arr[idx] = { ...v, name: e.target.value };
                  updateField('variables', arr);
                }} placeholder="Name" className={`${inputClass} flex-1 min-w-0`} />
                <VarInput value={v.value || ''} onChange={(val) => {
                  const arr = [...(Array.isArray(data.variables) ? data.variables : [])];
                  arr[idx] = { ...v, value: val };
                  updateField('variables', arr);
                }} placeholder="Value" />
                <button onClick={() => {
                  const arr = [...(Array.isArray(data.variables) ? data.variables : [])];
                  arr.splice(idx, 1);
                  updateField('variables', arr);
                }} className={`${removeBtnClass} shrink-0 self-center`}><XMarkIcon className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => updateField('variables', [...(Array.isArray(data.variables) ? data.variables : []), { name: '', value: '' }])} className={addBtnClass}>
              <PlusIcon className="w-4 h-4" /> Add Variable
            </button>
          </div>
        </div>
      )}

      {/* Transform */}
      {node.type === 'transform' && (
        <>
          <div>
            <label className={labelClass}>Transform Type</label>
            <select value={data.transformType || 'template'} onChange={(e) => updateField('transformType', e.target.value)} className={inputClass}>
              <option value="template">Template</option>
              <option value="json_path">JSON Path</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="parse_json">Parse JSON</option>
              <option value="stringify">Stringify</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Input Variable</label>
            <input type="text" value={typeof data.inputVariable === 'string' ? data.inputVariable : ''} onChange={(e) => updateField('inputVariable', e.target.value)} placeholder="e.g. apiResponse" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Output Variable</label>
            <input type="text" value={typeof data.outputVariable === 'string' ? data.outputVariable : ''} onChange={(e) => updateField('outputVariable', e.target.value)} placeholder="e.g. result" className={inputClass} />
          </div>
          {data.transformType === 'json_path' && (
            <div>
              <label className={labelClass}>JSON Path</label>
              <input type="text" value={typeof data.jsonPath === 'string' ? data.jsonPath : ''} onChange={(e) => updateField('jsonPath', e.target.value)} placeholder="e.g. data.items[0].name" className={inputClass} />
            </div>
          )}
          {data.transformType === 'template' && (
            <div>
              <label className={labelClass}>Template</label>
              <VarInput value={typeof data.template === 'string' ? data.template : ''} onChange={(v) => updateField('template', v)} placeholder="Hello {{variables.name}}" />
            </div>
          )}
        </>
      )}

      {/* Delay */}
      {node.type === 'delay' && (
        <>
          <div>
            <label className={labelClass}>Duration</label>
            <input type="number" min={0} value={typeof data.duration === 'number' ? data.duration : 1} onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Unit</label>
            <select value={data.unit || 'seconds'} onChange={(e) => updateField('unit', e.target.value)} className={inputClass}>
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        </>
      )}

      {/* Random Split */}
      {node.type === 'random_split' && (
        <div>
          <label className={labelClass}>Branches</label>
          <div className="space-y-3">
            {(Array.isArray(data.branches) ? data.branches : [{ percentage: 50 }, { percentage: 50 }]).map((b: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input type="number" min={1} max={100} value={b.percentage || 0} onChange={(e) => {
                  const arr = [...(Array.isArray(data.branches) ? data.branches : [])];
                  arr[idx] = { ...b, percentage: parseInt(e.target.value) || 0 };
                  updateField('branches', arr);
                }} className={`${inputClass} w-20`} />
                <span className="text-sm text-muted-foreground">%</span>
                <button onClick={() => {
                  const arr = [...(Array.isArray(data.branches) ? data.branches : [])];
                  arr.splice(idx, 1);
                  updateField('branches', arr);
                }} className={removeBtnClass}><XMarkIcon className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => updateField('branches', [...(Array.isArray(data.branches) ? data.branches : []), { percentage: 50 }])} className={addBtnClass}>
              <PlusIcon className="w-4 h-4" /> Add Branch
            </button>
          </div>
        </div>
      )}

      {/* Response */}
      {node.type === 'response' && (
        <>
          <div>
            <label className={labelClass}>Response Type</label>
            <select value={data.responseType || 'json'} onChange={(e) => updateField('responseType', e.target.value)} className={inputClass}>
              <option value="json">JSON</option>
              <option value="text">Plain Text</option>
              <option value="xml">XML</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status Code</label>
            <input type="number" min={100} max={599} value={Number(data.statusCode) || 200} onChange={(e) => updateField('statusCode', parseInt(e.target.value) || 200)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Response Body</label>
            <textarea
              value={typeof data.body === 'string' ? data.body : ''}
              onChange={(e) => updateField('body', e.target.value)}
              rows={6}
              placeholder={data.responseType === 'json' ? '{\n  "message": "Hello {{variables.name}}"\n}' : 'Hello {{variables.name}}'}
              className={`${inputClass} font-mono resize-y`}
            />
          </div>
          <div>
            <label className={labelClass}>Response Headers</label>
            <div className="space-y-3">
              {Object.entries((data.headers as Record<string, string>) || {}).map(([key, value], idx) => (
                <div key={idx} className="flex gap-2 min-w-0">
                  <input type="text" value={key} onChange={(e) => {
                    const entries = Object.entries((data.headers as Record<string, string>) || {});
                    entries[idx] = [e.target.value, value];
                    const newHeaders: Record<string, string> = {};
                    entries.forEach(([k, v]) => { if (k) newHeaders[k] = v; });
                    updateField('headers', newHeaders);
                  }} placeholder="Header" className={`${inputClass} flex-1 min-w-0`} />
                  <input type="text" value={value} onChange={(e) => {
                    const entries = Object.entries((data.headers as Record<string, string>) || {});
                    entries[idx] = [key, e.target.value];
                    const newHeaders: Record<string, string> = {};
                    entries.forEach(([k, v]) => { if (k) newHeaders[k] = v; });
                    updateField('headers', newHeaders);
                  }} placeholder="Value" className={`${inputClass} flex-1 min-w-0`} />
                  <button onClick={() => { const nh = { ...(data.headers || {}) }; delete nh[key]; updateField('headers', nh); }} className={`${removeBtnClass} shrink-0 self-center`}><XMarkIcon className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => { const nh = { ...(data.headers || {}) }; nh[''] = ''; updateField('headers', nh); }} className={addBtnClass}>
                <PlusIcon className="w-4 h-4" /> Add Header
              </button>
            </div>
          </div>
        </>
      )}

      {/* Validate Input */}
      {node.type === 'validate_input' && (
        <div>
          <label className={labelClass}>Validation Rules</label>
          <div className="space-y-3">
            {(Array.isArray(data.rules) ? data.rules : []).map((rule: any, idx: number) => (
              <div key={idx} className={cardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rule {idx + 1}</span>
                  <button onClick={() => {
                    const arr = [...(Array.isArray(data.rules) ? data.rules : [])];
                    arr.splice(idx, 1);
                    updateField('rules', arr);
                  }} className={removeBtnClass}><XMarkIcon className="w-4 h-4" /></button>
                </div>
                <select value={rule.source || 'body'} onChange={(e) => {
                  const arr = [...(Array.isArray(data.rules) ? data.rules : [])];
                  arr[idx] = { ...rule, source: e.target.value };
                  updateField('rules', arr);
                }} className={inputClass}>
                  <option value="body">Body</option>
                  <option value="query">Query Param</option>
                  <option value="headers">Header</option>
                </select>
                <input type="text" value={rule.field || ''} onChange={(e) => {
                  const arr = [...(Array.isArray(data.rules) ? data.rules : [])];
                  arr[idx] = { ...rule, field: e.target.value };
                  updateField('rules', arr);
                }} placeholder="Field name (e.g. phone, user.email)" className={inputClass} />
                <select value={rule.type || 'required'} onChange={(e) => {
                  const arr = [...(Array.isArray(data.rules) ? data.rules : [])];
                  arr[idx] = { ...rule, type: e.target.value };
                  updateField('rules', arr);
                }} className={inputClass}>
                  <option value="required">Required</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="number">Number</option>
                  <option value="minLength">Min Length</option>
                  <option value="maxLength">Max Length</option>
                  <option value="regex">Regex</option>
                  <option value="equals">Equals</option>
                  <option value="contains">Contains</option>
                  <option value="startsWith">Starts With</option>
                  <option value="endsWith">Ends With</option>
                  <option value="json">Valid JSON</option>
                </select>
                {['minLength', 'maxLength', 'regex', 'equals', 'contains', 'startsWith', 'endsWith'].includes(rule.type) && (
                  <input type="text" value={rule.value || ''} onChange={(e) => {
                    const arr = [...(Array.isArray(data.rules) ? data.rules : [])];
                    arr[idx] = { ...rule, value: e.target.value };
                    updateField('rules', arr);
                  }} placeholder="Rule value" className={inputClass} />
                )}
                <input type="text" value={rule.errorMessage || ''} onChange={(e) => {
                  const arr = [...(Array.isArray(data.rules) ? data.rules : [])];
                  arr[idx] = { ...rule, errorMessage: e.target.value };
                  updateField('rules', arr);
                }} placeholder="Error message (optional)" className={inputClass} />
              </div>
            ))}
            <button onClick={() => updateField('rules', [...(Array.isArray(data.rules) ? data.rules : []), { source: 'body', field: '', type: 'required' }])} className={addBtnClass}>
              <PlusIcon className="w-4 h-4" /> Add Rule
            </button>
          </div>

          {/* On Invalid Config */}
          <div className="mt-5 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/60 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">On Invalid Action</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">If no &quot;invalid&quot; branch is connected, these settings control the immediate error response.</p>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Error Body / Message</label>
              <textarea value={typeof data.errorBody === 'string' ? data.errorBody : ''} onChange={(e) => updateField('errorBody', e.target.value)} rows={2} placeholder='e.g. {"error": "Invalid input"}' className={inputClass} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status Code</label>
                <input type="number" min={100} max={599} value={Number(data.errorStatusCode) || 400} onChange={(e) => updateField('errorStatusCode', parseInt(e.target.value) || 400)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Response Type</label>
                <select value={data.errorResponseType || 'json'} onChange={(e) => updateField('errorResponseType', e.target.value)} className={inputClass}>
                  <option value="json">JSON</option>
                  <option value="text">Text</option>
                  <option value="xml">XML</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variable Check */}
      {node.type === 'variable_check' && (
        <>
          <div>
            <label className={labelClass}>Variable Name</label>
            <input type="text" value={typeof data.variableName === 'string' ? data.variableName : ''} onChange={(e) => updateField('variableName', e.target.value)} placeholder="e.g. phone" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Check Type</label>
            <select value={data.checkType || 'exists'} onChange={(e) => updateField('checkType', e.target.value)} className={inputClass}>
              <option value="exists">Exists</option>
              <option value="empty">Is Empty</option>
              <option value="notEmpty">Is Not Empty</option>
              <option value="equals">Equals</option>
              <option value="notEquals">Not Equals</option>
              <option value="contains">Contains</option>
              <option value="startsWith">Starts With</option>
              <option value="endsWith">Ends With</option>
              <option value="regex">Regex Match</option>
              <option value="gt">Greater Than</option>
              <option value="gte">Greater Than or Equal</option>
              <option value="lt">Less Than</option>
              <option value="lte">Less Than or Equal</option>
            </select>
          </div>
          {['equals', 'notEquals', 'contains', 'startsWith', 'endsWith', 'regex', 'gt', 'gte', 'lt', 'lte'].includes(data.checkType) && (
            <div>
              <label className={labelClass}>Check Value</label>
              <input type="text" value={typeof data.checkValue === 'string' ? data.checkValue : ''} onChange={(e) => updateField('checkValue', e.target.value)} placeholder="Value to compare" className={inputClass} />
            </div>
          )}
          <div className="mt-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/60 space-y-3 shadow-sm">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">On Fail Action</p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={data.failReturnResponse === true} onChange={(e) => updateField('failReturnResponse', e.target.checked)} className="mt-0.5 w-4 h-4 text-primary rounded border-border" />
              <span className="text-xs text-foreground leading-relaxed">Return error response immediately (skip fail branch)</span>
            </label>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Error Message</label>
              <textarea value={typeof data.errorMessage === 'string' ? data.errorMessage : ''} onChange={(e) => updateField('errorMessage', e.target.value)} rows={2} placeholder="e.g. nomor telepon tidak valid" className={inputClass} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status Code</label>
                <input type="number" min={100} max={599} value={Number(data.errorStatusCode) || 400} onChange={(e) => updateField('errorStatusCode', parseInt(e.target.value) || 400)} className={inputClass} />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Response Type</label>
                <select value={data.errorResponseType || 'json'} onChange={(e) => updateField('errorResponseType', e.target.value)} className={inputClass}>
                  <option value="json">JSON</option>
                  <option value="text">Text</option>
                  <option value="xml">XML</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Call Function */}
      {node.type === 'call_function' && (
        <>
          <div>
            <label className={labelClass}>Shared Function ID</label>
            <input
              type="text"
              value={typeof data.functionId === 'string' ? data.functionId : ''}
              onChange={(e) => updateField('functionId', e.target.value)}
              placeholder="Paste shared function ID"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Function Name</label>
            <input
              type="text"
              value={typeof data.functionName === 'string' ? data.functionName : ''}
              onChange={(e) => updateField('functionName', e.target.value)}
              placeholder="Display name"
              className={inputClass}
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-5 border-t border-border">
        <button onClick={onDuplicate} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-muted hover:bg-muted/70 rounded-lg text-sm font-medium transition-colors border border-border/50 shadow-sm">
          <DocumentDuplicateIcon className="w-4 h-4" /> Duplicate
        </button>
        <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition-colors border border-destructive/20 shadow-sm">
          <TrashIcon className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
}
